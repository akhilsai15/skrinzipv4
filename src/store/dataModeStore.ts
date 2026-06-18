import { create } from 'zustand';

export const DATA_MODES = {
  HIGH: 'high',
  DATA_SAVER: 'data_saver'
};

interface DataModeState {
  dataMode: string;
  setDataMode: (mode: string) => void;
}

export const useDataModeStore = create<DataModeState>((set) => ({
  dataMode: DATA_MODES.HIGH,
  setDataMode: (mode) => set({ dataMode: mode }),
}));
