import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  quests: null, // Store all quest challenges
  selectedQuest: null, // Store a single quest challenge by ID
};

export const challengeQuestSlice = createSlice({
  name: "challenge_quest",
  initialState,
  reducers: {
    // ✅ Set All Quest Challenges
    setQuestsInfo: (state, action) => {
      state.quests = action.payload.quests;
    },
    // ✅ Unset All Quest Challenges
    unsetQuestsInfo: (state) => {
      state.quests = null;
    },
    // ✅ Set Single Quest Challenge
    setSelectedQuest: (state, action) => {
      state.selectedQuest = action.payload.quest;
    },
    // ✅ Unset Single Quest Challenge
    unsetSelectedQuest: (state) => {
      state.selectedQuest = null;
    },
  },
});

export const {
  setQuestsInfo,
  unsetQuestsInfo,
  setSelectedQuest,
  unsetSelectedQuest,
} = challengeQuestSlice.actions;

export default challengeQuestSlice.reducer;