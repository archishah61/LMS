import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  codingActivities: null,   // Contest codings list
  selectedCoding: null,     // Single contest coding
};

export const contestCodingSlice = createSlice({
  name: "contestCoding",
  initialState,
  reducers: {
    // ✅ Set Contest Codings
    setCodingActivities: (state, action) => {
      state.codingActivities = action.payload.codingActivities;
    },
    unsetCodingActivities: (state) => {
      state.codingActivities = null;
    },

    // ✅ Set Single Contest Coding
    setSelectedCoding: (state, action) => {
      state.selectedCoding = action.payload.coding;
    },
    unsetSelectedCoding: (state) => {
      state.selectedCoding = null;
    },
  },
});

export const {
  setCodingActivities,
  unsetCodingActivities,
  setSelectedCoding,
  unsetSelectedCoding,
} = contestCodingSlice.actions;

export default contestCodingSlice.reducer;
