import { create } from 'zustand';

interface SavedState {
  savedPosts: any[];
  repostedPosts: any[];
  hydrate: () => void;
}

export const useSavedStore = create<SavedState>((set) => ({
  savedPosts: [],
  repostedPosts: [],
  hydrate: () => {},
}));
