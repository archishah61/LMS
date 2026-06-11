import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    isFeatureModalOpen: false,
    selectedFeature: null,
};

const frontendFeaturesSlice = createSlice({
    name: "frontendFeatures",
    initialState,
    reducers: {
        setFeatureModalOpen: (state, action) => {
            state.isFeatureModalOpen = action.payload;
        },
        setSelectedFeature: (state, action) => {
            state.selectedFeature = action.payload;
        },
    },
});

export const { setFeatureModalOpen, setSelectedFeature } = frontendFeaturesSlice.actions;

export default frontendFeaturesSlice.reducer;
