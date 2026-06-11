import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  studentFAQResponses: null,
};

export const studentFAQResponseSlice = createSlice({
  name: "studentFAQResponse_info",
  initialState,
  reducers: {
    setStudentFAQResponseInfo: (state, action) => {
      state.studentFAQResponses = action.payload.studentFAQResponses;
    },
    unsetStudentFAQResponseInfo: (state) => {
      state.studentFAQResponses = null;
    },
  },
});

export const { setStudentFAQResponseInfo, unsetStudentFAQResponseInfo } = studentFAQResponseSlice.actions;

export default studentFAQResponseSlice.reducer;
