import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  faqs: null,
};

export const courseFAQSlice = createSlice({
  name: "courseFAQ",
  initialState,
  reducers: {
    setFAQs: (state, action) => {
      state.faqs = action.payload.faqs;
    },
    unsetFAQs: (state) => {
      state.faqs = null;
    },
  },
});

export const { setFAQs, unsetFAQs } = courseFAQSlice.actions;
export default courseFAQSlice.reducer;
