import { createSlice } from "@reduxjs/toolkit";

const quizSlice = createSlice({
    name: "quiz_info",
    initialState: {
        quizzes: [],
    },
    reducers: {
        setQuizzes: (state, action) => {
            state.quizzes = action.payload;
        },
        unsetQuizzes: (state) => {
            state.quizzes = [];
        },
    },
});

export const { setQuizzes, unsetQuizzes } = quizSlice.actions;
export default quizSlice.reducer;
