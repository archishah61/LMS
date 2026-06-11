import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  privacyData: null,
};

export const privacyPolicySlice = createSlice({
  name: "privacyPolicy_info",
  initialState,
  reducers: {
    setPrivacyInfo: (state, action) => {
      state.privacyData = action.payload.privacyData;
    },
    unsetPrivacyInfo: (state) => {
      state.privacyData = null;
    },
  },
});

export const { setPrivacyInfo, unsetPrivacyInfo } = privacyPolicySlice.actions;
export default privacyPolicySlice.reducer;
