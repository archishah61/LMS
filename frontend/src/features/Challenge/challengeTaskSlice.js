import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  tasks: null,          // Store all tasks
  selectedTask: null,   // Store a single task by ID
  phaseTasks: null      // Store tasks by phase ID
};

export const challengeTaskSlice = createSlice({
  name: "challenge_task",
  initialState,
  reducers: {
    // ✅ Set All Tasks
    setTasksInfo: (state, action) => {
      state.tasks = action.payload.tasks;
    },
    
    // ✅ Unset All Tasks
    unsetTasksInfo: (state) => {
      state.tasks = null;
    },
    
    // ✅ Set Single Task
    setSelectedTask: (state, action) => {
      state.selectedTask = action.payload.task;
    },
    
    // ✅ Unset Single Task
    unsetSelectedTask: (state) => {
      state.selectedTask = null;
    },
    
    // ✅ Set Tasks by Phase ID
    setPhaseTasks: (state, action) => {
      state.phaseTasks = action.payload.tasks;
    },
    
    // ✅ Unset Tasks by Phase ID
    unsetPhaseTasks: (state) => {
      state.phaseTasks = null;
    }
  },
});

export const {
  setTasksInfo,
  unsetTasksInfo,
  setSelectedTask,
  unsetSelectedTask,
  setPhaseTasks,
  unsetPhaseTasks
} = challengeTaskSlice.actions;

export default challengeTaskSlice.reducer;