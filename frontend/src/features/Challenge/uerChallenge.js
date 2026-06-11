import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userChallenges: null, // Store all user challenges
  selectedUserChallenge: null, // Store a single user challenge by ID
};

export const userChallengeSlice = createSlice({
  name: "user_challenge",
  initialState,
  reducers: {
    // ✅ Set All User Challenges
    setUserChallenges: (state, action) => {
      state.userChallenges = action.payload.challenges;
    },
    // ✅ Unset All User Challenges
    unsetUserChallenges: (state) => {
      state.userChallenges = null;
    },
    // ✅ Set Single User Challenge
    setSelectedUserChallenge: (state, action) => {
      state.selectedUserChallenge = action.payload.challenge;
    },
    // ✅ Unset Single User Challenge
    unsetSelectedUserChallenge: (state) => {
      state.selectedUserChallenge = null;
    },
  },
});

export const {
  setUserChallenges,
  unsetUserChallenges,
  setSelectedUserChallenge,
  unsetSelectedUserChallenge,
} = userChallengeSlice.actions;

export default userChallengeSlice.reducer;
