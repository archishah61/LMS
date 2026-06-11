import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userChallengeQuests: null,
  selectedUserChallengeQuest: null,
};

export const userChallengeQuestSlice = createSlice({
  name: "user_challenge_quest",
  initialState,
  reducers: {
    // ✅ Set All User Challenge Quests
    setUserChallengeQuests: (state, action) => {
      state.userChallengeQuests = action.payload.userChallenges;
    },
    // ✅ Unset All
    unsetUserChallengeQuests: (state) => {
      state.userChallengeQuests = null;
    },
    // ✅ Set One User Challenge Quest
    setSelectedUserChallengeQuest: (state, action) => {
      state.selectedUserChallengeQuest = action.payload.userChallenge;
    },
    // ✅ Unset
    unsetSelectedUserChallengeQuest: (state) => {
      state.selectedUserChallengeQuest = null;
    },
  },
});

export const {
  setUserChallengeQuests,
  unsetUserChallengeQuests,
  setSelectedUserChallengeQuest,
  unsetSelectedUserChallengeQuest,
} = userChallengeQuestSlice.actions;

export default userChallengeQuestSlice.reducer;
