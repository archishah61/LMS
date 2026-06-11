import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  realWordResponses: [],      // All responses
  selectedResponse: null,     // One selected response (for view/edit)
};

export const realWordResponseSlice = createSlice({
  name: "realWordResponse",
  initialState,
  reducers: {
    setRealWordResponses: (state, action) => {
      state.realWordResponses = action.payload;
    },
    addRealWordResponse: (state, action) => {
      state.realWordResponses.push(action.payload);
    },
    updateRealWordResponse: (state, action) => {
      const index = state.realWordResponses.findIndex(
        (res) => res.id === action.payload.id
      );
      if (index !== -1) {
        state.realWordResponses[index] = action.payload;
      }
    },
    deleteRealWordResponse: (state, action) => {
      state.realWordResponses = state.realWordResponses.filter(
        (res) => res.id !== action.payload.id
      );
    },
    setSelectedRealWordResponse: (state, action) => {
      state.selectedResponse = action.payload;
    },
    clearSelectedRealWordResponse: (state) => {
      state.selectedResponse = null;
    },
  },
});

export const {
  setRealWordResponses,
  addRealWordResponse,
  updateRealWordResponse,
  deleteRealWordResponse,
  setSelectedRealWordResponse,
  clearSelectedRealWordResponse,
} = realWordResponseSlice.actions;

export default realWordResponseSlice.reducer;
