import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    fillBlankQuestions: null,
};

export const fillBlankSlice = createSlice({
    name: "fill_blank_info",
    initialState,
    reducers: {
        setFillBlankInfo: (state, action) => {
            state.fillBlankQuestions = action.payload.fillBlankQuestions;
        },
        unsetFillBlankInfo: (state) => {
            state.fillBlankQuestions = null;
        },
    },
});

export const { setFillBlankInfo, unsetFillBlankInfo } = fillBlankSlice.actions;

export default fillBlankSlice.reducer;
