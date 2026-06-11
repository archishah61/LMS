import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  audioToScriptResponses: [], // All responses
  selectedResponse: null,     // One selected response (for view/edit)
};

export const audioToScriptResponseSlice = createSlice({
  name: "audioToScriptResponse",
  initialState,
  reducers: {
    setAudioToScriptResponses: (state, action) => {
      state.audioToScriptResponses = action.payload;
    },
    addAudioToScriptResponse: (state, action) => {
      state.audioToScriptResponses.push(action.payload);
    },
    updateAudioToScriptResponse: (state, action) => {
      const index = state.audioToScriptResponses.findIndex(
        (res) => res.id === action.payload.id
      );
      if (index !== -1) {
        state.audioToScriptResponses[index] = action.payload;
      }
    },
    deleteAudioToScriptResponse: (state, action) => {
      state.audioToScriptResponses = state.audioToScriptResponses.filter(
        (res) => res.id !== action.payload.id
      );
    },
    setSelectedResponse: (state, action) => {
      state.selectedResponse = action.payload;
    },
    clearSelectedResponse: (state) => {
      state.selectedResponse = null;
    },
  },
});

export const {
  setAudioToScriptResponses,
  addAudioToScriptResponse,
  updateAudioToScriptResponse,
  deleteAudioToScriptResponse,
  setSelectedResponse,
  clearSelectedResponse,
} = audioToScriptResponseSlice.actions;

export default audioToScriptResponseSlice.reducer;
