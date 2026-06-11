import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    histories: null, // All course history for a user (without structure)
    selectedHistory: null, // Single course history by ID (with structure)
};

export const courseGenerationHistorySlice = createSlice({
    name: "courseGenerationHistory",
    initialState,
    reducers: {
        // ✅ Set all histories
        setHistories: (state, action) => {
            state.histories = action.payload.histories;
        },
        // ✅ Unset all histories
        unsetHistories: (state) => {
            state.histories = null;
        },
        // ✅ Set single history
        setSelectedHistory: (state, action) => {
            state.selectedHistory = action.payload.history;
        },
        // ✅ Unset single history
        unsetSelectedHistory: (state) => {
            state.selectedHistory = null;
        },
    },
});

export const {
    setHistories,
    unsetHistories,
    setSelectedHistory,
    unsetSelectedHistory,
} = courseGenerationHistorySlice.actions;

export default courseGenerationHistorySlice.reducer;
