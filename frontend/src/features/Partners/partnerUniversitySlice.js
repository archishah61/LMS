import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  partners: null, // Stores all university partners
};

export const partnerUniversitySlice = createSlice({
  name: "partner_university",
  initialState,
  reducers: {
    setPartnerUniversityInfo: (state, action) => {
      state.partners = action.payload.partners;
    },
    unsetPartnerUniversityInfo: (state) => {
      state.partners = null;
    },
  },
});

export const { setPartnerUniversityInfo, unsetPartnerUniversityInfo } =
  partnerUniversitySlice.actions;

export default partnerUniversitySlice.reducer;
