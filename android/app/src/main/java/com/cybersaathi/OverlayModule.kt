package com.cybersaathi

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class OverlayModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "OverlayModule"

    @ReactMethod
    fun checkOverlayPermission(promise: Promise) {
        val granted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(reactContext)
        } else {
            true
        }
        promise.resolve(granted)
    }

    @ReactMethod
    fun openOverlayPermissionSettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${reactContext.packageName}")
            )
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
        }
    }

    @ReactMethod
    fun showFloatingButton() {
        val intent = Intent(reactContext, OverlayService::class.java)
        intent.action = "SHOW"
        reactContext.startService(intent)
    }

    @ReactMethod
    fun hideFloatingButton() {
        val intent = Intent(reactContext, OverlayService::class.java)
        intent.action = "HIDE"
        reactContext.startService(intent)
    }

    @ReactMethod
    fun updateOverlayStatus(status: String) {
        val intent = Intent(reactContext, OverlayService::class.java)
        intent.action = when (status) {
            "SAFE" -> "UPDATE_SAFE"
            "SUSPICIOUS" -> "UPDATE_SUSPICIOUS"
            "HIGH_THREAT" -> "UPDATE_HIGH"
            "CRITICAL_THREAT" -> "UPDATE_CRITICAL"
            else -> "UPDATE_SAFE"
        }
        reactContext.startService(intent)
    }

    @ReactMethod
    fun updateOverlayAlert(status: String, english: String, hindi: String) {
        val intent = Intent(reactContext, OverlayService::class.java).apply {
            action = "UPDATE_ALERT_TEXT"
            putExtra("status", status)
            putExtra("english", english)
            putExtra("hindi", hindi)
        }
        reactContext.startService(intent)
    }
}