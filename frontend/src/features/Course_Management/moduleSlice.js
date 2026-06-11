import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  modules: null,
  activeModuleId: null,
};

export const moduleSlice = createSlice({
  name: "module_info",
  initialState,
  reducers: {
    setModuleInfo: (state, action) => {
      state.modules = action.payload.modules;
      state.activeModuleId = action.payload.activeModuleId;
    },
    unsetModuleInfo: (state, action) => {
      state.modules = action.payload.modules;
      state.activeModuleId = action.payload.activeModuleId;
    },
  },
});

export const { setModuleInfo, unsetModuleInfo } = moduleSlice.actions;

export default moduleSlice.reducer;
