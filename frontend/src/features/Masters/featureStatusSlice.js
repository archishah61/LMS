import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    featureStatus: null,     // true / false
    currentFeatureName: null // which feature you're viewing
};

export const featureStatusSlice = createSlice({
    name: "feature_status",
    initialState,
    reducers: {
        setFeatureStatusInfo: (state, action) => {
            if (action.payload.featureStatus !== undefined) {
                state.featureStatus = action.payload.featureStatus;
            }
            if (action.payload.currentFeatureName !== undefined) {
                state.currentFeatureName = action.payload.currentFeatureName;
            }
        },
        unsetFeatureStatusInfo: (state, action) => {
            if (action.payload.featureStatus !== undefined) {
                state.featureStatus = null;
            }
            if (action.payload.currentFeatureName !== undefined) {
                state.currentFeatureName = null;
            }
        },
    },
});

export const {
    setFeatureStatusInfo,
    unsetFeatureStatusInfo
} = featureStatusSlice.actions;

export default featureStatusSlice.reducer;
