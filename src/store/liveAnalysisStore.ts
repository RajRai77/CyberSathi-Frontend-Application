import {create} from 'zustand';

type ThreatStatus = 'SAFE' | 'SUSPICIOUS' | 'HIGH_THREAT' | 'CRITICAL_THREAT';

type State = {
  isLoggedIn: boolean;
  status: ThreatStatus;
  riskScore: number;
  latestReason: string;
  transcript: string[];
  isMonitoring: boolean;
  isConnected: boolean;
  setLoggedIn: (value: boolean) => void;
  setMonitoring: (value: boolean) => void;
  setConnected: (value: boolean) => void;
  updateThreat: (status: ThreatStatus, riskScore: number, latestReason: string) => void;
  addTranscript: (text: string) => void;
  resetSession: () => void;
};

export const useLiveAnalysisStore = create<State>(set => ({
  isLoggedIn: false,
  status: 'SAFE',
  riskScore: 0,
  latestReason: 'No threat detected.',
  transcript: [],
  isMonitoring: false,
  isConnected: false,
  setLoggedIn: value => set({isLoggedIn: value}),
  setMonitoring: value => set({isMonitoring: value}),
  setConnected: value => set({isConnected: value}),
  updateThreat: (status, riskScore, latestReason) =>
    set({status, riskScore, latestReason}),
  addTranscript: text =>
    set(state => ({
      transcript: [...state.transcript.slice(-5), text],
    })),
  resetSession: () =>
    set({
      status: 'SAFE',
      riskScore: 0,
      latestReason: 'No threat detected.',
      transcript: [],
      isMonitoring: false,
    }),
}));