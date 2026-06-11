import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    interests: [],        // stores feature interest records
    total: 0,             // total count for pagination
    currentPage: 1,
    limit: 10,
    searchTerm: "",
};

export const featureInterestSlice = createSlice({
    name: "feature_interest",
    initialState,
    reducers: {
        setFeatureInterestState: (state, action) => {
            Object.assign(state, action.payload);
        },
        clearFeatureInterestState: (state) => {
            state.interests = [];
            state.total = 0;
            state.currentPage = 1;
            state.searchTerm = "";
        },
    },
});

export const {
    setFeatureInterestState,
    clearFeatureInterestState,
} = featureInterestSlice.actions;

export default featureInterestSlice.reducer;
