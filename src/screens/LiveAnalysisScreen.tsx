import React, {useEffect, useRef, useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import AppButton from '../components/AppButton';
import StatusBadge from '../components/StatusBadge';
import ThreatMeter from '../components/ThreatMeter';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {useLiveAnalysisStore} from '../store/liveAnalysisStore';
import {liveWebSocketService, ThreatPayload} from '../services/websocket';
import {overlayService} from '../services/overlay';
import {speechService} from '../services/speech';
import {captureService} from '../services/capture';

/** @typedef {import('../services/websocket').ThreatPayload} ThreatPayload */

export default function LiveAnalysisScreen() {
  const {
    status,
    riskScore,
    latestReason,
    transcript,
    isMonitoring,
    isConnected,
    setMonitoring,
    setConnected,
    updateThreat,
    addTranscript,
    resetSession,
  } = useLiveAnalysisStore();

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechState, setSpeechState] = useState('idle');
  const [isCaptureActive, setIsCaptureActive] = useState(false);
  const [captureMessage, setCaptureMessage] = useState('Capture inactive');

  const lastSentRef = useRef('');

  useEffect(() => {
    // 1. RAW SPEED: Send immediately on Partial results
    const partialSub = speechService.onPartial(text => {
      if (!text || !liveWebSocketService.isConnected()) {
        return;
      }
      
      const normalized = String(text).trim();
      setInputText(normalized);

      // Instantly send to backend if it's new
      if (normalized && normalized !== lastSentRef.current) {
        lastSentRef.current = normalized;
        addTranscript(normalized);
        liveWebSocketService.sendTranscript(normalized);
      }
    });

    // 2. RAW SPEED: Final result
    const resultSub = speechService.onResult(text => {
      if (!text || !liveWebSocketService.isConnected()) {
        return;
      }

      const normalized = String(text).trim();
      
      if (normalized && normalized !== lastSentRef.current) {
        lastSentRef.current = normalized;
        addTranscript(normalized);
        liveWebSocketService.sendTranscript(normalized);
      }
      
      // Clear input box after final result is sent
      setInputText('');
    });

    const stateSub = speechService.onState(state => {
      setSpeechState(state || 'idle');
    });

    const errorSub = speechService.onError(message => {
      console.log('Speech error:', message);
    });

    const capturePermissionSub = captureService.onPermissionResult(granted => {
      setIsCaptureActive(Boolean(granted));
      setCaptureMessage(granted ? 'Capture permission granted' : 'Capture permission denied');
    });

    const captureStateSub = captureService.onCaptureState(event => {
      const captureStatus = event?.status;
      const message = event?.message;

      setCaptureMessage(message || 'Capture state updated');

      if (captureStatus === 'active') {
        setIsCaptureActive(true);
      } else if (captureStatus === 'stopped' || captureStatus === 'error') {
        setIsCaptureActive(false);
      }
    });

    const overlayActionSub = overlayService.onAction(async action => {
      if (action === 'start_listening') {
        await startListening();
      } else if (action === 'stop_listening') {
        await stopListening();
      }
    });

    return () => {
      partialSub.remove();
      resultSub.remove();
      stateSub.remove();
      errorSub.remove();
      capturePermissionSub.remove();
      captureStateSub.remove();
      overlayActionSub.remove();

      speechService.destroy();
      liveWebSocketService.disconnect();

      setConnected(false);
      setMonitoring(false);
      setIsListening(false);
      setIsCaptureActive(false);
    };
  }, [addTranscript, setConnected, setMonitoring]);

  /**
   * PERFECT FORMATTING FOR THE NATIVE OVERLAY
   * @param {ThreatPayload} data
   */
  const updateOverlayFromThreat = (data: ThreatPayload) => {
    const currentStatus = data?.status || 'SAFE';
    const aiReason = data?.reason || 'Monitoring active.';
    
    // Extract history and format beautifully
    const currentHistory = useLiveAnalysisStore.getState().transcript;
    
    let formattedHistory = "Listening for voice...";
    if (currentHistory.length > 0) {
        // Grab the last 4 messages and separate them with a double line break
        formattedHistory = currentHistory.slice(-4).join('\n\n');
    }

    overlayService.updateAlert(currentStatus, aiReason, formattedHistory);
  };

  const showFloatingButton = async () => {
    try {
      const granted = await overlayService.checkPermission();

      if (!granted) {
        Alert.alert(
          'Overlay Permission Required',
          'Allow display over other apps to use the floating protection button.',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Open Settings',
              onPress: () => overlayService.openPermissionSettings(),
            },
          ],
        );
        return;
      }

      overlayService.showFloatingButton();
      overlayService.updateStatus(status || 'SAFE');
    } catch (error) {
      console.log('Show floating button error:', error);
      Alert.alert('Error', 'Could not show floating button.');
    }
  };

  const hideFloatingButton = () => {
    try {
      overlayService.hideFloatingButton();
    } catch (error) {
      console.log('Hide floating button error:', error);
    }
  };

  const startMonitoring = () => {
    if (isConnected || isMonitoring || liveWebSocketService.isConnected()) {
      return;
    }

    liveWebSocketService.connect(
      data => {
        const safeStatus = data?.status || 'SAFE';
        const score = Number(data?.risk_score ?? data?.confidence ?? 0);
        const reason = data?.reason || 'Analysis complete.';

        updateThreat(safeStatus, score, reason);
        overlayService.updateStatus(safeStatus);
        
        // Trigger the formatted update
        updateOverlayFromThreat({
          ...data,
          status: safeStatus,
          risk_score: score,
          reason,
        });
      },
      () => {
        setConnected(true);
        setMonitoring(true);
      },
      () => {
        setConnected(false);
        setMonitoring(false);
      },
      error => {
        console.log('WebSocket error:', error);
        Alert.alert(
          'Connection Error',
          'Could not connect to backend. Make sure laptop and phone are on the same Wi-Fi and backend is running.',
        );
        setConnected(false);
        setMonitoring(false);
      },
    );
  };

  const stopMonitoring = async () => {
    liveWebSocketService.disconnect();
    setConnected(false);
    setMonitoring(false);
    overlayService.updateStatus('SAFE');
    overlayService.updateAlert('SAFE', 'Monitoring stopped.', '');

    if (isListening) {
      try {
        await speechService.stopListening();
      } catch (e) {
        console.log('Stop listening while stopping monitoring failed:', e);
      }
      setIsListening(false);
      setSpeechState('idle');
    }
  };

  const startListening = async () => {
    if (!liveWebSocketService.isConnected()) {
      Alert.alert('Start Monitoring First', 'Connect the backend before live listening.');
      return;
    }

    const granted = await speechService.requestMicPermission();
    if (!granted) {
      Alert.alert('Microphone Permission Needed', 'Please allow microphone access.');
      return;
    }

    const available = await speechService.isAvailable();
    if (!available) {
      Alert.alert(
        'Speech Recognition Not Available',
        'This device does not have a working speech recognition service.',
      );
      return;
    }

    try {
      await speechService.startListening();
      setIsListening(true);
      overlayService.updateAlert(
        'SAFE',
        'Listening started. Speak or play the call audio.',
        '',
      );
    } catch (error) {
      console.log('Start listening failed:', error);
      const errorText =
        error instanceof Error ? error.message : 'Speech recognizer failed to start.';
      Alert.alert('Could not start live listening', errorText);
    }
  };

  const stopListening = async () => {
    try {
      await speechService.stopListening();
      setIsListening(false);
      setSpeechState('idle');
      overlayService.updateAlert('SAFE', 'Listening stopped.', '');
    } catch (error) {
      console.log('Stop listening failed:', error);
    }
  };

  const startScreenCapture = async () => {
    try {
      const granted = await captureService.requestCapturePermission();

      if (granted) {
        setIsCaptureActive(true);
        setCaptureMessage('Capture permission granted');
        Alert.alert('Capture Started', 'Advanced screen/audio capture started.');
      } else {
        Alert.alert('Permission Denied', 'Screen/audio capture was not allowed.');
      }
    } catch (error) {
      console.log('Capture start error:', error);
      const errorText =
        error instanceof Error ? error.message : 'Could not start capture.';
      Alert.alert('Capture Error', errorText);
    }
  };

  const stopScreenCapture = () => {
    captureService.stopCapture();
    setIsCaptureActive(false);
    setCaptureMessage('Capture stopped');
    Alert.alert('Capture Stopped', 'Screen/audio capture has stopped.');
  };

  const sendTranscriptChunk = () => {
    const trimmed = String(inputText).trim();

    if (!trimmed) {
      return;
    }

    if (!liveWebSocketService.isConnected()) {
      Alert.alert('Not Connected', 'Start monitoring first.');
      return;
    }

    addTranscript(trimmed);
    liveWebSocketService.sendTranscript(trimmed);
    setInputText('');
  };

  const handleReset = () => {
    resetSession();
    overlayService.updateStatus('SAFE');
    overlayService.updateAlert('SAFE', 'Monitoring reset.', '');
    setInputText('');
    setSpeechState('idle');
    setCaptureMessage('Capture inactive');
    lastSentRef.current = '';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>LIVE PROTECTION</Text>
        <Text style={styles.heroTitle}>Real-time backend connected analysis</Text>
        <Text style={styles.heroSubtitle}>
          Use the floating shield while monitoring ongoing calls or video sessions.
        </Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.row}>
          <Text style={styles.heading}>Session Status</Text>
          <StatusBadge status={status} />
        </View>

        <View style={styles.smallSpacer} />
        <AppButton title="Show Floating Shield" onPress={showFloatingButton} />
        <View style={styles.smallSpacer} />
        <AppButton
          title="Hide Floating Shield"
          onPress={hideFloatingButton}
          variant="secondary"
        />

        <View style={styles.connectionRow}>
          <Text style={styles.connectionText}>
            Backend: {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
          <Text style={styles.connectionText}>
            Monitoring: {isMonitoring ? 'On' : 'Off'}
          </Text>
        </View>

        <View style={styles.connectionRow}>
          <Text style={styles.connectionText}>
            Listening: {isListening ? 'On' : 'Off'}
          </Text>
          <Text style={styles.connectionText}>Speech: {speechState}</Text>
        </View>

        <View style={styles.connectionRow}>
          <Text style={styles.connectionText}>
            Capture: {isCaptureActive ? 'On' : 'Off'}
          </Text>
          <Text style={styles.connectionText}>{captureMessage}</Text>
        </View>

        <View style={styles.spacer} />
        <ThreatMeter score={riskScore} />
        <Text style={styles.reason}>{latestReason}</Text>

        {!isMonitoring ? (
          <AppButton title="Start Monitoring" onPress={startMonitoring} />
        ) : (
          <AppButton
            title="Stop Monitoring"
            onPress={stopMonitoring}
            variant="secondary"
          />
        )}

        <View style={styles.smallSpacer} />

        {!isListening ? (
          <AppButton title="Start Listening" onPress={startListening} />
        ) : (
          <AppButton
            title="Stop Listening"
            onPress={stopListening}
            variant="secondary"
          />
        )}

        <View style={styles.smallSpacer} />

        {!isCaptureActive ? (
          <AppButton
            title="Start Screen / Audio Capture"
            onPress={startScreenCapture}
          />
        ) : (
          <AppButton
            title="Stop Screen / Audio Capture"
            onPress={stopScreenCapture}
            variant="secondary"
          />
        )}

        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Live Transcript</Text>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Recognized speech or manual test text..."
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            multiline
          />
          <AppButton title="Send Manual Chunk" onPress={sendTranscriptChunk} />
        </View>

        {(status === 'HIGH_THREAT' || status === 'CRITICAL_THREAT') && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>
              {status === 'CRITICAL_THREAT'
                ? 'This may be a scam call.'
                : 'Suspicious scam signals detected.'}
            </Text>
            <Text style={styles.warningHindi}>
              {status === 'CRITICAL_THREAT'
                ? 'यह कॉल स्कैम हो सकती है। कॉल काट दें। पैसे या OTP शेयर न करें।'
                : 'सावधान रहें। कोई जानकारी या पैसे शेयर न करें।'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.panel}>
        <View style={styles.row}>
          <Text style={styles.sectionTitle}>Recent Transcript Chunks</Text>
          <AppButton
            title="Reset"
            onPress={handleReset}
            variant="secondary"
            style={{paddingVertical: 10, paddingHorizontal: 14}}
          />
        </View>

        {transcript.length === 0 ? (
          <Text style={styles.empty}>No transcript sent yet.</Text>
        ) : (
          transcript.map((line, index) => (
            <View key={`${line}-${index}`} style={styles.transcriptRow}>
              <View style={styles.transcriptDot} />
              <Text style={styles.line}>{line}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#F6FBF8',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: (spacing.xl || 24) * 2,
  },
  hero: {
    backgroundColor: '#EAF1FB',
    borderRadius: 28,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#D8E4F3',
    marginBottom: spacing.lg,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.info,
    letterSpacing: 1,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  connectionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  spacer: {
    height: spacing.md,
  },
  smallSpacer: {
    height: spacing.sm,
  },
  reason: {
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    fontSize: 15,
    lineHeight: 22,
  },
  inputSection: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  input: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: '#fff',
    padding: 14,
    fontSize: 15,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  warningBox: {
    marginTop: spacing.lg,
    backgroundColor: '#FFF1EF',
    borderWidth: 1,
    borderColor: '#FFD2CC',
    borderRadius: 18,
    padding: spacing.md,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.danger,
    marginBottom: 8,
  },
  warningHindi: {
    fontSize: 15,
    lineHeight: 22,
    color: '#8E2F25',
    fontWeight: '700',
  },
  empty: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  transcriptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  transcriptDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.secondary || '#2EA36A',
    marginTop: 7,
  },
  line: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },
});