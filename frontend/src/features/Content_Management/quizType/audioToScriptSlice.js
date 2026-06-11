import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  audioToScriptQuestions: [], // Store all audio-to-script questions
  selectedQuestion: null,     // Store a selected question if needed
};

export const audioToScriptSlice = createSlice({
  name: "audioToScript",
  initialState,
  reducers: {
    setAudioToScriptQuestions: (state, action) => {
      state.audioToScriptQuestions = action.payload;
    },
    addAudioToScriptQuestion: (state, action) => {
      state.audioToScriptQuestions.push(action.payload);
    },
    updateAudioToScriptQuestion: (state, action) => {
      const index = state.audioToScriptQuestions.findIndex(
        (question) => question.id === action.payload.id
      );
      if (index !== -1) {
        state.audioToScriptQuestions[index] = action.payload;
      }
    },
    deleteAudioToScriptQuestion: (state, action) => {
      state.audioToScriptQuestions = state.audioToScriptQuestions.filter(
        (question) => question.id !== action.payload.id
      );
    },
    setSelectedQuestion: (state, action) => {
      state.selectedQuestion = action.payload;
    },
    clearSelectedQuestion: (state) => {
      state.selectedQuestion = null;
    },
  },
});

export const {
  setAudioToScriptQuestions,
  addAudioToScriptQuestion,
  updateAudioToScriptQuestion,
  deleteAudioToScriptQuestion,
  setSelectedQuestion,
  clearSelectedQuestion,
} = audioToScriptSlice.actions;

export default audioToScriptSlice.reducer;