import {NativeEventEmitter, NativeModules} from 'react-native';

const {CaptureModule} = NativeModules;
const captureEmitter = new NativeEventEmitter(CaptureModule);

export const captureService = {
  async requestCapturePermission(): Promise<boolean> {
    return CaptureModule.requestCapturePermission();
  },

  stopCapture() {
    CaptureModule.stopCapture();
  },

  onPermissionResult(callback: (granted: boolean) => void) {
    return captureEmitter.addListener('CapturePermissionResult', event => {
      callback(!!event?.granted);
    });
  },

  onCaptureState(
    callback: (payload: {status: string; message: string}) => void,
  ) {
    return captureEmitter.addListener('CaptureState', event => {
      callback({
        status: event?.status ?? 'unknown',
        message: event?.message ?? '',
      });
    });
  },
};