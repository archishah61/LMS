import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  options: null, // Store all best option question options
};

export const bestOptionQuestionSlice = createSlice({
  name: "best_option_question",
  initialState,
  reducers: {
    setBestOptionQuestionInfo: (state, action) => {
      state.options = action.payload.options;
    },
    unsetBestOptionQuestionInfo: (state) => {
      state.options = null;
    },
  },
});

export const { setBestOptionQuestionInfo, unsetBestOptionQuestionInfo } = bestOptionQuestionSlice.actions;

export default bestOptionQuestionSlice.reducer;
