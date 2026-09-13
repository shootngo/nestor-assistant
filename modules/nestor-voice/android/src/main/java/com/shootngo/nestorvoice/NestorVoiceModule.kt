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
      runMain { stopListeningInternal(cancel = false) }
    }

    AsyncFunction("cancelListening") {
      runMain { stopListeningInternal(cancel = true) }
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
      runMain { tts?.stop() }
    }

    AsyncFunction("setMuted") { next: Boolean ->
      muted = next
      if (next) {
        runMain { tts?.stop() }
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
      val voiceReady = TtsVoicePicker.applyKitchenVoice(engine)
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
        sendEvent("onTtsStart", mapOf("id" to (utteranceId ?: "")))
      }

      override fun onDone(utteranceId: String?) {
        sendEvent("onTtsDone", mapOf("id" to (utteranceId ?: "")))
      }

      @Deprecated("Deprecated in Java")
      override fun onError(utteranceId: String?) {
        sendEvent("onTtsError", mapOf("id" to (utteranceId ?: "")))
      }

      override fun onError(utteranceId: String?, errorCode: Int) {
        sendEvent("onTtsError", mapOf("id" to (utteranceId ?: "")))
      }
    })
  }

  private fun speakInternal(text: String): Boolean {
    ensureTts()
    val engine = tts
    if (muted || volume <= 0.01f || text.isBlank()) {
      sendEvent("onTtsDone", mapOf("id" to "skip"))
      return false
    }
    if (!ttsReady || engine == null) {
      return false
    }
    val id = UUID.randomUUID().toString()
    val params = Bundle()
    params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, volume)
    params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, id)
    Log.i(
      TtsVoicePicker.TAG,
      "TTS speak volume=$volume voice=${engine.voice?.let { TtsVoicePicker.describe(it) } ?: "none"}",
    )
    val result = engine.speak(text, TextToSpeech.QUEUE_FLUSH, params, id)
    return result == TextToSpeech.SUCCESS
  }

  private fun startListeningInternal(preferOffline: Boolean): Boolean {
    val context = androidContext() ?: return false
    if (!SpeechRecognizer.isRecognitionAvailable(context)) {
      sendEvent("onSpeechError", mapOf("code" to SpeechRecognizer.ERROR_CLIENT, "message" to "unavailable"))
      return false
    }
    stopListeningInternal(cancel = true)
    ensureRecognizer(context)
    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
      putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
      putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US")
      putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
      putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
      putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.packageName)
      if (preferOffline) {
        putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
      }
    }
    listening = true
    recognizer?.startListening(intent)
    return true
  }

  private fun stopListeningInternal(cancel: Boolean) {
    listening = false
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
        sendEvent("onSpeechBegin", emptyMap<String, Any>())
      }

      override fun onRmsChanged(rmsdB: Float) {}

      override fun onBufferReceived(buffer: ByteArray?) {}

      override fun onEndOfSpeech() {
        sendEvent("onSpeechEnd", emptyMap<String, Any>())
      }

      override fun onError(error: Int) {
        listening = false
        sendEvent("onSpeechError", mapOf("code" to error, "message" to errorLabel(error)))
      }

      override fun onResults(results: Bundle?) {
        listening = false
        val text = results
          ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
          ?.firstOrNull()
          .orEmpty()
        sendEvent("onSpeechResult", mapOf("text" to text))
      }

      override fun onPartialResults(partialResults: Bundle?) {
        val text = partialResults
          ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
          ?.firstOrNull()
          .orEmpty()
        if (text.isNotBlank()) {
          sendEvent("onSpeechPartial", mapOf("text" to text))
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
    try {
      recognizer?.cancel()
      recognizer?.destroy()
    } catch (_: Exception) {
      // already gone
    }
    recognizer = null
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
