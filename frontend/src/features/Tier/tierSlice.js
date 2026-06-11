import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  tiers: null, // Store all tiers
  selectedTier: null, // Store a single tier by ID
};

export const tierSlice = createSlice({
  name: "tier",
  initialState,
  reducers: {
    // ✅ Set All Tiers
    setTiers: (state, action) => {
      state.tiers = action.payload.tiers;
    },
    // ✅ Unset All Tiers
    unsetTiers: (state) => {
      state.tiers = null;
    },
    // ✅ Set Single Tier
    setSelectedTier: (state, action) => {
      state.selectedTier = action.payload.tier;
    },
    // ✅ Unset Single Tier
    unsetSelectedTier: (state) => {
      state.selectedTier = null;
    },
  },
});

export const {
  setTiers,
  unsetTiers,
  setSelectedTier,
  unsetSelectedTier,
} = tierSlice.actions;

export default tierSlice.reducer;
