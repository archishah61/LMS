import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  partners: null, // Stores all business partners
};

export const partnerBusinessSlice = createSlice({
  name: "partner_business",
  initialState,
  reducers: {
    setPartnerBusinessInfo: (state, action) => {
      state.partners = action.payload.partners;
    },
    unsetPartnerBusinessInfo: (state) => {
      state.partners = null;
    },
  },
});

export const { setPartnerBusinessInfo, unsetPartnerBusinessInfo } =
  partnerBusinessSlice.actions;

export default partnerBusinessSlice.reducer;
