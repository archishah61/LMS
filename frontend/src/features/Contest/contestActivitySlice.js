import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activities: null,       // All activities for a contest
  selectedActivity: null, // Single activity by ID
};

export const contestActivitySlice = createSlice({
  name: "contest_activity",
  initialState,
  reducers: {
    // ✅ Set All Activities
    setActivitiesInfo: (state, action) => {
      state.activities = action.payload.activities;
    },
    unsetActivitiesInfo: (state) => {
      state.activities = null;
    },

    // ✅ Set Single Activity
    setSelectedActivity: (state, action) => {
      state.selectedActivity = action.payload.activity;
    },
    unsetSelectedActivity: (state) => {
      state.selectedActivity = null;
    },
  },
});

export const {
  setActivitiesInfo,
  unsetActivitiesInfo,
  setSelectedActivity,
  unsetSelectedActivity,
} = contestActivitySlice.actions;

export default contestActivitySlice.reducer;
