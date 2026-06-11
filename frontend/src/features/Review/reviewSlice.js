import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  reviews: null,
};

export const reviewSlice = createSlice({
  name: "review_info",
  initialState,
  reducers: {
    setReviews: (state, action) => {
      state.reviews = action.payload.reviews;
    },
    unsetReviews: (state) => {
      state.reviews = null;
    },
  },
});

export const { setReviews, unsetReviews } = reviewSlice.actions;

export default reviewSlice.reducer;
