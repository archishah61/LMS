import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    quizPreDefinedMappings: null,
};

export const quizPreDefinedQuestionsSlice = createSlice({
    name: "quizPreDefinedQuestions",
    initialState,
    reducers: {
        setQuizPreDefinedMappings: (state, action) => {
            state.quizPreDefinedMappings = action.payload.quizPreDefinedMappings;
        },
        unsetQuizPreDefinedMappings: (state) => {
            state.quizPreDefinedMappings = null;
        },
    },
});

export const { setQuizPreDefinedMappings, unsetQuizPreDefinedMappings } = quizPreDefinedQuestionsSlice.actions;

export default quizPreDefinedQuestionsSlice.reducer;
