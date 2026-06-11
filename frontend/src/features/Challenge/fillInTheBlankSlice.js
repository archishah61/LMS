import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  fillInTheBlanksChallenges: null, // Store all Fill in the Blanks challenges
  selectedFillInTheBlanksChallenge: null, // Store a single Fill in the Blanks challenge by ID
};

export const fillInTheBlanksSlice = createSlice({
  name: "fill_in_the_blanks",
  initialState,
  reducers: {
    // ✅ Set All Fill in the Blanks Challenges
    setFillInTheBlanksChallenges: (state, action) => {
      state.fillInTheBlanksChallenges = action.payload.challenges;
    },
    // ✅ Unset All Fill in the Blanks Challenges
    unsetFillInTheBlanksChallenges: (state) => {
      state.fillInTheBlanksChallenges = null;
    },
    // ✅ Set Single Fill in the Blanks Challenge
    setSelectedFillInTheBlanksChallenge: (state, action) => {
      state.selectedFillInTheBlanksChallenge = action.payload.challenge;
    },
    // ✅ Unset Single Fill in the Blanks Challenge
    unsetSelectedFillInTheBlanksChallenge: (state) => {
      state.selectedFillInTheBlanksChallenge = null;
    },
  },
});

export const {
  setFillInTheBlanksChallenges,
  unsetFillInTheBlanksChallenges,
  setSelectedFillInTheBlanksChallenge,
  unsetSelectedFillInTheBlanksChallenge,
} = fillInTheBlanksSlice.actions;

export default fillInTheBlanksSlice.reducer;
