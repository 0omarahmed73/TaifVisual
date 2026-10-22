package com.taif.app

import ai.onnxruntime.OnnxTensor
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession
import android.content.Context
import java.io.BufferedOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.RandomAccessFile
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import java.util.concurrent.ConcurrentHashMap
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin

/**
 * On-device vocal separation ("Remove Music") with the Spleeter 2-stem vocals
 * model exported to ONNX (k2-fsa / sherpa-onnx export of deezer/spleeter).
 *
 * Input/output are raw 44.1 kHz stereo float32 little-endian PCM, exactly what
 * the desktop Spleeter executable consumes, so the web layer is unchanged.
 *
 * Pipeline per 512-frame chunk (~11.9 s): STFT (4096 / hop 1024, Hann) ->
 * magnitude of the first 1024 bins -> model -> soft mask -> masked STFT ->
 * inverse STFT with overlap-add. Chunks are streamed so memory stays flat
 * for long recordings.
 */
object Spleeter {
  private const val N_FFT = 4096
  private const val HOP = 1024
  private const val BINS = 1024
  private const val CHUNK = 512
  private const val EPS = 1e-10f

  private val cancelled = ConcurrentHashMap.newKeySet<String>()

  fun cancel(id: String) {
    cancelled.add(id)
  }

  /** Returns a process-style exit code: 0 ok, 143 cancelled, other = failure. */
  fun separate(
    context: Context,
    id: String,
    inputPcm: File,
    outputPcm: File,
    log: (String) -> Unit,
  ): Int {
    cancelled.remove(id)
    try {
      val totalSamples = (inputPcm.length() / 8).toInt() // stereo float32
      if (totalSamples < 2) {
        log("Processing failed: input is empty")
        return 2
      }
      outputPcm.parentFile?.mkdirs()
      val modelBytes = context.assets.open("models/vocals.onnx").use { it.readBytes() }
      val env = OrtEnvironment.getEnvironment()
      val options = OrtSession.SessionOptions().apply {
        setIntraOpNumThreads(min(4, max(2, Runtime.getRuntime().availableProcessors() / 2)))
        setOptimizationLevel(OrtSession.SessionOptions.OptLevel.ALL_OPT)
      }
      log("Progress: 0%")
      env.createSession(modelBytes, options).use { session ->
        run(env, session, id, inputPcm, outputPcm, totalSamples, log)
      }
      if (cancelled.remove(id)) {
        outputPcm.delete()
        return 143
      }
      log("Progress: 100%")
      return 0
    } catch (t: Throwable) {
      outputPcm.delete()
      log("Processing failed: ${t.message ?: t.javaClass.simpleName}")
      return 1
    }
  }

  private fun run(
    env: OrtEnvironment,
    session: OrtSession,
    id: String,
    inputPcm: File,
    outputPcm: File,
    length: Int,
    log: (String) -> Unit,
  ) {
    val fft = Fft(N_FFT)
    val window = FloatArray(N_FFT) { (0.5 - 0.5 * cos(2.0 * PI * it / N_FFT)).toFloat() }
    val frames = 1 + length / HOP
    val chunks = (frames + CHUNK - 1) / CHUNK

    // Per-chunk working memory (allocated once).
    val specRe = Array(2) { FloatArray(CHUNK * BINS) }
    val specIm = Array(2) { FloatArray(CHUNK * BINS) }
    val model = FloatArray(2 * CHUNK * BINS)
    val sig = Array(2) { FloatArray((CHUNK - 1) * HOP + N_FFT) }
    val re = DoubleArray(N_FFT)
    val im = DoubleArray(N_FFT)

    // Streaming overlap-add buffers (padded coordinates, offset = first frame start).
    val accLen = CHUNK * HOP + N_FFT
    val acc = Array(2) { FloatArray(accLen) }
    val wsum = FloatArray(accLen)
    val outBuf = ByteBuffer.allocate(HOP * 8 * 64).order(ByteOrder.LITTLE_ENDIAN)

    RandomAccessFile(inputPcm, "r").use { input ->
      BufferedOutputStream(FileOutputStream(outputPcm), 1 shl 20).use { out ->
        var written = 0 // real samples already written
        for (chunk in 0 until chunks) {
          if (cancelled.contains(id)) return
          val f0 = chunk * CHUNK
          val nf = min(CHUNK, frames - f0)
          val span = (nf - 1) * HOP + N_FFT
          readPadded(input, length, f0 * HOP - N_FFT / 2, span, sig)

          // ---- analysis ----
          model.fill(0f)
          for (j in 0 until nf) {
            val base = j * HOP
            for (n in 0 until N_FFT) {
              re[n] = (sig[0][base + n] * window[n]).toDouble()
              im[n] = (sig[1][base + n] * window[n]).toDouble()
            }
            fft.transform(re, im, inverse = false)
            for (k in 0 until BINS) {
              val nk = (N_FFT - k) and (N_FFT - 1)
              val zr = re[k]; val zi = im[k]; val nr = re[nk]; val ni = im[nk]
              val a0 = ((zr + nr) * 0.5).toFloat()
              val b0 = ((zi - ni) * 0.5).toFloat()
              val a1 = ((zi + ni) * 0.5).toFloat()
              val b1 = ((nr - zr) * 0.5).toFloat()
              val idx = j * BINS + k
              specRe[0][idx] = a0; specIm[0][idx] = b0
              specRe[1][idx] = a1; specIm[1][idx] = b1
              model[idx] = kotlin.math.sqrt(a0 * a0 + b0 * b0)
              model[CHUNK * BINS + idx] = kotlin.math.sqrt(a1 * a1 + b1 * b1)
            }
          }

          // ---- inference ----
          val shape = longArrayOf(2, 1, CHUNK.toLong(), BINS.toLong())
          val y: FloatBuffer = OnnxTensor.createTensor(env, FloatBuffer.wrap(model), shape).use { tensor ->
            session.run(mapOf("x" to tensor)).use { result ->
              val flat = (result[0] as OnnxTensor).floatBuffer
              FloatBuffer.allocate(2 * CHUNK * BINS).also { it.put(flat); it.rewind() }
            }
          }

          // ---- masking + synthesis ----
          for (j in 0 until nf) {
            re.fill(0.0); im.fill(0.0)
            for (k in 0 until BINS) {
              val idx = j * BINS + k
              val m0 = softMask(y.get(idx), model[idx])
              val m1 = softMask(y.get(CHUNK * BINS + idx), model[CHUNK * BINS + idx])
              val a0 = specRe[0][idx] * m0; val b0 = specIm[0][idx] * m0
              val a1 = specRe[1][idx] * m1; val b1 = specIm[1][idx] * m1
              re[k] = (a0 - b1).toDouble(); im[k] = (b0 + a1).toDouble()
              if (k > 0) {
                val nk = N_FFT - k
                re[nk] = (a0 + b1).toDouble(); im[nk] = (a1 - b0).toDouble()
              }
            }
            fft.transform(re, im, inverse = true)
            val base = j * HOP
            for (n in 0 until N_FFT) {
              val w = window[n]
              acc[0][base + n] += (re[n] * w).toFloat()
              acc[1][base + n] += (im[n] * w).toFloat()
              wsum[base + n] += w * w
            }
          }

          // ---- emit finished samples, keep the overlap tail ----
          val finalPadded = if (chunk == chunks - 1) span else nf * HOP
          // padded index p maps to real sample p + f0*HOP - N_FFT/2
          val firstReal = f0 * HOP - N_FFT / 2
          for (p in 0 until finalPadded) {
            val real = firstReal + p
            if (real < written) continue
            if (real >= length) break
            val w = wsum[p]
            val inv = if (w > 1e-8f) 1f / w else 0f
            outBuf.putFloat(acc[0][p] * inv)
            outBuf.putFloat(acc[1][p] * inv)
            written++
            if (!outBuf.hasRemaining()) {
              out.write(outBuf.array(), 0, outBuf.position()); outBuf.clear()
            }
          }
          if (outBuf.position() > 0) {
            out.write(outBuf.array(), 0, outBuf.position()); outBuf.clear()
          }
          // shift the unfinished tail to the front for the next chunk
          if (chunk < chunks - 1) {
            val keep = accLen - finalPadded
            for (c in 0..1) {
              System.arraycopy(acc[c], finalPadded, acc[c], 0, keep)
              acc[c].fill(0f, keep, accLen)
            }
            System.arraycopy(wsum, finalPadded, wsum, 0, keep)
            wsum.fill(0f, keep, accLen)
          }
          log("Progress: ${((chunk + 1) * 100.0 / chunks).let { String.format(java.util.Locale.US, "%.1f", it) }}%")
        }
      }
    }
  }

  /** Vocals soft mask using the residual as the accompaniment estimate. */
  private fun softMask(vocals: Float, mixture: Float): Float {
    val residual = max(mixture - vocals, 0f)
    val v2 = vocals * vocals
    return (v2 + EPS / 2) / (v2 + residual * residual + EPS)
  }

  /**
   * Reads [count] samples starting at real index [start] (may be negative or run
   * past the end), reflecting at the borders like STFT center padding.
   */
  private fun readPadded(
    file: RandomAccessFile,
    length: Int,
    start: Int,
    count: Int,
    dest: Array<FloatArray>,
  ) {
    fun reflect(i: Int): Int {
      var r = i
      while (r < 0 || r >= length) {
        if (r < 0) r = -r
        if (r >= length) r = 2 * (length - 1) - r
        if (length == 1) return 0
      }
      return r
    }
    // Range of real samples that the (reflected) request touches.
    val end = start + count - 1
    var lo: Int
    var hi: Int
    if (length < N_FFT) {
      lo = 0; hi = length - 1 // tiny input: reflections may span everything
    } else {
      lo = if (start < 0) 0 else start
      hi = if (end >= length) length - 1 else end
      if (start < 0) hi = max(hi, min(length - 1, -start))
      if (end >= length) lo = min(lo, max(0, 2 * (length - 1) - end))
    }
    val samples = hi - lo + 1
    val bytes = ByteArray(samples * 8)
    file.seek(lo.toLong() * 8)
    file.readFully(bytes)
    val floats = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).asFloatBuffer()
    for (n in 0 until count) {
      val r = reflect(start + n) - lo
      dest[0][n] = floats.get(r * 2)
      dest[1][n] = floats.get(r * 2 + 1)
    }
  }

  /** In-place iterative radix-2 complex FFT (inverse is scaled by 1/N). */
  private class Fft(private val n: Int) {
    private val cosT = DoubleArray(n / 2) { cos(2.0 * PI * it / n) }
    private val sinT = DoubleArray(n / 2) { sin(2.0 * PI * it / n) }
    private val rev = IntArray(n).also {
      val bits = Integer.numberOfTrailingZeros(n)
      for (i in 0 until n) it[i] = Integer.reverse(i) ushr (32 - bits)
    }

    fun transform(re: DoubleArray, im: DoubleArray, inverse: Boolean) {
      for (i in 0 until n) {
        val j = rev[i]
        if (j > i) {
          val tr = re[i]; re[i] = re[j]; re[j] = tr
          val ti = im[i]; im[i] = im[j]; im[j] = ti
        }
      }
      val sign = if (inverse) 1.0 else -1.0
      var size = 2
      while (size <= n) {
        val half = size / 2
        val step = n / size
        var start = 0
        while (start < n) {
          var k = 0
          for (j in start until start + half) {
            val wr = cosT[k]
            val wi = sign * sinT[k]
            val xr = re[j + half] * wr - im[j + half] * wi
            val xi = re[j + half] * wi + im[j + half] * wr
            re[j + half] = re[j] - xr; im[j + half] = im[j] - xi
            re[j] += xr; im[j] += xi
            k += step
          }
          start += size
        }
        size *= 2
      }
      if (inverse) {
        val scale = 1.0 / n
        for (i in 0 until n) { re[i] *= scale; im[i] *= scale }
      }
    }
  }
}
