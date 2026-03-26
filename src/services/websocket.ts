import {WS_URL} from './session';

type ThreatStatus = 'SAFE' | 'SUSPICIOUS' | 'HIGH_THREAT' | 'CRITICAL_THREAT';

export type ThreatPayload = {
  status: ThreatStatus;
  confidence: number;
  risk_score: number;
  reason: string;
  signals: string[];
  matched_phrases: string[];
  recommended_action: string;
  meta?: Record<string, any>;
};

type MessageHandler = (data: ThreatPayload) => void;
type OpenHandler = () => void;
type CloseHandler = () => void;
type ErrorHandler = (error: any) => void;

class LiveWebSocketService {
  private socket: WebSocket | null = null;
  private isConnecting = false;

  connect(
    onMessage: MessageHandler,
    onOpen?: OpenHandler,
    onClose?: CloseHandler,
    onError?: ErrorHandler,
  ) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already open');
      return;
    }

    if (this.socket?.readyState === WebSocket.CONNECTING || this.isConnecting) {
      console.log('WebSocket already connecting');
      return;
    }

    console.log('Creating WebSocket:', WS_URL);
    this.isConnecting = true;
    this.socket = new WebSocket(WS_URL);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.isConnecting = false;
      onOpen?.();
    };

    this.socket.onmessage = event => {
      try {
        const parsed = JSON.parse(event.data);
        onMessage(parsed);
      } catch (e) {
        console.log('WebSocket parse error:', e);
        onError?.(e);
      }
    };

    this.socket.onerror = error => {
      console.log('WebSocket error:', error);
      this.isConnecting = false;
      onError?.(error);
    };

    this.socket.onclose = event => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.isConnecting = false;
      this.socket = null;
      onClose?.();
    };
  }

  sendTranscript(text: string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('Sending transcript:', text);
      this.socket.send(text);
    } else {
      console.log('Socket not open, cannot send');
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('Manual WebSocket disconnect');
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
    this.isConnecting = false;
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const liveWebSocketService = new LiveWebSocketService();