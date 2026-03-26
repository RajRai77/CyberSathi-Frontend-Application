package com.cybersaathi

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class CaptureModule(private val reactApplicationContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactApplicationContext) {

    private var pendingPromise: Promise? = null
    private val requestMediaProjection = 5511

    private val activityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(
            activity: Activity,
            requestCode: Int,
            resultCode: Int,
            data: Intent?
        ) {
            if (requestCode != requestMediaProjection) {
                return
            }

            val map = Arguments.createMap()

            if (resultCode == Activity.RESULT_OK && data != null) {
                val serviceIntent = Intent(reactApplicationContext, CaptureService::class.java).apply {
                    action = CaptureService.ACTION_START_CAPTURE
                    putExtra(CaptureService.EXTRA_RESULT_CODE, resultCode)
                    putExtra(CaptureService.EXTRA_RESULT_DATA, data)
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    reactApplicationContext.startForegroundService(serviceIntent)
                } else {
                    reactApplicationContext.startService(serviceIntent)
                }

                map.putBoolean("granted", true)
                sendEvent("CapturePermissionResult", map)
                pendingPromise?.resolve(true)
            } else {
                map.putBoolean("granted", false)
                sendEvent("CapturePermissionResult", map)
                pendingPromise?.resolve(false)
            }

            pendingPromise = null
        }
    }

    init {
        reactApplicationContext.addActivityEventListener(activityEventListener)
    }

    override fun getName(): String = "CaptureModule"

    private fun sendEvent(
        eventName: String,
        params: com.facebook.react.bridge.WritableMap?
    ) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun requestCapturePermission(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Current activity is null")
            return
        }

        val projectionManager =
            reactApplicationContext.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager

        pendingPromise = promise
        activity.startActivityForResult(
            projectionManager.createScreenCaptureIntent(),
            requestMediaProjection
        )
    }

    @ReactMethod
    fun stopCapture() {
        val intent = Intent(reactApplicationContext, CaptureService::class.java).apply {
            action = CaptureService.ACTION_STOP_CAPTURE
        }
        reactApplicationContext.startService(intent)
    }
}