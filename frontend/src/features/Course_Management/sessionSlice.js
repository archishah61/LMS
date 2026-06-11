import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  sessions: null,
  activeSessionId: null,
};

export const sessionSlice = createSlice({
  name: "session_info",
  initialState,
  reducers: {
    setSessionInfo: (state, action) => {
      state.sessions = action.payload.sessions;
      state.activeSessionId = action.payload.activeSessionId;
    },
    unsetSessionInfo: (state, action) => {
      state.sessions = action.payload.sessions;
      state.activeSessionId = action.payload.activeSessionId;
    },
  },
});

export const { setSessionInfo, unsetSessionInfo } = sessionSlice.actions;

export default sessionSlice.reducer;
