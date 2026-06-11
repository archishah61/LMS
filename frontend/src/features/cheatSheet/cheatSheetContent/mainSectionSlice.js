import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    mainSections: null,
};

export const mainSectionSlice = createSlice({
    name: "mainSection_info",
    initialState,
    reducers: {
        setMainSectionInfo: (state, action) => {
            state.mainSections = action.payload.mainSections;
        },
        unsetMainSectionInfo: (state, action) => {
            state.mainSections = action.payload.mainSections;
        },
    },
});

export const { setMainSectionInfo, unsetMainSectionInfo } = mainSectionSlice.actions;

export default mainSectionSlice.reducer;
