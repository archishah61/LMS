import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  trueFalseChallenges: null, // Store all True/False challenges
  selectedTrueFalseChallenge: null, // Store a single True/False challenge by ID
};

export const trueFalseChallengeSlice = createSlice({
  name: "true_false_challenge",
  initialState,
  reducers: {
    // ✅ Set All True/False Challenges
    setTrueFalseChallenges: (state, action) => {
      state.trueFalseChallenges = action.payload.challenges;
    },
    // ✅ Unset All True/False Challenges
    unsetTrueFalseChallenges: (state) => {
      state.trueFalseChallenges = null;
    },
    // ✅ Set Single True/False Challenge
    setSelectedTrueFalseChallenge: (state, action) => {
      state.selectedTrueFalseChallenge = action.payload.challenge;
    },
    // ✅ Unset Single True/False Challenge
    unsetSelectedTrueFalseChallenge: (state) => {
      state.selectedTrueFalseChallenge = null;
    },
  },
});

export const {
  setTrueFalseChallenges,
  unsetTrueFalseChallenges,
  setSelectedTrueFalseChallenge,
  unsetSelectedTrueFalseChallenge,
} = trueFalseChallengeSlice.actions;

export default trueFalseChallengeSlice.reducer;