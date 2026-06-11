import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  topicContent: null,
};

export const topicContentSlice = createSlice({
  name: "topicContent",
  initialState,
  reducers: {
    setTopicContent: (state, action) => {
      state.topicContent = action.payload.topicContent;
    },
    unsetTopicContent: (state) => {
      state.topicContent = null;
    },
  },
});

export const { setTopicContent, unsetTopicContent } = topicContentSlice.actions;

export default topicContentSlice.reducer;
