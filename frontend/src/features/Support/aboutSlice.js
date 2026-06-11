import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  aboutEntries: null,
};

export const aboutSlice = createSlice({
  name: "about_info",
  initialState,
  reducers: {
    setAboutEntries: (state, action) => {
      state.aboutEntries = action.payload.aboutEntries;
    },
    unsetAboutEntries: (state) => {
      state.aboutEntries = null;
    },
  },
});

export const { setAboutEntries, unsetAboutEntries } = aboutSlice.actions;

export default aboutSlice.reducer;
