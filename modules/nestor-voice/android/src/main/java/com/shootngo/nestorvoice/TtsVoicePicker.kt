package com.shootngo.nestorvoice

import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.speech.tts.TextToSpeech
import android.speech.tts.Voice
import android.util.Log
import java.util.Locale

/**
 * Picks a warmer on-device kitchen voice than the Samsung / Pico default.
 * Identity stays Nestor; this only chooses the Android TTS engine + voice.
 */
internal object TtsVoicePicker {
  const val TAG = "NestorVoice"

  /** Calm kitchen butler. Slightly slower than the old 0.96 default; not cartoon. */
  const val KITCHEN_SPEECH_RATE = 0.90f

  /** A hair lower than 1.0 for warmth. Not chipmunk, not cartoon. */
  const val KITCHEN_PITCH = 0.92f

  private val GOOGLE_ENGINE = "com.google.android.tts"

  fun preferredEnginePackage(context: Context): String? {
    val engines = installedEnginePackages(context)
    Log.i(TAG, "TTS engines installed: ${engines.joinToString()}")
    val google = engines.firstOrNull { isGoogleEngine(it) }
    if (google != null) {
      Log.i(TAG, "TTS preferring Google engine $google")
      return google
    }
    val nonRobotic = engines.firstOrNull { !isRoboticEngine(it) }
    if (nonRobotic != null) {
      Log.w(TAG, "TTS Google engine missing; using $nonRobotic. Install Speech Services by Google for a warmer voice.")
      return nonRobotic
    }
    Log.w(TAG, "TTS no preferred engine; using system default")
    return null
  }

  fun applyKitchenVoice(engine: TextToSpeech): Boolean {
    try {
      engine.setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_MEDIA)
          .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
          .build(),
      )
    } catch (error: Exception) {
      Log.w(TAG, "TTS audio attributes skipped", error)
    }

    val languageResult = engine.setLanguage(Locale.US)
    val englishOk = languageAvailable(languageResult)
    if (!englishOk) {
      Log.w(TAG, "TTS en-US missing (result=$languageResult); trying Locale.ENGLISH")
      val fallback = engine.setLanguage(Locale.ENGLISH)
      if (!languageAvailable(fallback)) {
        Log.w(TAG, "TTS engine has no English data (us=$languageResult en=$fallback)")
        engine.setSpeechRate(KITCHEN_SPEECH_RATE)
        engine.setPitch(KITCHEN_PITCH)
        return false
      }
    }

    val chosen = pickWarmVoice(engine)
    if (chosen != null) {
      val result = engine.setVoice(chosen)
      Log.i(
        TAG,
        "TTS voice chosen: ${describe(chosen)} setVoice=$result engine=${engine.defaultEngine}",
      )
    } else {
      val fallback = engine.voice
      Log.w(
        TAG,
        "TTS voice list empty or unusable; engine default=${fallback?.let { describe(it) } ?: "none"} engine=${engine.defaultEngine}",
      )
    }

    engine.setSpeechRate(KITCHEN_SPEECH_RATE)
    engine.setPitch(KITCHEN_PITCH)
    Log.i(
      TAG,
      "TTS kitchen mix: rate=$KITCHEN_SPEECH_RATE pitch=$KITCHEN_PITCH voice=${engine.voice?.let { describe(it) } ?: "none"}",
    )
    return true
  }

  private fun languageAvailable(result: Int): Boolean {
    return result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED
  }

  internal fun scoreVoice(voice: Voice): Int {
    val name = voice.name.lowercase(Locale.US)
    val features = voice.features.orEmpty()
    var score = voice.quality * 10

    score += when (voice.latency) {
      Voice.LATENCY_VERY_LOW -> 20
      Voice.LATENCY_LOW -> 12
      Voice.LATENCY_NORMAL -> 6
      Voice.LATENCY_HIGH -> 0
      else -> -8
    }

    if (looksNeural(name)) {
      score += 140
    }
    if (isUsEnglish(voice.locale)) {
      score += 40
    } else if (isEnglish(voice.locale)) {
      score += 10
    }

    val network = name.contains("network") ||
      features.contains(TextToSpeech.Engine.KEY_FEATURE_NETWORK_SYNTHESIS)
    val local = name.contains("local") ||
      features.contains(TextToSpeech.Engine.KEY_FEATURE_EMBEDDED_SYNTHESIS)
    val notInstalled = features.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)
    if (network && !notInstalled) {
      score += 55
    } else if (local && !notInstalled) {
      score += 35
    }

    if (looksMaleOrNeutral(name)) {
      score += 80
    } else if (looksFemale(name)) {
      score -= 15
    }

    if (name.contains("en-us-x-") || name.contains("google")) {
      score += 30
    }
    if (name.endsWith("-language") || name.contains("default")) {
      score -= 40
    }
    if (isRoboticName(name)) {
      score -= 2500
    }
    return score
  }

  internal fun isUsableVoice(voice: Voice): Boolean {
    if (!isEnglish(voice.locale)) {
      return false
    }
    val features = voice.features.orEmpty()
    val notInstalled = features.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)
    // A not-installed network pack can crash speak() on older Tabs.
    return !notInstalled
  }

  private fun pickWarmVoice(engine: TextToSpeech): Voice? {
    val voices = try {
      engine.voices?.toList().orEmpty()
    } catch (error: Exception) {
      Log.w(TAG, "TTS voices unavailable", error)
      return null
    }
    if (voices.isEmpty()) {
      return null
    }

    val usable = voices.filter(::isUsableVoice)
    val us = usable.filter { isUsEnglish(it.locale) }
    val pool = if (us.isNotEmpty()) us else usable
    if (pool.isEmpty()) {
      Log.w(TAG, "TTS no usable English voices among ${voices.size} reported")
      return null
    }

    val ranked = pool.sortedByDescending(::scoreVoice)
    ranked.take(8).forEach { voice ->
      Log.i(TAG, "TTS candidate score=${scoreVoice(voice)} ${describe(voice)}")
    }
    return ranked.firstOrNull()
  }

  private fun installedEnginePackages(context: Context): List<String> {
    val intent = Intent(TextToSpeech.Engine.INTENT_ACTION_TTS_SERVICE)
    // Flag 0 lists every TTS service, not only the system default (often Samsung on Tab A).
    @Suppress("DEPRECATION")
    return try {
      context.packageManager
        .queryIntentServices(intent, 0)
        .mapNotNull { it.serviceInfo?.packageName }
        .distinct()
    } catch (error: Exception) {
      Log.w(TAG, "TTS engine query failed", error)
      emptyList()
    }
  }

  private fun isGoogleEngine(packageName: String): Boolean {
    val pkg = packageName.lowercase(Locale.US)
    return pkg == GOOGLE_ENGINE || (pkg.contains("google") && pkg.contains("tts"))
  }

  private fun isRoboticEngine(packageName: String): Boolean {
    val pkg = packageName.lowercase(Locale.US)
    return pkg.contains("pico") || pkg.contains("svox")
  }

  private fun isEnglish(locale: Locale): Boolean {
    return locale.language.equals("en", ignoreCase = true)
  }

  private fun isUsEnglish(locale: Locale): Boolean {
    if (!isEnglish(locale)) {
      return false
    }
    val country = locale.country.lowercase(Locale.US)
    return country.isEmpty() || country == "us" || country == "usa"
  }

  private fun looksNeural(name: String): Boolean {
    return name.contains("neural") ||
      name.contains("wavenet") ||
      name.contains("natural") ||
      name.contains("journey")
  }

  private fun looksMaleOrNeutral(name: String): Boolean {
    if (name.contains("male") && !name.contains("female")) {
      return true
    }
    if (name.contains("neutral")) {
      return true
    }
    // Common Google TTS US English male / warm-neutral IDs on older tablets.
    val tokens = listOf(
      "tpd",
      "tpc",
      "iob",
      "iom",
      "iog",
      "neural2-d",
      "neural2-i",
      "neural2-j",
      "wavenet-d",
      "wavenet-b",
      "wavenet-i",
      "wavenet-j",
    )
    return tokens.any { name.contains(it) }
  }

  private fun looksFemale(name: String): Boolean {
    if (name.contains("female")) {
      return true
    }
    val tokens = listOf(
      "sfg",
      "tpf",
      "neural2-a",
      "neural2-c",
      "neural2-e",
      "neural2-f",
      "neural2-g",
      "neural2-h",
      "wavenet-a",
      "wavenet-c",
      "wavenet-e",
      "wavenet-f",
      "wavenet-g",
      "wavenet-h",
    )
    return tokens.any { name.contains(it) }
  }

  private fun isRoboticName(name: String): Boolean {
    return name.contains("pico") || name.contains("svox") || name.contains("compact")
  }

  fun describe(voice: Voice): String {
    val features = voice.features.orEmpty().sorted().joinToString(",")
    return "name=${voice.name} locale=${voice.locale} quality=${voice.quality} latency=${voice.latency} features=[$features]"
  }
}
