import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  responses: [], // Store all responses
  loading: false, // Track loading state
  error: null, // Track error state
};

export const bestOptionResponseSlice = createSlice({
  name: "best_option_response",
  initialState,
  reducers: {
    setBestOptionResponses: (state, action) => {
      state.responses = action.payload.responses;
    },
    setBestOptionResponseError: (state, action) => {
      state.error = action.payload.error;
    },
    setLoading: (state, action) => {
      state.loading = action.payload.loading;
    },
  },
});

export const { setBestOptionResponses, setBestOptionResponseError, setLoading } = bestOptionResponseSlice.actions;

export default bestOptionResponseSlice.reducer;
