import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  phases: null, // Store all challenge phases
  selectedPhase: null, // Store a single phase by ID
  challengePhases: null, // Store phases by challenge ID
};

export const challengePhaseSlice = createSlice({
  name: "challenge_phase",
  initialState,
  reducers: {
    // ✅ Set All Challenge Phases
    setPhasesInfo: (state, action) => {
      state.phases = action.payload.phases;
    },
    // ✅ Unset All Challenge Phases
    unsetPhasesInfo: (state) => {
      state.phases = null;
    },
    // ✅ Set Single Challenge Phase
    setSelectedPhase: (state, action) => {
      state.selectedPhase = action.payload.phase;
    },
    // ✅ Unset Single Challenge Phase
    unsetSelectedPhase: (state) => {
      state.selectedPhase = null;
    },
    // ✅ Set Phases by Challenge ID
    setChallengePhases: (state, action) => {
      state.challengePhases = action.payload.phases;
    },
    // ✅ Unset Phases by Challenge ID
    unsetChallengePhases: (state) => {
      state.challengePhases = null;
    },
  },
});

export const {
  setPhasesInfo,
  unsetPhasesInfo,
  setSelectedPhase,
  unsetSelectedPhase,
  setChallengePhases,
  unsetChallengePhases,
} = challengePhaseSlice.actions;

export default challengePhaseSlice.reducer;