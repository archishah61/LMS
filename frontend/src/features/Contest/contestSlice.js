import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  contests: null,        // All contests
  activeContests: null,  // Active contests
  selectedContest: null, // Contest by ID
};

export const contestSlice = createSlice({
  name: "contest",
  initialState,
  reducers: {
    // ✅ Set All Contests
    setContestsInfo: (state, action) => {
      state.contests = action.payload.contests;
    },
    unsetContestsInfo: (state) => {
      state.contests = null;
    },

    // ✅ Set Active Contests
    setActiveContests: (state, action) => {
      state.activeContests = action.payload.activeContests;
    },
    unsetActiveContests: (state) => {
      state.activeContests = null;
    },

    // ✅ Set Single Contest
    setSelectedContest: (state, action) => {
      state.selectedContest = action.payload.contest;
    },
    unsetSelectedContest: (state) => {
      state.selectedContest = null;
    },
  },
});

export const {
  setContestsInfo,
  unsetContestsInfo,
  setActiveContests,
  unsetActiveContests,
  setSelectedContest,
  unsetSelectedContest,
} = contestSlice.actions;

export default contestSlice.reducer;
