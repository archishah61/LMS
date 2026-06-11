import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  assignments: null,
};

export const assignmentSlice = createSlice({
  name: "assignment_info",
  initialState,
  reducers: {
    setAssignmentInfo: (state, action) => {
      state.assignments = action.payload.assignments;
    },
    unsetAssignmentInfo: (state, action) => {
      state.assignments = action.payload.assignments;
    },
  },
});

export const { setAssignmentInfo, unsetAssignmentInfo } = assignmentSlice.actions;

export default assignmentSlice.reducer;
