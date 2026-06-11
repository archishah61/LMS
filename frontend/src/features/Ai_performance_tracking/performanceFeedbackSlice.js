import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    currentFeedback: null,
    feedbackHistory: null,
    selectedFeedback: null,
};

export const PerformanceFeedbackSlice = createSlice({
    name: "PerformanceFeedbackSlice",
    initialState,
    reducers: {
        setCurrentFeedback: (state, action) => {
            state.currentFeedback = action.payload;
        },
        setFeedbackHistory: (state, action) => {
            state.feedbackHistory = action.payload;
        },
        setSelectedFeedback: (state, action) => {
            state.selectedFeedback = action.payload;
        },
        resetFeedback: (state) => {
            state.currentFeedback = null;
            state.feedbackHistory = null;
            state.selectedFeedback = null;
        },
    },
});

export const { 
    setCurrentFeedback, 
    setFeedbackHistory, 
    setSelectedFeedback, 
    resetFeedback 
} = PerformanceFeedbackSlice.actions;

export default PerformanceFeedbackSlice.reducer;
