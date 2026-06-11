import { createSlice } from "@reduxjs/toolkit";

const quizOptionSlice = createSlice({
    name: "quiz_option_info",
    initialState: {
        quizOptions: [],
    },
    reducers: {
        setQuizOptions: (state, action) => {
            state.quizOptions = action.payload;
        },
        unsetQuizOptions: (state) => {
            state.quizOptions = [];
        },
    },
});

export const { setQuizOptions, unsetQuizOptions } = quizOptionSlice.actions;
export default quizOptionSlice.reducer;
