import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  challengeCategories: null, // Store all challenge categories
  selectedChallengeCategory: null, // Store a single challenge category by ID
};

export const challengeCategorySlice = createSlice({
  name: "challengeCategory",
  initialState,
  reducers: {
    // ✅ Set All Challenge Categories
    setChallengeCategories: (state, action) => {
      state.challengeCategories = action.payload.categories;
    },
    // ✅ Unset All Challenge Categories
    unsetChallengeCategories: (state) => {
      state.challengeCategories = null;
    },
    // ✅ Set Single Challenge Category
    setSelectedChallengeCategory: (state, action) => {
      state.selectedChallengeCategory = action.payload.category;
    },
    // ✅ Unset Single Challenge Category
    unsetSelectedChallengeCategory: (state) => {
      state.selectedChallengeCategory = null;
    },
  },
});

export const {
  setChallengeCategories,
  unsetChallengeCategories,
  setSelectedChallengeCategory,
  unsetSelectedChallengeCategory,
} = challengeCategorySlice.actions;

export default challengeCategorySlice.reducer;
