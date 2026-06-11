import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    trueFalseQuestions: null,
};

export const trueFalseSlice = createSlice({
    name: "true_false_info",
    initialState,
    reducers: {
        setTrueFalseInfo: (state, action) => {
            state.trueFalseQuestions = action.payload.trueFalseQuestions;
        },
        unsetTrueFalseInfo: (state) => {
            state.trueFalseQuestions = null;
        },
    },
});

export const { setTrueFalseInfo, unsetTrueFalseInfo } = trueFalseSlice.actions;

export default trueFalseSlice.reducer;
