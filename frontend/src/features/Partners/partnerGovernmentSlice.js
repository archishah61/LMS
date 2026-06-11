import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  partners: null, // Stores all government partners
};

export const partnerGovernmentSlice = createSlice({
  name: "partner_government",
  initialState,
  reducers: {
    setPartnerGovernmentInfo: (state, action) => {
      state.partners = action.payload.partners;
    },
    unsetPartnerGovernmentInfo: (state) => {
      state.partners = null;
    },
  },
});

export const { setPartnerGovernmentInfo, unsetPartnerGovernmentInfo } =
  partnerGovernmentSlice.actions;

export default partnerGovernmentSlice.reducer;
