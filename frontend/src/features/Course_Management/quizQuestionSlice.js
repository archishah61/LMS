import { createSlice } from "@reduxjs/toolkit";

const quizQuestionSlice = createSlice({
    name: "quiz_question_info",
    initialState: {
        quizQuestions: [],
    },
    reducers: {
        setQuizQuestions: (state, action) => {
            state.quizQuestions = action.payload;
        },
        unsetQuizQuestions: (state) => {
            state.quizQuestions = [];
        },
    },
});

export const { setQuizQuestions, unsetQuizQuestions } = quizQuestionSlice.actions;
export default quizQuestionSlice.reducer;