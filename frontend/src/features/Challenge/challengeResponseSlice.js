import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  challengeResponses: null,
  selectedResponse: null
};

export const challengeResponseSlice = createSlice({
  name: "challenge_response",
  initialState,
  reducers: {
    // Set all fetched challenge responses
    setChallengeResponses: (state, action) => {
      state.challengeResponses = action.payload.responses;
    },

    // Clear all responses
    unsetChallengeResponses: (state) => {
      state.challengeResponses = null;
    },

    // Set a single selected attempt/response
    setSelectedResponse: (state, action) => {
      state.selectedResponse = action.payload.response;
    },

    // Unset selected response
    unsetSelectedResponse: (state) => {
      state.selectedResponse = null;
    }
  }
});

export const {
  setChallengeResponses,
  unsetChallengeResponses,
  setSelectedResponse,
  unsetSelectedResponse
} = challengeResponseSlice.actions;

export default challengeResponseSlice.reducer;
