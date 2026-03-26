import {DeviceEventEmitter, NativeModules} from 'react-native';

const {OverlayModule} = NativeModules;

export const overlayService = {
  async checkPermission(): Promise<boolean> {
    return OverlayModule.checkOverlayPermission();
  },

  openPermissionSettings() {
    OverlayModule.openOverlayPermissionSettings();
  },

  showFloatingButton() {
    OverlayModule.showFloatingButton();
  },

  hideFloatingButton() {
    OverlayModule.hideFloatingButton();
  },

  updateStatus(status: 'SAFE' | 'SUSPICIOUS' | 'HIGH_THREAT' | 'CRITICAL_THREAT') {
    OverlayModule.updateOverlayStatus(status);
  },

  updateAlert(
    status: 'SAFE' | 'SUSPICIOUS' | 'HIGH_THREAT' | 'CRITICAL_THREAT',
    english: string,
    hindi: string,
  ) {
    OverlayModule.updateOverlayAlert(status, english, hindi);
  },

  onAction(callback: (action: string) => void) {
    return DeviceEventEmitter.addListener('OverlayAction', event => {
      callback(event?.action ?? '');
    });
  },
};