import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  partners: null, // Stores all individual partners
};

export const partnerIndividualSlice = createSlice({
  name: "partner_individual",
  initialState,
  reducers: {
    setPartnerIndividualInfo: (state, action) => {
      state.partners = action.payload.partners;
    },
    unsetPartnerIndividualInfo: (state) => {
      state.partners = null;
    },
  },
});

export const { setPartnerIndividualInfo, unsetPartnerIndividualInfo } =
  partnerIndividualSlice.actions;

export default partnerIndividualSlice.reducer;
