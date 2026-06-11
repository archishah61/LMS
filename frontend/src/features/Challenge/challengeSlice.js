import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  challenges: null, // Store all challenges
  selectedChallenge: null, // Store a single challenge by ID
};

export const dailyChallengeSlice = createSlice({
  name: "daily_challenge",
  initialState,
  reducers: {
    // ✅ Set All Challenges
    setChallengesInfo: (state, action) => {
      state.challenges = action.payload.challenges;
    },
    // ✅ Unset All Challenges
    unsetChallengesInfo: (state) => {
      state.challenges = null;
    },
    // ✅ Set Single Challenge
    setSelectedChallenge: (state, action) => {
      state.selectedChallenge = action.payload.challenge;
    },
    // ✅ Unset Single Challenge
    unsetSelectedChallenge: (state) => {
      state.selectedChallenge = null;
    },
  },
});

export const {
  setChallengesInfo,
  unsetChallengesInfo,
  setSelectedChallenge,
  unsetSelectedChallenge,
} = dailyChallengeSlice.actions;

export default dailyChallengeSlice.reducer;
