import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    faqOptions: null,
};

export const CoursePerformanceTrackingSlice = createSlice({
    name: "CoursePerformanceTrackingSlice",
    initialState,
    reducers: {
        setPerformanceTrackingSlice: (state, action) => {
            state.CoursePerformanceTrackingSlice = action.payload.CoursePerformanceTrackingSlice;
        },
        unsetPerformanceTrackingSlice: (state) => {
            state.CoursePerformanceTrackingSlice = null;
        },
    },
});

export const { setPerformanceTrackingSlice, unsetPerformanceTrackingSlice } = CoursePerformanceTrackingSlice.actions;
export default CoursePerformanceTrackingSlice.reducer;
