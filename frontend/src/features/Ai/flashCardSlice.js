// slices/flashCardSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  flashCards: null, // Store all flash cards
};

export const flashCardSlice = createSlice({
  name: "flashCard",
  initialState,
  reducers: {
    setFlashCards: (state, action) => {
      state.flashCards = action.payload.flashCards;
    },
    unsetFlashCards: (state) => {
      state.flashCards = null;
    },
  },
});

export const { setFlashCards, unsetFlashCards } = flashCardSlice.actions;

export default flashCardSlice.reducer;
