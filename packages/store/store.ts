import { configureStore } from "@reduxjs/toolkit";
import { repoSlice } from "../slice/repoSlice";

const saveToStorage = (state: any) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('gitgist-state', JSON.stringify(state));
    } catch {}
  }
};

const loadFromStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('gitgist-state');
      if (saved) {
        const state = JSON.parse(saved);
        if (state.repo?.repoData) store.dispatch(repoSlice.actions.setRepoData(state.repo.repoData));
        if (state.repo?.folderstructure) store.dispatch(repoSlice.actions.setFolderStructure(state.repo.folderstructure));
        if (state.repo?.commit) store.dispatch(repoSlice.actions.setCommit(state.repo.commit));
      }
    } catch {}
  }
};

export const store = configureStore({
  reducer: {
    repo: repoSlice.reducer,
  },
});

// Auto-save on changes
store.subscribe(() => saveToStorage(store.getState()));

// Load saved data
loadFromStorage();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
