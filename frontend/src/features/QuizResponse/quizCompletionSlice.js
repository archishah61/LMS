import { createSlice } from "@reduxjs/toolkit";

const quizCompletionSlice = createSlice({
    name: "quiz_completion",
    initialState: {
        completions: [],
    },
    reducers: {
        setCompletions: (state, action) => {
            state.completions = action.payload;
        },
        unsetCompletions: (state) => {
            state.completions = [];
        },
        addCompletion: (state, action) => {
            state.completions.push(action.payload);
        },
        updateCompletion: (state, action) => {
            const index = state.completions.findIndex(c => c.id === action.payload.id);
            if (index !== -1) {
                state.completions[index] = action.payload;
            }
        },
        removeCompletion: (state, action) => {
            state.completions = state.completions.filter(completion => completion.id !== action.payload);
        },
    },
});

export const {
    setCompletions,
    unsetCompletions,
    addCompletion,
    updateCompletion,
    removeCompletion
} = quizCompletionSlice.actions;

export default quizCompletionSlice.reducer;
