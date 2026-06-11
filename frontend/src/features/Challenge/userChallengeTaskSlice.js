import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userChallengeTasks: null,
  selectedTask: null,
};

export const userChallengeTaskSlice = createSlice({
  name: "user_challenge_task",
  initialState,
  reducers: {
    setUserChallengeTasks: (state, action) => {
      state.userChallengeTasks = action.payload.tasks;
    },
    unsetUserChallengeTasks: (state) => {
      state.userChallengeTasks = null;
    },
    setSelectedTask: (state, action) => {
      state.selectedTask = action.payload.task;
    },
    unsetSelectedTask: (state) => {
      state.selectedTask = null;
    },
  },
});

export const {
  setUserChallengeTasks,
  unsetUserChallengeTasks,
  setSelectedTask,
  unsetSelectedTask,
} = userChallengeTaskSlice.actions;

export default userChallengeTaskSlice.reducer;
