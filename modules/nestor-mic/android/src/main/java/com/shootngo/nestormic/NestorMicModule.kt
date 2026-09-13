package com.shootngo.nestormic

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.concurrent.thread
import kotlin.math.max

class NestorMicModule : Module() {
  private var recorder: AudioRecord? = null
  private var running = false
  private var worker: Thread? = null

  override fun definition() = ModuleDefinition {
    Name("NestorMic")
    Events("onAudio")

    AsyncFunction("start") { sampleRate: Int ->
      startRecording(if (sampleRate > 0) sampleRate else 16000)
    }

    AsyncFunction("stop") {
      stopRecording()
    }

    OnDestroy {
      stopRecording()
    }
  }

  @Synchronized
  private fun startRecording(sampleRate: Int): Boolean {
    stopRecording()

    val channel = AudioFormat.CHANNEL_IN_MONO
    val encoding = AudioFormat.ENCODING_PCM_16BIT
    val minBuffer = AudioRecord.getMinBufferSize(sampleRate, channel, encoding)
    if (minBuffer <= 0) {
      return false
    }
    val bufferSize = max(minBuffer, sampleRate / 5) * 2

    // Raw MIC first — VOICE_RECOGNITION NS can swallow a far-field "Nestor".
    val sources = intArrayOf(
      MediaRecorder.AudioSource.MIC,
      MediaRecorder.AudioSource.VOICE_RECOGNITION,
      MediaRecorder.AudioSource.DEFAULT,
    )

    var record: AudioRecord? = null
    for (source in sources) {
      val candidate = try {
        AudioRecord(source, sampleRate, channel, encoding, bufferSize)
      } catch (_: Exception) {
        null
      }
      if (candidate == null) {
        continue
      }
      if (candidate.state == AudioRecord.STATE_INITIALIZED) {
        record = candidate
        break
      }
      try {
        candidate.release()
      } catch (_: Exception) {
        // already released
      }
    }

    if (record == null) {
      return false
    }

    recorder = record
    running = true
    try {
      record.startRecording()
    } catch (_: Exception) {
      running = false
      try {
        record.release()
      } catch (_: Exception) {
        // already released
      }
      recorder = null
      return false
    }

    val gain = MIC_GAIN
    worker = thread(name = "nestor-mic", isDaemon = true) {
      val shortBuffer = ShortArray(sampleRate / 10)
      while (running) {
        val rec = recorder ?: break
        val read = try {
          rec.read(shortBuffer, 0, shortBuffer.size)
        } catch (_: Exception) {
          break
        }
        if (!running || read <= 0) {
          continue
        }
        val samples = ArrayList<Double>(read)
        for (i in 0 until read) {
          val boosted = (shortBuffer[i] / 32768.0) * gain
          samples.add(boosted.coerceIn(-1.0, 1.0))
        }
        if (running) {
          try {
            sendEvent(
              "onAudio",
              mapOf(
                "samples" to samples,
                "sampleRate" to sampleRate,
              ),
            )
          } catch (_: Exception) {
            // JS gone; stop the worker
            break
          }
        }
      }
    }
    return true
  }

  @Synchronized
  private fun stopRecording() {
    running = false
    val rec = recorder
    // Stop first so a blocking read() unblocks, then join, then release.
    // The old join-then-stop path left read() on a released AudioRecord (SIGSEGV).
    try {
      rec?.stop()
    } catch (_: Exception) {
      // already stopped
    }
    try {
      worker?.join(1500)
    } catch (_: InterruptedException) {
      // ignore
    }
    if (worker?.isAlive == true) {
      try {
        worker?.interrupt()
      } catch (_: Exception) {
        // ignore
      }
      try {
        worker?.join(400)
      } catch (_: InterruptedException) {
        // ignore
      }
    }
    worker = null
    try {
      rec?.release()
    } catch (_: Exception) {
      // already released
    }
    recorder = null
  }

  companion object {
    /** Far-field fridge gain. Clipped to [-1, 1] before it hits KWS. */
    private const val MIC_GAIN = 2.2
  }
}
