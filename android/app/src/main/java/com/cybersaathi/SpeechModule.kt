package com.cybersaathi

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.bridge.UiThreadUtil

class SpeechModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var speechRecognizer: SpeechRecognizer? = null
    private var recognizerIntent: Intent? = null
    private var isListening = false

    override fun getName(): String = "SpeechModule"

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun isSpeechAvailable(promise: Promise) {
        promise.resolve(SpeechRecognizer.isRecognitionAvailable(reactContext))
    }

    @ReactMethod
    fun startListening(promise: Promise) {
        val permissionGranted = ContextCompat.checkSelfPermission(
            reactContext,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

        if (!permissionGranted) {
            promise.reject("NO_PERMISSION", "RECORD_AUDIO permission not granted")
            return
        }

        if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) {
            promise.reject("NOT_AVAILABLE", "Speech recognition not available on this device")
            return
        }

        UiThreadUtil.runOnUiThread {
            try {
                if (speechRecognizer == null) {
                    speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)

                    speechRecognizer?.setRecognitionListener(object : RecognitionListener {
                        override fun onReadyForSpeech(params: Bundle?) {
                            val map = Arguments.createMap()
                            map.putString("state", "ready")
                            sendEvent("SpeechState", map)
                        }

                        override fun onBeginningOfSpeech() {
                            val map = Arguments.createMap()
                            map.putString("state", "speaking")
                            sendEvent("SpeechState", map)
                        }

                        override fun onRmsChanged(rmsdB: Float) {}
                        override fun onBufferReceived(buffer: ByteArray?) {}

                        override fun onEndOfSpeech() {
                            val map = Arguments.createMap()
                            map.putString("state", "ended")
                            sendEvent("SpeechState", map)
                        }

                        override fun onError(error: Int) {
                            val map = Arguments.createMap()
                            map.putInt("code", error)
                            map.putString("message", "Speech recognition error: $error")
                            sendEvent("SpeechError", map)

                            if (isListening) {
                                try {
                                    speechRecognizer?.cancel()
                                    speechRecognizer?.startListening(recognizerIntent)
                                } catch (_: Exception) {
                                }
                            }
                        }

                        override fun onResults(results: Bundle?) {
                            val matches =
                                results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)

                            if (!matches.isNullOrEmpty()) {
                                val map = Arguments.createMap()
                                map.putString("text", matches[0])
                                sendEvent("SpeechResult", map)
                            }

                            if (isListening) {
                                try {
                                    speechRecognizer?.startListening(recognizerIntent)
                                } catch (_: Exception) {
                                }
                            }
                        }

                        override fun onPartialResults(partialResults: Bundle?) {
                            val matches =
                                partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)

                            if (!matches.isNullOrEmpty()) {
                                val map = Arguments.createMap()
                                map.putString("text", matches[0])
                                sendEvent("SpeechPartial", map)
                            }
                        }

                        override fun onEvent(eventType: Int, params: Bundle?) {}
                    })
                }

                recognizerIntent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(
                        RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                        RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
                    )
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                    putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, reactContext.packageName)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-IN")
                }

                isListening = true
                speechRecognizer?.cancel()
                speechRecognizer?.startListening(recognizerIntent)
                promise.resolve(true)

            } catch (e: Exception) {
                promise.reject("START_FAILED", e.message, e)
            }
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                isListening = false
                speechRecognizer?.stopListening()
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("STOP_FAILED", e.message, e)
            }
        }
    }

    @ReactMethod
    fun destroyRecognizer() {
        UiThreadUtil.runOnUiThread {
            try {
                isListening = false
                speechRecognizer?.destroy()
                speechRecognizer = null
            } catch (_: Exception) {
            }
        }
    }
}