import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  id: "",
  email: "",
  username: "",
  picture: "",
  points: 0,
  role: "",
};

export const userSlice = createSlice({
  name: "user_info",
  initialState,
  reducers: {
    setUserInfo: (state, action) => {
      state.id = action.payload.id;
      state.email = action.payload.email;
      state.username = action.payload.username;
      state.picture = action.payload.picture;
      state.points = action.payload.points;
      state.role = action.payload.role;
    },
    unsetUserInfo: (state, action) => {
      state.id = action.payload.id;
      state.email = action.payload.email;
      state.username = action.payload.username;
      state.picture = action.payload.picture;
      state.points = action.payload.points;
      state.role = action.payload.role;
    },

  },
});

export const {
  setUserInfo,
  unsetUserInfo,
} = userSlice.actions;

export default userSlice.reducer;
