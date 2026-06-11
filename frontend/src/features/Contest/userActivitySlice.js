import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activity: null, // store user activity info
};

export const userActivitySlice = createSlice({
  name: "user_activity",
  initialState,
  reducers: {
    setUserActivity: (state, action) => {
      state.activity = action.payload;
    },
    unsetUserActivity: (state) => {
      state.activity = null;
    },
  },
});

export const { setUserActivity, unsetUserActivity } = userActivitySlice.actions;

export default userActivitySlice.reducer;
