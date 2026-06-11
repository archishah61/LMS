import { createSlice } from "@reduxjs/toolkit";

const assignmentExtensionRequestSlice = createSlice({
    name: "assignment_extension_request",
    initialState: {
        requests: [], // all extension requests
    },
    reducers: {
        setRequests: (state, action) => {
            state.requests = action.payload;
        },
        unsetRequests: (state) => {
            state.requests = [];
        },
        addRequest: (state, action) => {
            state.requests.push(action.payload);
        },
        updateRequest: (state, action) => {
            const index = state.requests.findIndex(r => r.id === action.payload.id);
            if (index !== -1) {
                state.requests[index] = action.payload;
            }
        },
        removeRequest: (state, action) => {
            state.requests = state.requests.filter(request => request.id !== action.payload);
        },
    },
});

export const {
    setRequests,
    unsetRequests,
    addRequest,
    updateRequest,
    removeRequest,
} = assignmentExtensionRequestSlice.actions;

export default assignmentExtensionRequestSlice.reducer;
