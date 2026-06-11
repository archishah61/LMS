import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    completeSentenceQuestions: [],  // All questions
    selectedQuestion: null,        // For edit/view modals etc.
};

export const completeSentenceSlice = createSlice({
    name: "completeSentence",
    initialState,
    reducers: {
        setCompleteSentenceQuestions: (state, action) => {
            state.completeSentenceQuestions = action.payload;
        },
        addCompleteSentenceQuestion: (state, action) => {
            state.completeSentenceQuestions.push(action.payload);
        },
        updateCompleteSentenceQuestion: (state, action) => {
            const index = state.completeSentenceQuestions.findIndex(
                (question) => question.id === action.payload.id
            );
            if (index !== -1) {
                state.completeSentenceQuestions[index] = action.payload;
            }
        },
        deleteCompleteSentenceQuestion: (state, action) => {
            state.completeSentenceQuestions = state.completeSentenceQuestions.filter(
                (question) => question.id !== action.payload.id
            );
        },
        setSelectedCompleteSentenceQuestion: (state, action) => {
            state.selectedQuestion = action.payload;
        },
        clearSelectedCompleteSentenceQuestion: (state) => {
            state.selectedQuestion = null;
        },
    },
});

export const {
    setCompleteSentenceQuestions,
    addCompleteSentenceQuestion,
    updateCompleteSentenceQuestion,
    deleteCompleteSentenceQuestion,
    setSelectedCompleteSentenceQuestion,
    clearSelectedCompleteSentenceQuestion,
} = completeSentenceSlice.actions;

export default completeSentenceSlice.reducer;
