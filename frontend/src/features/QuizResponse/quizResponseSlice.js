import { createSlice } from "@reduxjs/toolkit";

const quizResponsesSlice = createSlice({
    name: "quiz_responses",
    initialState: {
        responses: [],
    },
    reducers: {
        setResponses: (state, action) => {
            state.responses = action.payload;
        },
        unsetResponses: (state) => {
            state.responses = [];
        },
        addResponse: (state, action) => {
            state.responses.push(action.payload);
        },
        updateResponse: (state, action) => {
            const index = state.responses.findIndex(r => r.id === action.payload.id);
            if (index !== -1) {
                state.responses[index] = action.payload;
            }
        },
        removeResponse: (state, action) => {
            state.responses = state.responses.filter(response => response.id !== action.payload);
        },
    },
});

export const {
    setResponses,
    unsetResponses,
    addResponse,
    updateResponse,
    removeResponse
} = quizResponsesSlice.actions;

export default quizResponsesSlice.reducer;
