import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    sections: null,
};

export const sectionSlice = createSlice({
    name: "section_info",
    initialState,
    reducers: {
        setSectionInfo: (state, action) => {
            state.sections = action.payload.sections;
        },
        unsetSectionInfo: (state, action) => {
            state.sections = action.payload.sections;
        },
    },
});

export const { setSectionInfo, unsetSectionInfo } = sectionSlice.actions;

export default sectionSlice.reducer;
