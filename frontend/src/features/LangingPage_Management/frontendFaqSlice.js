import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    isFaqModalOpen: false,
    selectedFaq: null,
};

const frontendFaqSlice = createSlice({
    name: "frontendFaq",
    initialState,
    reducers: {
        setFaqModalOpen: (state, action) => {
            state.isFaqModalOpen = action.payload;
        },
        setSelectedFaq: (state, action) => {
            state.selectedFaq = action.payload;
        },
    },
});

export const { setFaqModalOpen, setSelectedFaq } = frontendFaqSlice.actions;

export default frontendFaqSlice.reducer;
