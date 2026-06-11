import { createSlice } from "@reduxjs/toolkit";

const textBasedQuizTextSlice = createSlice({
    name: "text_based_quiz_text_info",
    initialState: {
        textBasedQuizText: [],
    },
    reducers: {
        setTextBasedQuizText: (state, action) => {
            state.textBasedQuizText = action.payload;
        },
        unsetTextBasedQuizText: (state) => {
            state.textBasedQuizText = [];
        },
    },
});

export const { setTextBasedQuizText, unsetTextBasedQuizText } = textBasedQuizTextSlice.actions;
export default textBasedQuizTextSlice.reducer;