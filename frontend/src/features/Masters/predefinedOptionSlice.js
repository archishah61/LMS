import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  preDefinedOptions: null,
};

export const preDefinedOptionsSlice = createSlice({
  name: "preDefinedOptions",
  initialState,
  reducers: {
    setPreDefinedOptions: (state, action) => {
      state.preDefinedOptions = action.payload.preDefinedOptions;
    },
    unsetPreDefinedOptions: (state) => {
      state.preDefinedOptions = null;
    },
  },
});

export const { setPreDefinedOptions, unsetPreDefinedOptions } = preDefinedOptionsSlice.actions;

export default preDefinedOptionsSlice.reducer;
