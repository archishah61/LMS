import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  testCases: null,        // All test cases for coding
  selectedTestCase: null, // Single test case
};

export const contestCodingTestCaseSlice = createSlice({
  name: "contestCodingTestCase",
  initialState,
  reducers: {
    // ✅ Set Test Cases
    setTestCases: (state, action) => {
      state.testCases = action.payload.testCases;
    },
    unsetTestCases: (state) => {
      state.testCases = null;
    },

    // ✅ Set Single Test Case
    setSelectedTestCase: (state, action) => {
      state.selectedTestCase = action.payload.testCase;
    },
    unsetSelectedTestCase: (state) => {
      state.selectedTestCase = null;
    },
  },
});

export const {
  setTestCases,
  unsetTestCases,
  setSelectedTestCase,
  unsetSelectedTestCase,
} = contestCodingTestCaseSlice.actions;

export default contestCodingTestCaseSlice.reducer;
