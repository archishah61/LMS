import { createSlice } from "@reduxjs/toolkit";

const assignmentResponseSlice = createSlice({
    name: "assignment_response",
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
} = assignmentResponseSlice.actions;

export default assignmentResponseSlice.reducer;
