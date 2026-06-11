import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    faqOptions: null,
};

export const ProgressTrackingSlice = createSlice({
    name: "ProgressTrackingSlice",
    initialState,
    reducers: {
        setProgressTrackingSlice: (state, action) => {
            state.ProgressTrackingSlice = action.payload.ProgressTrackingSlice;
        },
        unsetProgressTrackingSlice: (state) => {
            state.ProgressTrackingSlice = null;
        },
    },
});

export const { setProgressTrackingSlice, unsetProgressTrackingSlice } = ProgressTrackingSlice.actions;
export default ProgressTrackingSlice.reducer;
