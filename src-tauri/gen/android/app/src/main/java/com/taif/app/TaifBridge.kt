package com.taif.app

import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.provider.OpenableColumns
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.MimeTypeMap
import android.webkit.WebView
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import com.yausername.ffmpeg.FFmpeg
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLRequest
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.InputStream
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import kotlin.concurrent.thread

/**
 * Native engine for the Android build.
 *
 * Desktop TAIF launches ffmpeg / ffprobe / yt-dlp / Spleeter as sidecar
 * processes. Android cannot ship sidecars, so this bridge exposes the same
 * "run a tool with an argument list and stream its output" contract to the
 * web UI (`window.TaifAndroid`), backed by:
 *   - ffmpeg / ffprobe: real executables from the youtubedl-android ffmpeg
 *     module, started from the app's native library directory;
 *   - yt-dlp: the youtubedl-android library (bundled Python + yt-dlp);
 *   - Spleeter: on-device ONNX inference (see [Spleeter]).
 *
 * Results are pushed back to JavaScript through `window.__taifEngine(json)`.
 */
class TaifBridge(private val activity: MainActivity) {
  private var webView: WebView? = null
  private val pool = Executors.newCachedThreadPool()
  private val processes = ConcurrentHashMap<String, Process>()
  private val cancelled = ConcurrentHashMap.newKeySet<String>()
  private val lock = Any()
  private var ffmpegReady = false
  private var ytDlpReady = false

  private var pendingPickId: String? = null
  private val pickLauncher: ActivityResultLauncher<Array<String>> =
    activity.registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
      val id = pendingPickId
      pendingPickId = null
      if (id != null) onPicked(id, uri)
    }

  fun attach(view: WebView) {
    webView = view
    view.addJavascriptInterface(this, "TaifAndroid")
  }

  /** Set by the web UI once its first frame is painted (dismisses the system splash). */
  @Volatile
  var ready = false
    private set

  @JavascriptInterface
  fun appReady() {
    ready = true
  }

  /** Asks the web UI to handle Back; [done] gets true when it did. */
  fun handleBack(done: (Boolean) -> Unit) {
    val view = webView
    if (view == null) {
      done(false)
      return
    }
    view.evaluateJavascript("(function(){return !!(window.__taifBack && window.__taifBack());})()") {
      done(it == "true")
    }
  }

  fun shutdown() {
    processes.values.forEach { it.destroyForcibly() }
    pool.shutdownNow()
  }

  // ---- events to JavaScript ------------------------------------------------

  private fun emit(event: JSONObject) {
    val js = "window.__taifEngine && window.__taifEngine(${JSONObject.quote(event.toString())})"
    webView?.post { webView?.evaluateJavascript(js, null) }
  }

  private fun emit(id: String, type: String, block: JSONObject.() -> Unit = {}) {
    emit(JSONObject().put("id", id).put("type", type).apply(block))
  }

  // ---- tool execution ------------------------------------------------------

  /** Directory holding the unpacked ffmpeg shared libraries. */
  private fun ffmpegLibDir(): File {
    val root = File(activity.noBackupFilesDir, "youtubedl-android/packages/ffmpeg")
    return root.walkTopDown().firstOrNull { it.isFile && it.name.startsWith("libavcodec") }
      ?.parentFile ?: File(root, "usr/lib")
  }

  private fun packagesRoot() = File(activity.noBackupFilesDir, "youtubedl-android/packages")

  /**
   * ffmpeg's libraries depend on shared libs that only ship inside the bundled
   * Python package (e.g. libexpat), so Python is unpacked too and its lib dir
   * joins the loader path.
   */
  private fun ensureFfmpeg() = synchronized(lock) {
    if (!ffmpegReady) {
      FFmpeg.getInstance().init(activity.applicationContext)
      YoutubeDL.getInstance().init(activity.applicationContext)
      ytDlpReady = true
      ffmpegReady = true
    }
  }

  private fun ffmpegLoaderPath(): String = listOf(
    ffmpegLibDir().absolutePath,
    File(packagesRoot(), "python/usr/lib").absolutePath,
    activity.applicationInfo.nativeLibraryDir,
  ).joinToString(":")

  private fun ensureYtDlp() = synchronized(lock) {
    if (!ytDlpReady) {
      YoutubeDL.getInstance().init(activity.applicationContext)
      ytDlpReady = true
    }
    ensureFfmpeg()
  }

  /**
   * Starts a tool. Events: stdout / stderr {data}, close {code, signal}, error {message}.
   * [argsJson] is a JSON array of strings, exactly like the desktop sidecar args.
   */
  @JavascriptInterface
  fun run(id: String, tool: String, argsJson: String) {
    pool.execute {
      try {
        val array = JSONArray(argsJson)
        val args = List(array.length()) { array.getString(it) }
        when (tool) {
          "ffmpeg", "ffprobe" -> runNative(id, tool, args)
          "ytdlp" -> runYtDlp(id, args)
          "spleeter" -> runSpleeter(id, args)
          else -> emit(id, "error") { put("message", "Unknown tool: $tool") }
        }
      } catch (t: Throwable) {
        Log.e(TAG, "run($tool) failed", t)
        emit(id, "error") { put("message", t.message ?: t.javaClass.simpleName) }
      }
    }
  }

  @JavascriptInterface
  fun kill(id: String) {
    cancelled.add(id)
    processes[id]?.let {
      it.destroy()
      pool.execute {
        // Give ffmpeg a moment to exit cleanly, then make sure it is gone.
        Thread.sleep(700)
        if (it.isAlive) it.destroyForcibly()
      }
    }
    runCatching { YoutubeDL.getInstance().destroyProcessById(id) }
    Spleeter.cancel(id)
  }

  private fun runNative(id: String, tool: String, args: List<String>) {
    ensureFfmpeg()
    val bin = File(activity.applicationInfo.nativeLibraryDir, "lib$tool.so")
    val builder = ProcessBuilder(listOf(bin.absolutePath) + args)
    // ffmpeg's unpacked libraries need libc++_shared.so from the app's native lib dir.
    builder.environment()["LD_LIBRARY_PATH"] = ffmpegLoaderPath()
    builder.environment()["TMPDIR"] = activity.cacheDir.absolutePath
    val process = builder.start()
    processes[id] = process
    val out = thread { pump(process.inputStream, id, "stdout") }
    val err = thread { pump(process.errorStream, id, "stderr") }
    val code = process.waitFor()
    out.join()
    err.join()
    processes.remove(id)
    emit(id, "close") {
      put("code", code)
      if (cancelled.remove(id)) put("signal", 15)
    }
  }

  /** Streams a process pipe as text chunks split on \n and \r (ffmpeg progress uses \r). */
  private fun pump(stream: InputStream, id: String, type: String) {
    val buffer = StringBuilder()
    val bytes = ByteArray(4096)
    stream.use {
      while (true) {
        val n = it.read(bytes)
        if (n < 0) break
        for (i in 0 until n) {
          val ch = bytes[i].toInt().toChar()
          buffer.append(ch)
          if (ch == '\n' || ch == '\r') {
            val line = String(buffer.toString().toByteArray(Charsets.ISO_8859_1), Charsets.UTF_8)
            emit(id, type) { put("data", line) }
            buffer.setLength(0)
          }
        }
      }
    }
    if (buffer.isNotEmpty()) {
      val line = String(buffer.toString().toByteArray(Charsets.ISO_8859_1), Charsets.UTF_8)
      emit(id, type) { put("data", line) }
    }
  }

  /**
   * YouTube changes constantly and the yt-dlp inside the APK goes stale fast
   * (an old build gets "HTTP 403"), so refresh it at most once a day.
   */
  private fun updateYtDlpIfStale(id: String) {
    val prefs = activity.getSharedPreferences("taif_engine", android.content.Context.MODE_PRIVATE)
    val last = prefs.getLong("ytdlp_updated_at", 0L)
    if (System.currentTimeMillis() - last < 24L * 60 * 60 * 1000) return
    emit(id, "stderr") { put("data", "Updating yt-dlp...\n") }
    val status = try {
      YoutubeDL.getInstance().updateYoutubeDL(
        activity.applicationContext,
        YoutubeDL.UpdateChannel.NIGHTLY,
      )
    } catch (t: Throwable) {
      Log.w(TAG, "yt-dlp nightly update failed, trying stable", t)
      try {
        YoutubeDL.getInstance().updateYoutubeDL(
          activity.applicationContext,
          YoutubeDL.UpdateChannel.STABLE,
        )
      } catch (t2: Throwable) {
        Log.w(TAG, "yt-dlp update failed", t2)
        null
      }
    }
    if (status != null) prefs.edit().putLong("ytdlp_updated_at", System.currentTimeMillis()).apply()
    Log.i(TAG, "yt-dlp update status: $status")
  }

  private fun runYtDlp(id: String, args: List<String>) {
    ensureYtDlp()
    updateYtDlpIfStale(id)
    // The desktop command self-updates the sidecar; the bundled build cannot.
    val cleaned = args.filter { it != "--update" }
    val request = YoutubeDLRequest(emptyList()).addCommands(cleaned)
    try {
      val response = YoutubeDL.getInstance().execute(request, id) { _, _, line ->
        if (line.isNotEmpty()) emit(id, "stdout") { put("data", line + "\n") }
      }
      // Lines already streamed above; the final output is only needed for errors.
      emit(id, "close") { put("code", response.exitCode) }
    } catch (e: YoutubeDL.CanceledException) {
      emit(id, "close") { put("code", 143); put("signal", 15) }
    } catch (e: Exception) {
      emit(id, "stderr") { put("data", (e.message ?: "yt-dlp failed") + "\n") }
      emit(id, "close") { put("code", 1) }
    }
    cancelled.remove(id)
  }

  private fun runSpleeter(id: String, args: List<String>) {
    // args: <input.pcm> <output dir> <duration seconds> <chunk seconds>
    if (args.size < 3) {
      emit(id, "stderr") { put("data", "Processing failed: bad arguments\n") }
      emit(id, "close") { put("code", 2) }
      return
    }
    // The desktop executable appends ".pcm" to its output argument.
    val outputPcm = File(if (args[1].endsWith(".pcm")) args[1] else args[1] + ".pcm")
    val code = Spleeter.separate(
      activity.applicationContext,
      id,
      File(args[0]),
      outputPcm,
    ) { line -> emit(id, "stdout") { put("data", line + "\n") } }
    emit(id, "close") {
      put("code", code)
      if (cancelled.remove(id)) put("signal", 15)
    }
  }

  // ---- files ---------------------------------------------------------------

  /** Opens the system document picker; copies the choice into app cache. */
  @JavascriptInterface
  fun pickMedia(id: String, kind: String) {
    val mimes = if (kind == "image") arrayOf("image/*") else arrayOf("video/*", "audio/*", "image/*")
    activity.runOnUiThread {
      pendingPickId = id
      pickLauncher.launch(mimes)
    }
  }

  private fun onPicked(id: String, uri: Uri?) {
    if (uri == null) {
      emit(id, "picked") { put("path", JSONObject.NULL) }
      return
    }
    pool.execute {
      try {
        val name = displayName(uri) ?: "media"
        val dir = File(activity.cacheDir, "imports/${System.currentTimeMillis()}").apply { mkdirs() }
        val target = File(dir, name.replace(Regex("[\\\\/:*?\"<>|]"), "_"))
        activity.contentResolver.openInputStream(uri).use { input ->
          requireNotNull(input) { "Cannot open selected file" }
          target.outputStream().use { input.copyTo(it) }
        }
        emit(id, "picked") { put("path", target.absolutePath); put("name", target.name) }
      } catch (t: Throwable) {
        Log.e(TAG, "pick failed", t)
        emit(id, "picked") { put("path", JSONObject.NULL); put("message", t.message ?: "") }
      }
    }
  }

  private fun displayName(uri: Uri): String? =
    activity.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)
      ?.use { c -> if (c.moveToFirst()) c.getString(0) else null }

  /**
   * Publishes a finished file to the shared media library (Movies/Music/Pictures + "TAIF")
   * through MediaStore. Needs no storage permission on Android 10+.
   */
  @JavascriptInterface
  fun saveOutput(id: String, path: String) {
    pool.execute {
      try {
        val file = File(path)
        val ext = file.extension.lowercase()
        val mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext) ?: "application/octet-stream"
        val (collection, folder) = when {
          mime.startsWith("video/") ->
            MediaStore.Video.Media.EXTERNAL_CONTENT_URI to Environment.DIRECTORY_MOVIES
          mime.startsWith("audio/") ->
            MediaStore.Audio.Media.EXTERNAL_CONTENT_URI to Environment.DIRECTORY_MUSIC
          mime.startsWith("image/") ->
            MediaStore.Images.Media.EXTERNAL_CONTENT_URI to Environment.DIRECTORY_PICTURES
          else -> MediaStore.Downloads.EXTERNAL_CONTENT_URI to Environment.DIRECTORY_DOWNLOADS
        }
        val location = "$folder/TAIF"
        val values = ContentValues().apply {
          put(MediaStore.MediaColumns.DISPLAY_NAME, file.name)
          put(MediaStore.MediaColumns.MIME_TYPE, mime)
          put(MediaStore.MediaColumns.RELATIVE_PATH, location)
          put(MediaStore.MediaColumns.IS_PENDING, 1)
        }
        val resolver = activity.contentResolver
        val uri = requireNotNull(resolver.insert(collection, values)) { "Could not create output file" }
        resolver.openOutputStream(uri).use { out ->
          requireNotNull(out) { "Could not open output file" }
          file.inputStream().use { it.copyTo(out) }
        }
        values.clear()
        values.put(MediaStore.MediaColumns.IS_PENDING, 0)
        resolver.update(uri, values, null, null)
        emit(id, "saved") {
          put("uri", uri.toString())
          put("mime", mime)
          put("location", location)
          put("name", file.name)
        }
      } catch (t: Throwable) {
        Log.e(TAG, "save failed", t)
        emit(id, "saved") { put("uri", JSONObject.NULL); put("message", t.message ?: "") }
      }
    }
  }

  /** Opens (or shares) a content URI returned by [saveOutput]. */
  @JavascriptInterface
  fun openUri(uri: String, mime: String, share: Boolean) {
    activity.runOnUiThread {
      try {
        val parsed = Uri.parse(uri)
        val intent = if (share) {
          Intent.createChooser(
            Intent(Intent.ACTION_SEND).apply {
              type = mime
              putExtra(Intent.EXTRA_STREAM, parsed)
              addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            },
            null,
          )
        } else {
          Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(parsed, mime)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
          }
        }
        activity.startActivity(intent)
      } catch (t: Throwable) {
        Log.e(TAG, "open failed", t)
      }
    }
  }

  /** Opens an http(s) link in the browser. */
  @JavascriptInterface
  fun openUrl(url: String) {
    val uri = Uri.parse(url)
    if (uri.scheme != "https" && uri.scheme != "http") return
    activity.runOnUiThread {
      try {
        activity.startActivity(Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      } catch (t: Throwable) {
        Log.e(TAG, "openUrl failed", t)
      }
    }
  }

  @JavascriptInterface
  fun info(): String = JSONObject()
    .put("sdk", Build.VERSION.SDK_INT)
    .put("abi", Build.SUPPORTED_ABIS.firstOrNull() ?: "")
    .put("cacheDir", activity.cacheDir.absolutePath)
    .put("filesDir", activity.filesDir.absolutePath)
    .toString()

  companion object {
    private const val TAG = "TaifBridge"
  }
}
