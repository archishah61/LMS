import { createSlice } from "@reduxjs/toolkit";
 
// Initial state structure
const initialState = {
  realWordQuestions: [],              // Array of all real-word questions
  selectedRealWordQuestion: null,     // Currently selected question (e.g., for edit/view)
};
 
export const realWordQuestionSlice = createSlice({
  name: "realWordQuestion",
  initialState,
  reducers: {
    // ✅ Set all questions (e.g., fetched from backend)
    setRealWordQuestions: (state, action) => {
      state.realWordQuestions = action.payload;
    },
 
    // ✅ Add one question
    addRealWordQuestion: (state, action) => {
      state.realWordQuestions.push(action.payload);
    },
 
    // ✅ Update question by ID
    updateRealWordQuestion: (state, action) => {
      const updated = action.payload;
      const index = state.realWordQuestions.findIndex(q => q.id === updated.id);
      if (index !== -1) {
        state.realWordQuestions[index] = updated;
      }
    },
 
    // ✅ Delete question by ID
    deleteRealWordQuestion: (state, action) => {
      const idToDelete = action.payload;
      state.realWordQuestions = state.realWordQuestions.filter(q => q.id !== idToDelete);
    },
 
    // ✅ Select a question for editing/viewing
    setSelectedRealWordQuestion: (state, action) => {
      state.selectedRealWordQuestion = action.payload;
    },
 
    // ✅ Clear selected
    clearSelectedRealWordQuestion: (state) => {
      state.selectedRealWordQuestion = null;
    },
  },
});
 
export const {
  setRealWordQuestions,
  addRealWordQuestion,
  updateRealWordQuestion,
  deleteRealWordQuestion,
  setSelectedRealWordQuestion,
  clearSelectedRealWordQuestion,
} = realWordQuestionSlice.actions;
 
export default realWordQuestionSlice.reducer;
 