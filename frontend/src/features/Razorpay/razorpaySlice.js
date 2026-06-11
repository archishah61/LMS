import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  order: null,           // Stores the created order info
  captureResult: null,   // Stores the captured order result
};

export const razorpaySlice = createSlice({
  name: "razorpay",
  initialState,
  reducers: {
    setCreatedOrder: (state, action) => {
      state.order = action.payload;
    },
    unsetCreatedOrder: (state) => {
      state.order = null;
    },
    setCapturedOrder: (state, action) => {
      state.captureResult = action.payload;
    },
    unsetCapturedOrder: (state) => {
      state.captureResult = null;
    },
  },
});

export const {
  setCreatedOrder,
  unsetCreatedOrder,
  setCapturedOrder,
  unsetCapturedOrder,
} = razorpaySlice.actions;

export default razorpaySlice.reducer;
