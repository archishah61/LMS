// slices/bulletPointSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  bulletPoints: null, // Store all bullet points
};

export const bulletPointSlice = createSlice({
  name: "bulletPoint",
  initialState,
  reducers: {
    setBulletPoints: (state, action) => {
      state.bulletPoints = action.payload.bulletPoints;
    },
    unsetBulletPoints: (state) => {
      state.bulletPoints = null;
    },
  },
});

export const { setBulletPoints, unsetBulletPoints } = bulletPointSlice.actions;

export default bulletPointSlice.reducer;
