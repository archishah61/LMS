import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  states: null, // Store all states
  selectedState: null, // Store a single state by ID
};

export const stateSlice = createSlice({
  name: "states",
  initialState,
  reducers: {
    // ✅ Set All States
    setStates: (state, action) => {
      state.states = action.payload.states;
    },
    // ✅ Unset All States
    unsetStates: (state) => {
      state.states = null;
    },
    // ✅ Set Single State
    setSelectedState: (state, action) => {
      state.selectedState = action.payload.state;
    },
    // ✅ Unset Single State
    unsetSelectedState: (state) => {
      state.selectedState = null;
    },
  },
});

export const {
  setStates,
  unsetStates,
  setSelectedState,
  unsetSelectedState,
} = stateSlice.actions;

export default stateSlice.reducer;