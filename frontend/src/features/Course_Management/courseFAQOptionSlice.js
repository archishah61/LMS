import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  faqOptions: null,
};

export const courseFAQOptionSlice = createSlice({
  name: "courseFAQOption",
  initialState,
  reducers: {
    setFAQOptions: (state, action) => {
      state.faqOptions = action.payload.faqOptions;
    },
    unsetFAQOptions: (state) => {
      state.faqOptions = null;
    },
  },
});

export const { setFAQOptions, unsetFAQOptions } = courseFAQOptionSlice.actions;
export default courseFAQOptionSlice.reducer;
