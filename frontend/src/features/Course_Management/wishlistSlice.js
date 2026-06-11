import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  wishlist: null,
};

export const wishlistSlice = createSlice({
  name: "wishlist_info",
  initialState,
  reducers: {
    setWishlist: (state, action) => {
      state.wishlist = action.payload.wishlist;
    },
    unsetWishlist: (state) => {
      state.wishlist = null;
    },
  },
});

export const { setWishlist, unsetWishlist } = wishlistSlice.actions;

export default wishlistSlice.reducer;
