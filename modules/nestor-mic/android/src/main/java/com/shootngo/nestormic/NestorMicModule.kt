package com.shootngo.nestormic

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.concurrent.thread

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
  private fun startRecording(sampleRate: Int) {
    stopRecording()

    val channel = AudioFormat.CHANNEL_IN_MONO
    val encoding = AudioFormat.ENCODING_PCM_16BIT
    val minBuffer = AudioRecord.getMinBufferSize(sampleRate, channel, encoding)
    val bufferSize = maxOf(minBuffer, sampleRate / 5) * 2

    val record = AudioRecord(
      MediaRecorder.AudioSource.VOICE_RECOGNITION,
      sampleRate,
      channel,
      encoding,
      bufferSize,
    )

    if (record.state != AudioRecord.STATE_INITIALIZED) {
      record.release()
      throw IllegalStateException("Kitchen microphone could not start.")
    }

    recorder = record
    running = true
    record.startRecording()

    worker = thread(name = "nestor-mic", isDaemon = true) {
      val shortBuffer = ShortArray(sampleRate / 10)
      while (running) {
        val read = record.read(shortBuffer, 0, shortBuffer.size)
        if (read <= 0) {
          continue
        }
        val samples = ArrayList<Double>(read)
        for (i in 0 until read) {
          samples.add(shortBuffer[i] / 32768.0)
        }
        sendEvent(
          "onAudio",
          mapOf(
            "samples" to samples,
            "sampleRate" to sampleRate,
          ),
        )
      }
    }
  }

  @Synchronized
  private fun stopRecording() {
    running = false
    try {
      worker?.join(400)
    } catch (_: InterruptedException) {
      // ignore
    }
    worker = null
    try {
      recorder?.stop()
    } catch (_: Exception) {
      // already stopped
    }
    recorder?.release()
    recorder = null
  }
}
