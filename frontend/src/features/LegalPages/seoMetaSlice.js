import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    seoMeta: null,
    selectedSeoMeta: null,
};

export const seoMetaSlice = createSlice({
    name: "seoMeta",
    initialState,
    reducers: {

        // ✅ Set All SEO Meta
        setSeoMeta: (state, action) => {
            state.seoMeta = action.payload.seoMeta;
        },

        // ✅ Unset All SEO Meta
        unsetSeoMeta: (state) => {
            state.seoMeta = null;
        },

        // ✅ Set Selected SEO Meta
        setSelectedSeoMeta: (state, action) => {
            state.selectedSeoMeta = action.payload.seoMeta;
        },

        // ✅ Unset Selected SEO Meta
        unsetSelectedSeoMeta: (state) => {
            state.selectedSeoMeta = null;
        },
    },
});

export const {
    setSeoMeta,
    unsetSeoMeta,
    setSelectedSeoMeta,
    unsetSelectedSeoMeta
} = seoMetaSlice.actions;

export default seoMetaSlice.reducer;
