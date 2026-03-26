import {NativeEventEmitter, NativeModules, PermissionsAndroid, Platform} from 'react-native';

const {SpeechModule} = NativeModules;

const speechEmitter = new NativeEventEmitter(SpeechModule);

export const speechService = {
  async requestMicPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message: 'CyberSaathi needs microphone access for live speech monitoring.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  },

  async isAvailable(): Promise<boolean> {
    return SpeechModule.isSpeechAvailable();
  },

  async startListening(): Promise<boolean> {
    return SpeechModule.startListening();
  },

  async stopListening(): Promise<boolean> {
    return SpeechModule.stopListening();
  },

  destroy() {
    SpeechModule.destroyRecognizer();
  },

  onPartial(callback: (text: string) => void) {
    return speechEmitter.addListener('SpeechPartial', event => {
      if (event?.text) {
        callback(event.text);
      }
    });
  },

  onResult(callback: (text: string) => void) {
    return speechEmitter.addListener('SpeechResult', event => {
      if (event?.text) {
        callback(event.text);
      }
    });
  },

  onState(callback: (state: string) => void) {
    return speechEmitter.addListener('SpeechState', event => {
      callback(event?.state ?? 'unknown');
    });
  },

  onError(callback: (message: string) => void) {
    return speechEmitter.addListener('SpeechError', event => {
      callback(event?.message ?? 'Unknown speech error');
    });
  },
};