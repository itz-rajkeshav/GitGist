import { createSlice, PayloadAction, Slice } from "@reduxjs/toolkit";
import { githubFile, RepoData, commit } from "../lib/type";

export interface RepoState {
  folderstructure: githubFile['folderstructure'][];
  repoData: RepoData[];
  commit: commit[];
}
export const repoSlice : Slice<RepoState> = createSlice({
  name: "repo",

  initialState: {
    folderstructure: [],
    repoData: [],
    commit: [],
  } as RepoState,
  
  reducers: {
    setFolderStructure: (state, action:PayloadAction<githubFile['folderstructure'][]>) => {
      state.folderstructure = action.payload;
    },
    setRepoData: (state, action:PayloadAction<RepoData[]>) => {
      state.repoData = action.payload;
    },
    setCommit: (state, action:PayloadAction<commit[]>) => {
      state.commit = action.payload;
    },
  },
});

export const { setRepoData, setFolderStructure, setCommit } = repoSlice.actions;
export default repoSlice.reducer;
