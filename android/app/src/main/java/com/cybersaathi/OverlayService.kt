package com.cybersaathi

import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager

class OverlayService : Service() {

    private var windowManager: WindowManager? = null
    private var floatingView: View? = null
    private var expandedView: View? = null
    private var alertBannerView: View? = null

    private var currentStatus: String = "SAFE"
    private var currentEnglish: String = "Monitoring is ready."
    private var currentHindi: String = ""

    // Remember where the user dragged the shield!
    private var lastX = 40
    private var lastY = 300

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(1001, createNotification())
        when (intent?.action) {
            "SHOW" -> showFloatingButton()
            "HIDE" -> {
                removeExpandedPanel()
                removeAlertBanner()
                removeFloatingButton()
                stopForeground(true) 
                stopSelf()
            }
            "UPDATE_SAFE" -> {
                currentStatus = "SAFE"
                currentEnglish = "Call looks normal."
                currentHindi = ""
                updatePanel()
                updateAlertBanner()
            }
            "UPDATE_SUSPICIOUS" -> {
                currentStatus = "SUSPICIOUS"
                currentEnglish = "Be careful. Verify the caller."
                currentHindi = "सावधान रहें। कॉलर की पहचान जांचें।"
                updatePanel()
                updateAlertBanner()
            }
            "UPDATE_HIGH" -> {
                currentStatus = "HIGH_THREAT"
                currentEnglish = "Scam signs detected. Do not share details."
                currentHindi = "स्कैम के संकेत मिले हैं। कोई जानकारी शेयर न करें।"
                updatePanel()
                updateAlertBanner()
            }
            "UPDATE_CRITICAL" -> {
                currentStatus = "CRITICAL_THREAT"
                currentEnglish = "End the call now. Do not send money."
                currentHindi = "अभी कॉल काट दें। पैसे या OTP बिल्कुल शेयर न करें।"
                updatePanel()
                updateAlertBanner()
            }
            "UPDATE_ALERT_TEXT" -> {
                currentStatus = intent.getStringExtra("status") ?: currentStatus
                currentEnglish = intent.getStringExtra("english") ?: currentEnglish
                currentHindi = intent.getStringExtra("hindi") ?: currentHindi
                updatePanel()
                updateAlertBanner()
            }
        }
        return START_STICKY
    }

    private fun sendEventToReact(eventName: String, action: String) {
        try {
            val app = application as MainApplication
            val reactContext = app.reactHost.currentReactContext ?: return
            val map = Arguments.createMap()
            map.putString("action", action)
            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(eventName, map)
        } catch (_: Exception) {}
    }

    private fun getOverlayType(): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            WindowManager.LayoutParams.TYPE_PHONE
        }
    }

    private fun baseParams(width: Int, height: Int): WindowManager.LayoutParams {
        return WindowManager.LayoutParams(width, height, getOverlayType(), WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE, PixelFormat.TRANSLUCENT)
    }

    private fun removeExpandedPanel() {
        if (expandedView != null) {
            windowManager?.removeView(expandedView)
            expandedView = null
        }
    }

    private fun removeAlertBanner() {
        if (alertBannerView != null) {
            windowManager?.removeView(alertBannerView)
            alertBannerView = null
        }
    }

    private fun removeFloatingButton() {
        if (floatingView != null) {
            windowManager?.removeView(floatingView)
            floatingView = null
        }
    }

    private fun showAlertBanner() {
        if (alertBannerView != null) return

        val inflater = LayoutInflater.from(this)
        alertBannerView = inflater.inflate(R.layout.overlay_alert_banner, null)

        val params = baseParams(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.WRAP_CONTENT)
        params.gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
        params.y = 0 
        params.windowAnimations = android.R.style.Animation_InputMethod

        val btnMinimize = alertBannerView?.findViewById<TextView>(R.id.btnMinimize)
        btnMinimize?.setOnClickListener {
            // Only remove the banner, shield stays!
            removeAlertBanner()
        }

        windowManager?.addView(alertBannerView, params)
    }

    private fun updateAlertBanner() {
        if (alertBannerView == null) return

        val alertRoot = alertBannerView?.findViewById<LinearLayout>(R.id.alertRoot)
        val alertStatus = alertBannerView?.findViewById<TextView>(R.id.alertStatus)
        val alertTranscript = alertBannerView?.findViewById<TextView>(R.id.alertTranscript)
        val alertEnglish = alertBannerView?.findViewById<TextView>(R.id.alertEnglish)
        val alertHindi = alertBannerView?.findViewById<TextView>(R.id.alertHindi)

        when (currentStatus) {
            "SAFE" -> {
                alertRoot?.setBackgroundResource(R.drawable.bg_overlay_glass)
                alertStatus?.text = "MONITORING SAFE"
                alertStatus?.setBackgroundResource(R.drawable.bg_status_safe)
            }
            "SUSPICIOUS" -> {
                alertRoot?.setBackgroundResource(R.drawable.bg_overlay_glass)
                alertStatus?.text = "WARNING: COERCION DETECTED"
                alertStatus?.setBackgroundResource(R.drawable.bg_status_suspicious)
            }
            "HIGH_THREAT" -> {
                alertRoot?.setBackgroundResource(R.drawable.bg_overlay_glass)
                alertStatus?.text = "HIGH THREAT: IMPERSONATION"
                alertStatus?.setBackgroundResource(R.drawable.bg_status_high)
            }
            "CRITICAL_THREAT" -> {
                alertRoot?.setBackgroundResource(R.drawable.bg_overlay_alert_critical)
                alertStatus?.text = "CRITICAL SCAM DETECTED"
                alertStatus?.setBackgroundResource(R.drawable.bg_status_critical)
            }
        }

        alertEnglish?.text = currentEnglish
        
        if (currentHindi.isNotBlank()) {
             alertTranscript?.text = currentHindi
        }

        alertHindi?.visibility = View.VISIBLE
        alertHindi?.text = when(currentStatus) {
            "CRITICAL_THREAT" -> "यह कॉल स्कैम हो सकती है। कॉल काट दें। पैसे या OTP शेयर न करें।"
            "HIGH_THREAT" -> "स्कैम के संकेत मिले हैं। कोई जानकारी शेयर न करें।"
            "SUSPICIOUS" -> "सावधान रहें। कॉलर की पहचान जांचें।"
            else -> ""
        }
        if (currentStatus == "SAFE") {
             alertHindi?.visibility = View.GONE
        }
    }

    private fun updatePanel() {
        val floatingLabel = floatingView?.findViewById<TextView>(R.id.floatingLabel)
        when (currentStatus) {
            "SAFE" -> floatingLabel?.text = "Safe"
            "SUSPICIOUS" -> floatingLabel?.text = "Warn"
            "HIGH_THREAT" -> floatingLabel?.text = "Risk"
            "CRITICAL_THREAT" -> floatingLabel?.text = "Scam"
        }

        if (expandedView == null) return

        val statusView = expandedView!!.findViewById<TextView>(R.id.panelStatus)
        val englishView = expandedView!!.findViewById<TextView>(R.id.panelEnglish)
        
        when (currentStatus) {
            "SAFE" -> {
                statusView.text = "SAFE"
                statusView.setBackgroundResource(R.drawable.bg_status_safe)
            }
            "SUSPICIOUS" -> {
                statusView.text = "SUSPICIOUS"
                statusView.setBackgroundResource(R.drawable.bg_status_suspicious)
            }
            "HIGH_THREAT" -> {
                statusView.text = "HIGH THREAT"
                statusView.setBackgroundResource(R.drawable.bg_status_high)
            }
            "CRITICAL_THREAT" -> {
                statusView.text = "CRITICAL"
                statusView.setBackgroundResource(R.drawable.bg_status_critical)
            }
        }
        englishView.text = currentEnglish
    }

    private fun showExpandedPanel() {
        if (expandedView != null) return

        val inflater = LayoutInflater.from(this)
        expandedView = inflater.inflate(R.layout.overlay_expanded_panel, null)

        val params = baseParams(WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT)
        params.gravity = Gravity.TOP or Gravity.START
        params.x = lastX
        params.y = lastY

        val closeButton = expandedView!!.findViewById<Button>(R.id.closePanelButton)
        val startButton = expandedView!!.findViewById<Button>(R.id.startListeningButton)
        val stopButton = expandedView!!.findViewById<Button>(R.id.stopListeningButton)
        val transcriptBtn = expandedView!!.findViewById<Button>(R.id.showTranscriptButton)

        closeButton.setOnClickListener {
            removeExpandedPanel()
            showFloatingButton() 
        }

        startButton.setOnClickListener {
            sendEventToReact("OverlayAction", "start_listening")
        }

        stopButton.setOnClickListener {
            sendEventToReact("OverlayAction", "stop_listening")
            removeExpandedPanel()
            removeAlertBanner()
            showFloatingButton()
        }

        transcriptBtn.setOnClickListener {
            removeExpandedPanel()
            showFloatingButton() // Ensure shield is visible
            showAlertBanner()
            updateAlertBanner()
        }

        removeFloatingButton() // Hide shield while menu is open
        windowManager?.addView(expandedView, params)
        updatePanel()
    }

    private fun showFloatingButton() {
        if (floatingView != null) return

        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        val inflater = LayoutInflater.from(this)
        floatingView = inflater.inflate(R.layout.overlay_floating_button, null)

        val params = baseParams(WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT)
        params.gravity = Gravity.TOP or Gravity.START
        params.x = lastX
        params.y = lastY

        val floatingRoot = floatingView!!.findViewById<View>(R.id.floatingRoot)

        floatingRoot.setOnTouchListener(object : View.OnTouchListener {
            private var initialX = 0
            private var initialY = 0
            private var initialTouchX = 0f
            private var initialTouchY = 0f
            private var isDragging = false
            private var downTime: Long = 0

            override fun onTouch(v: View, event: MotionEvent): Boolean {
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = params.x
                        initialY = params.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        isDragging = false
                        downTime = System.currentTimeMillis()
                        return true
                    }

                    MotionEvent.ACTION_MOVE -> {
                        val dx = event.rawX - initialTouchX
                        val dy = event.rawY - initialTouchY

                        if (kotlin.math.abs(dx) > 8 || kotlin.math.abs(dy) > 8) {
                            isDragging = true
                        }

                        params.x = initialX + dx.toInt()
                        params.y = initialY + dy.toInt()
                        
                        // Save dragged position
                        lastX = params.x
                        lastY = params.y
                        
                        windowManager?.updateViewLayout(floatingView, params)
                        return true
                    }

                    MotionEvent.ACTION_UP -> {
                        val clickDuration = System.currentTimeMillis() - downTime
                        val displayMetrics = resources.displayMetrics
                        val screenHeight = displayMetrics.heightPixels
                        
                        // Drag to bottom to kill
                        if (params.y > screenHeight - (screenHeight * 0.15)) {
                            sendEventToReact("OverlayAction", "stop_listening")
                            removeFloatingButton()
                            removeExpandedPanel()
                            removeAlertBanner()
                            stopSelf()
                            return true
                        }

                        // Short tap opens the Options Menu
                        if (!isDragging && clickDuration < 250) {
                            showExpandedPanel()
                        }
                        return true
                    }
                }
                return false
            }
        })

        windowManager?.addView(floatingView, params)
        updatePanel()
    }

override fun onDestroy() {
        removeExpandedPanel()
        removeAlertBanner()
        removeFloatingButton()
        stopForeground(true)
        super.onDestroy()
    }

    private val CHANNEL_ID = "CyberSaathiLiveShield"

    private fun createNotification(): Notification {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Live Call Shield",
                NotificationManager.IMPORTANCE_LOW // Low importance so it doesn't vibrate/beep continuously
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        return Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("CyberSaathi Active")
            .setContentText("AI is monitoring your screen/call.")
            .setSmallIcon(android.R.drawable.ic_secure) // Default Android shield icon
            .build()
    }

}