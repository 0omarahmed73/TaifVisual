package com.taif.app

import android.os.Bundle
import android.webkit.WebView
import android.graphics.Color
import androidx.activity.OnBackPressedCallback
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen

class MainActivity : TauriActivity() {
  // Created with the activity so the document-picker launcher is registered
  // before the activity reaches STARTED.
  private val bridge = TaifBridge(this)

  override fun onCreate(savedInstanceState: Bundle?) {
    // Keep the (dark, icon-less) system splash until the web UI painted its
    // first frame, so the animated logo follows with no white flash between.
    val splash = installSplashScreen()
    val started = System.currentTimeMillis()
    splash.setKeepOnScreenCondition {
      !bridge.ready && System.currentTimeMillis() - started < 6000
    }
    splash.setOnExitAnimationListener { it.remove() }
    super.onCreate(savedInstanceState)

    // Back steps through the app's screens; only the first screen exits.
    onBackPressedDispatcher.addCallback(
      this,
      object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
          bridge.handleBack { handled ->
            if (!handled) {
              isEnabled = false
              onBackPressedDispatcher.onBackPressed()
            }
          }
        }
      },
    )
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    webView.setBackgroundColor(Color.parseColor("#0D1017"))
    bridge.attach(webView)
  }

  override fun onDestroy() {
    bridge.shutdown()
    super.onDestroy()
  }
}
