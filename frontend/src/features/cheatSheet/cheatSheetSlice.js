import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    cheatSheets: null,
};

export const cheatSheetSlice = createSlice({
    name: "cheatSheet_info",
    initialState,
    reducers: {
        setCheatSheetInfo: (state, action) => {
            state.cheatSheets = action.payload.cheatSheets;
        },
        unsetCheatSheetInfo: (state, action) => {
            state.cheatSheets = action.payload.cheatSheets;
        },
    },
});

export const { setCheatSheetInfo, unsetCheatSheetInfo } = cheatSheetSlice.actions;

export default cheatSheetSlice.reducer;
