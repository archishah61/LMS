import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  prizes: null, // All prizes for a contest
};

export const contestPrizeSlice = createSlice({
  name: "contest_prize",
  initialState,
  reducers: {
    // ✅ Set All Prizes
    setPrizesInfo: (state, action) => {
      state.prizes = action.payload.prizes;
    },
    unsetPrizesInfo: (state) => {
      state.prizes = null;
    },
  },
});

export const { setPrizesInfo, unsetPrizesInfo } = contestPrizeSlice.actions;

export default contestPrizeSlice.reducer;
