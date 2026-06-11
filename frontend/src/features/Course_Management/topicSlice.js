import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  topics: null,
  activeTopicId: null,
};

export const topicSlice = createSlice({
  name: "topic_info",
  initialState,
  reducers: {
    setTopicInfo: (state, action) => {
      state.topics = action.payload.topics;
      state.activeTopicId = action.payload.activeTopicId;
    },
    unsetTopicInfo: (state, action) => {
      state.topics =  action.payload.topics;
      state.activeTopicId =  action.payload.activeTopicId;
    },
  },
});

export const { setTopicInfo, unsetTopicInfo } = topicSlice.actions;

export default topicSlice.reducer;
