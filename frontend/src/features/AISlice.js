import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  expression: null,     // The extracted math expression
  result: null,         // The evaluated result
  isLoading: false,     // Flag for loading state
  error: null,          // Any error from the solving process
};

export const aiSlice = createSlice({
  name: "ai",
  initialState,
  reducers: {
    // ✅ Start solving (loading state)
    solveImageStart: (state) => {
      state.isLoading = true;
      state.error = null;
      state.result = null;
      state.expression = null;
    },
    // ✅ Successful result
    solveImageSuccess: (state, action) => {
      state.isLoading = false;
      state.result = action.payload.result;
      state.expression = action.payload.expression;
      state.error = null;
    },
    // ✅ Error during solving
    solveImageFailure: (state, action) => {
      state.isLoading = false;
      state.result = null;
      state.expression = null;
      state.error = action.payload;
    },
    // ✅ Clear result
    clearMathResult: (state) => {
      state.result = null;
      state.expression = null;
      state.error = null;
      state.isLoading = false;
    },
  },
});

export const {
  solveImageStart,
  solveImageSuccess,
  solveImageFailure,
  clearMathResult,
} = aiSlice.actions;

export default aiSlice.reducer;
