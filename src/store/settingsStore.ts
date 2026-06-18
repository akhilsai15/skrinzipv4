import { create } from 'zustand';

interface SettingsState {
  regionalBoostEnabled: boolean;
  setRegionalBoost: (val: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  regionalBoostEnabled: false,
  setRegionalBoost: (val) => set({ regionalBoostEnabled: val }),
}));
