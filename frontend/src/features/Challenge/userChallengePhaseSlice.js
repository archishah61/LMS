import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userChallengePhases: null,
  selectedPhase: null,
};

export const userChallengePhaseSlice = createSlice({
  name: "user_challenge_phase",
  initialState,
  reducers: {
    setUserChallengePhases: (state, action) => {
      state.userChallengePhases = action.payload.phases;
    },
    unsetUserChallengePhases: (state) => {
      state.userChallengePhases = null;
    },
    setSelectedPhase: (state, action) => {
      state.selectedPhase = action.payload.phase;
    },
    unsetSelectedPhase: (state) => {
      state.selectedPhase = null;
    },
  },
});

export const {
  setUserChallengePhases,
  unsetUserChallengePhases,
  setSelectedPhase,
  unsetSelectedPhase,
} = userChallengePhaseSlice.actions;

export default userChallengePhaseSlice.reducer;
