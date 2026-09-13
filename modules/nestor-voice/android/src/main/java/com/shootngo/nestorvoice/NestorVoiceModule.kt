package com.shootngo.nestorvoice

import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

class NestorVoiceModule : Module() {
  private val main = Handler(Looper.getMainLooper())
  private var recognizer: SpeechRecognizer? = null
  private var listening = false
  private var tts: TextToSpeech? = null
  private var ttsReady = false
  private var muted = false
  private var volume = 1f
  private var recognitionBeepMuted = false

  override fun definition() = ModuleDefinition {
    Name("NestorVoice")
    Events(
      "onSpeechBegin",
      "onSpeechEnd",
      "onSpeechResult",
      "onSpeechPartial",
      "onSpeechError",
      "onTtsStart",
      "onTtsDone",
      "onTtsError",
    )

    OnCreate {
      runMain { ensureTts() }
    }

    OnDestroy {
      runMain {
        tearDownRecognizer()
        tts?.stop()
        tts?.shutdown()
        tts = null
        ttsReady = false
      }
    }

    Function("isSpeechAvailable") {
      val context = androidContext() ?: return@Function false
      SpeechRecognizer.isRecognitionAvailable(context)
    }

    Function("isListening") {
      listening
    }

    AsyncFunction("startListening") { preferOffline: Boolean ->
      var started = false
      var error: Exception? = null
      runMain {
        try {
          started = startListeningInternal(preferOffline)
        } catch (e: Exception) {
          error = e
        }
      }
      error?.let { throw it }
      started
    }

    AsyncFunction("stopListening") {
      runMain { stopListeningInternal(cancel = false, restoreBeep = true) }
    }

    AsyncFunction("cancelListening") {
      runMain { stopListeningInternal(cancel = true, restoreBeep = true) }
    }

    AsyncFunction("releaseRecognizer") {
      runMain { tearDownRecognizer() }
    }

    AsyncFunction("speak") { text: String, nextVolume: Double ->
      volume = nextVolume.toFloat().coerceIn(0f, 1f)
      var started = false
      runMain {
        started = speakInternal(text)
      }
      started
    }

    AsyncFunction("stopSpeaking") {
      runMain {
        try {
          tts?.stop()
        } catch (_: Exception) {
          // already stopped
        }
      }
    }

    AsyncFunction("setMuted") { next: Boolean ->
      muted = next
      if (next) {
        runMain {
          try {
            tts?.stop()
          } catch (_: Exception) {
            // already stopped
          }
        }
      }
    }

    AsyncFunction("nudgeStreamVolume") { direction: Int ->
      val context = androidContext() ?: return@AsyncFunction
      val manager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
      val adjust = if (direction >= 0) AudioManager.ADJUST_RAISE else AudioManager.ADJUST_LOWER
      manager.adjustStreamVolume(AudioManager.STREAM_MUSIC, adjust, 0)
    }
  }

  private fun androidContext(): Context? {
    return appContext.reactContext ?: appContext.currentActivity
  }

  private fun recognitionAudioManager(): AudioManager? {
    val context = androidContext() ?: return null
    return context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
  }

  /**
   * Samsung plays a system/notification beep on each SpeechRecognizer start.
   * Mute those streams only while a listen window is open; always restore.
   */
  private fun muteRecognitionBeep(mute: Boolean) {
    val manager = recognitionAudioManager() ?: return
    val streams = intArrayOf(
      AudioManager.STREAM_SYSTEM,
      AudioManager.STREAM_NOTIFICATION,
    )
    for (stream in streams) {
      try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          manager.adjustStreamVolume(
            stream,
            if (mute) AudioManager.ADJUST_MUTE else AudioManager.ADJUST_UNMUTE,
            0,
          )
        } else {
          @Suppress("DEPRECATION")
          manager.setStreamMute(stream, mute)
        }
      } catch (_: Exception) {
        // Best-effort. Some streams are protected.
      }
    }
    recognitionBeepMuted = mute
  }

  private fun emitOnMain(name: String, body: Map<String, Any?>) {
    main.post {
      try {
        sendEvent(name, body)
      } catch (_: Exception) {
        // JS runtime gone
      }
    }
  }

  private fun runMain(block: () -> Unit) {
    if (Looper.myLooper() == Looper.getMainLooper()) {
      block()
      return
    }
    val latch = CountDownLatch(1)
    var caught: Exception? = null
    main.post {
      try {
        block()
      } catch (e: Exception) {
        caught = e
      } finally {
        latch.countDown()
      }
    }
    latch.await(4, TimeUnit.SECONDS)
    caught?.let { throw it }
  }

  private fun ensureTts() {
    if (tts != null) {
      return
    }
    val context = androidContext()?.applicationContext ?: return
    bindTts(context, TtsVoicePicker.preferredEnginePackage(context))
  }

  private fun bindTts(context: Context, enginePackage: String?) {
    val listener = TextToSpeech.OnInitListener { status ->
      if (status != TextToSpeech.SUCCESS) {
        val failed = tts
        tts = null
        ttsReady = false
        try {
          failed?.shutdown()
        } catch (_: Exception) {
          // already gone
        }
        if (!enginePackage.isNullOrBlank()) {
          Log.w(
            TtsVoicePicker.TAG,
            "Preferred TTS engine $enginePackage failed; falling back to default",
          )
          main.post { bindTts(context, null) }
        } else {
          Log.e(TtsVoicePicker.TAG, "TTS engine failed to initialize")
        }
        return@OnInitListener
      }
      val engine = tts
      if (engine == null) {
        ttsReady = false
        return@OnInitListener
      }
      val voiceReady = try {
        TtsVoicePicker.applyKitchenVoice(engine)
      } catch (error: Exception) {
        Log.w(TtsVoicePicker.TAG, "TTS kitchen voice apply failed", error)
        false
      }
      if (!voiceReady && !enginePackage.isNullOrBlank()) {
        Log.w(TtsVoicePicker.TAG, "Preferred TTS engine has no English data; falling back to default")
        tts = null
        ttsReady = false
        try {
          engine.shutdown()
        } catch (_: Exception) {
          // already gone
        }
        main.post { bindTts(context, null) }
        return@OnInitListener
      }
      ttsReady = true
      attachUtteranceListener(engine)
    }
    tts = if (enginePackage.isNullOrBlank()) {
      TextToSpeech(context, listener)
    } else {
      TextToSpeech(context, listener, enginePackage)
    }
  }

  private fun attachUtteranceListener(engine: TextToSpeech) {
    engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
      override fun onStart(utteranceId: String?) {
        // Binder thread — never sendEvent here directly (Tab A crash-on-answer).
        emitOnMain("onTtsStart", mapOf("id" to (utteranceId ?: "")))
      }

      override fun onDone(utteranceId: String?) {
        emitOnMain("onTtsDone", mapOf("id" to (utteranceId ?: "")))
      }

      @Deprecated("Deprecated in Java")
      override fun onError(utteranceId: String?) {
        emitOnMain("onTtsError", mapOf("id" to (utteranceId ?: "")))
      }

      override fun onError(utteranceId: String?, errorCode: Int) {
        emitOnMain("onTtsError", mapOf("id" to (utteranceId ?: ""), "code" to errorCode))
      }
    })
  }

  private fun speakInternal(text: String): Boolean {
    ensureTts()
    // SpeechRecognizer must not still own the mic when TTS starts.
    tearDownRecognizer()
    val engine = tts
    val safe = text.replace(Regex("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]"), " ").trim()
    if (muted || volume <= 0.01f || safe.isBlank()) {
      emitOnMain("onTtsDone", mapOf("id" to "skip"))
      return false
    }
    if (!ttsReady || engine == null) {
      return false
    }
    val clipped = if (safe.length > 800) safe.substring(0, 800) else safe
    val id = UUID.randomUUID().toString()
    val params = Bundle()
    params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, volume)
    params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, id)
    Log.i(
      TtsVoicePicker.TAG,
      "TTS speak volume=$volume chars=${clipped.length} voice=${engine.voice?.let { TtsVoicePicker.describe(it) } ?: "none"}",
    )
    return try {
      val result = engine.speak(clipped, TextToSpeech.QUEUE_FLUSH, params, id)
      result == TextToSpeech.SUCCESS
    } catch (error: Exception) {
      Log.e(TtsVoicePicker.TAG, "TTS speak failed", error)
      emitOnMain("onTtsError", mapOf("id" to id))
      false
    }
  }

  private fun startListeningInternal(preferOffline: Boolean): Boolean {
    val context = androidContext() ?: return false
    if (!SpeechRecognizer.isRecognitionAvailable(context)) {
      emitOnMain("onSpeechError", mapOf("code" to SpeechRecognizer.ERROR_CLIENT, "message" to "unavailable"))
      return false
    }
    if (listening) {
      // Already in a listen window — do not start again (system beep).
      return true
    }
    stopListeningInternal(cancel = true, restoreBeep = false)
    muteRecognitionBeep(true)
    try {
      tts?.stop()
    } catch (_: Exception) {
      // ignore
    }
    ensureRecognizer(context)
    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
      putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
      putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US")
      putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
      putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
      putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.packageName)
      // One longer kitchen window instead of a tight start/stop beep loop.
      putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 2500L)
      putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 1600L)
      putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 1400L)
      if (preferOffline) {
        putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
      }
    }
    return try {
      listening = true
      recognizer?.startListening(intent)
      true
    } catch (error: Exception) {
      listening = false
      muteRecognitionBeep(false)
      Log.e("NestorVoice", "SpeechRecognizer start failed", error)
      emitOnMain("onSpeechError", mapOf("code" to SpeechRecognizer.ERROR_CLIENT, "message" to "start-failed"))
      false
    }
  }

  private fun stopListeningInternal(cancel: Boolean, restoreBeep: Boolean = true) {
    listening = false
    if (restoreBeep) {
      muteRecognitionBeep(false)
    }
    try {
      if (cancel) {
        recognizer?.cancel()
      } else {
        recognizer?.stopListening()
      }
    } catch (_: Exception) {
      // already stopped
    }
  }

  private fun ensureRecognizer(context: Context) {
    if (recognizer != null) {
      return
    }
    val created = createRecognizer(context)
    created.setRecognitionListener(object : RecognitionListener {
      override fun onReadyForSpeech(params: Bundle?) {}

      override fun onBeginningOfSpeech() {
        emitOnMain("onSpeechBegin", emptyMap<String, Any>())
      }

      override fun onRmsChanged(rmsdB: Float) {}

      override fun onBufferReceived(buffer: ByteArray?) {}

      override fun onEndOfSpeech() {
        emitOnMain("onSpeechEnd", emptyMap<String, Any>())
      }

      override fun onError(error: Int) {
        listening = false
        muteRecognitionBeep(false)
        emitOnMain("onSpeechError", mapOf("code" to error, "message" to errorLabel(error)))
      }

      override fun onResults(results: Bundle?) {
        listening = false
        muteRecognitionBeep(false)
        val text = results
          ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
          ?.firstOrNull()
          .orEmpty()
        emitOnMain("onSpeechResult", mapOf("text" to text))
      }

      override fun onPartialResults(partialResults: Bundle?) {
        val text = partialResults
          ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
          ?.firstOrNull()
          .orEmpty()
        if (text.isNotBlank()) {
          emitOnMain("onSpeechPartial", mapOf("text" to text))
        }
      }

      override fun onEvent(eventType: Int, params: Bundle?) {}
    })
    recognizer = created
  }

  private fun createRecognizer(context: Context): SpeechRecognizer {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && SpeechRecognizer.isOnDeviceRecognitionAvailable(context)) {
      try {
        return SpeechRecognizer.createOnDeviceSpeechRecognizer(context)
      } catch (_: Exception) {
        // Fall through to the default OS recognizer (still free).
      }
    }
    return SpeechRecognizer.createSpeechRecognizer(context)
  }

  private fun tearDownRecognizer() {
    listening = false
    muteRecognitionBeep(false)
    val active = recognizer
    recognizer = null
    try {
      active?.cancel()
    } catch (_: Exception) {
      // already gone
    }
    try {
      active?.destroy()
    } catch (_: Exception) {
      // already gone
    }
  }

  private fun errorLabel(code: Int): String {
    return when (code) {
      SpeechRecognizer.ERROR_AUDIO -> "audio"
      SpeechRecognizer.ERROR_CLIENT -> "client"
      SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "permission"
      SpeechRecognizer.ERROR_NETWORK -> "network"
      SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "network-timeout"
      SpeechRecognizer.ERROR_NO_MATCH -> "no-match"
      SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "busy"
      SpeechRecognizer.ERROR_SERVER -> "server"
      SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "timeout"
      else -> "error"
    }
  }
}
