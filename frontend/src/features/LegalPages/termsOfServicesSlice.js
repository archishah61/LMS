import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  termsData: null,
};

export const termsOfServiceSlice = createSlice({
  name: "termsOfService_info",
  initialState,
  reducers: {
    setTermsInfo: (state, action) => {
      state.termsData = action.payload.termsData;
    },
    unsetTermsInfo: (state) => {
      state.termsData = null;
    },
  },
});

export const { setTermsInfo, unsetTermsInfo } = termsOfServiceSlice.actions;
export default termsOfServiceSlice.reducer;
