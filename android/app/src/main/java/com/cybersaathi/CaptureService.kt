package com.cybersaathi
import android.graphics.PixelFormat
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.*
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.DisplayMetrics
import android.view.WindowManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.media.ImageReader

class CaptureService : Service() {

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private var audioRecord: AudioRecord? = null
    private var audioThread: Thread? = null
    private var isCapturing = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_CAPTURE -> {
                startForeground(NOTIFICATION_ID, createNotification())
                startProjection(intent)
            }
            ACTION_STOP_CAPTURE -> {
                stopProjection()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_STICKY
    }

    private fun sendEvent(eventName: String, status: String, message: String) {
        val app = application as MainApplication
        val reactHost = app.reactHost
        val reactContext = reactHost.currentReactContext ?: return

        val map = Arguments.createMap()
        map.putString("status", status)
        map.putString("message", message)

        Handler(Looper.getMainLooper()).post {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, map)
        }
    }

    private fun startProjection(intent: Intent) {
        val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, -1)
        val data: Intent? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableExtra(EXTRA_RESULT_DATA, Intent::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent.getParcelableExtra(EXTRA_RESULT_DATA)
        }

        if (resultCode == -1 || data == null) {
            sendEvent("CaptureState", "error", "Missing MediaProjection permission data")
            return
        }

        val projectionManager =
            getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager

        mediaProjection = projectionManager.getMediaProjection(resultCode, data)
        if (mediaProjection == null) {
            sendEvent("CaptureState", "error", "Could not get MediaProjection instance")
            return
        }

        try {
            setupVirtualDisplay()
            setupAudioPlaybackCapture()
            isCapturing = true
            sendEvent("CaptureState", "active", "Screen/audio capture active")
        } catch (e: Exception) {
            sendEvent("CaptureState", "error", "Capture setup failed: ${e.message}")
        }
    }

    private fun setupVirtualDisplay() {
        val wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        wm.defaultDisplay.getRealMetrics(metrics)

        val width = metrics.widthPixels
        val height = metrics.heightPixels
        val density = metrics.densityDpi

        imageReader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2)

        virtualDisplay = mediaProjection?.createVirtualDisplay(
            "CyberSaathiVirtualDisplay",
            width,
            height,
            density,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader?.surface,
            null,
            null
        )
    }

    private fun setupAudioPlaybackCapture() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            sendEvent("CaptureState", "warning", "Playback audio capture needs Android 10+")
            return
        }

        val projection = mediaProjection ?: return

        val audioFormat = AudioFormat.Builder()
            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
            .setSampleRate(16000)
            .setChannelMask(AudioFormat.CHANNEL_IN_MONO)
            .build()

        val config = AudioPlaybackCaptureConfiguration.Builder(projection)
            .addMatchingUsage(AudioAttributes.USAGE_MEDIA)
            .addMatchingUsage(AudioAttributes.USAGE_UNKNOWN)
            .build()

        val minBuffer = AudioRecord.getMinBufferSize(
            16000,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        )

        audioRecord = AudioRecord.Builder()
            .setAudioFormat(audioFormat)
            .setBufferSizeInBytes(minBuffer * 4)
            .setAudioPlaybackCaptureConfig(config)
            .build()

        audioRecord?.startRecording()

        audioThread = Thread {
            val buffer = ByteArray(minBuffer)
            while (isCapturing && audioRecord != null) {
                val read = audioRecord?.read(buffer, 0, buffer.size) ?: 0
                if (read > 0) {
                    // Phase 2 skeleton:
                    // Here you now have captured PCM audio bytes in `buffer`.
                    // Next phase: chunk -> STT pipeline.
                }
            }
        }
        audioThread?.start()
    }

    private fun stopProjection() {
        isCapturing = false

        try {
            audioRecord?.stop()
        } catch (_: Exception) {
        }
        try {
            audioRecord?.release()
        } catch (_: Exception) {
        }
        audioRecord = null

        try {
            audioThread?.interrupt()
        } catch (_: Exception) {
        }
        audioThread = null

        try {
            virtualDisplay?.release()
        } catch (_: Exception) {
        }
        virtualDisplay = null

        try {
            imageReader?.close()
        } catch (_: Exception) {
        }
        imageReader = null

        try {
            mediaProjection?.stop()
        } catch (_: Exception) {
        }
        mediaProjection = null

        sendEvent("CaptureState", "stopped", "Screen/audio capture stopped")
    }

    private fun createNotification(): Notification {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "CyberSaathi Capture",
                NotificationManager.IMPORTANCE_LOW
            )
            manager.createNotificationChannel(channel)
        }

        return Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("CyberSaathi Capture Active")
            .setContentText("Advanced session capture is running")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .build()
    }

    override fun onDestroy() {
        stopProjection()
        super.onDestroy()
    }

    companion object {
        const val ACTION_START_CAPTURE = "ACTION_START_CAPTURE"
        const val ACTION_STOP_CAPTURE = "ACTION_STOP_CAPTURE"
        const val EXTRA_RESULT_CODE = "extra_result_code"
        const val EXTRA_RESULT_DATA = "extra_result_data"
        const val CHANNEL_ID = "cybersaathi_capture_channel"
        const val NOTIFICATION_ID = 1002
    }
}