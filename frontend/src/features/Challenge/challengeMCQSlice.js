import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  mcqChallenges: null, // Store all MCQ challenges
  selectedMCQChallenge: null, // Store a single MCQ challenge by ID
};

export const mcqChallengeSlice = createSlice({
  name: "mcq_challenge",
  initialState,
  reducers: {
    // ✅ Set All MCQ Challenges
    setMCQChallenges: (state, action) => {
      state.mcqChallenges = action.payload.challenges;
    },
    // ✅ Unset All MCQ Challenges
    unsetMCQChallenges: (state) => {
      state.mcqChallenges = null;
    },
    // ✅ Set Single MCQ Challenge
    setSelectedMCQChallenge: (state, action) => {
      state.selectedMCQChallenge = action.payload.challenge;
    },
    // ✅ Unset Single MCQ Challenge
    unsetSelectedMCQChallenge: (state) => {
      state.selectedMCQChallenge = null;
    },
  },
});

export const {
  setMCQChallenges,
  unsetMCQChallenges,
  setSelectedMCQChallenge,
  unsetSelectedMCQChallenge,
} = mcqChallengeSlice.actions;

export default mcqChallengeSlice.reducer;
