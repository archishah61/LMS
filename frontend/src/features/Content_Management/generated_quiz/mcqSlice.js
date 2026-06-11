import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    mcqs: null,
};

export const mcqSlice = createSlice({
    name: "mcq_info",
    initialState,
    reducers: {
        setMcqInfo: (state, action) => {
            state.mcqs = action.payload.mcqs;
        },
        unsetMcqInfo: (state) => {
            state.mcqs = null;
        },
    },
});

export const { setMcqInfo, unsetMcqInfo } = mcqSlice.actions;

export default mcqSlice.reducer;
