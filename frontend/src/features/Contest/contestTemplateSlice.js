import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  templates: null,       // All contest templates
  activeTemplates: null, // Active templates
  selectedTemplate: null // Single template by ID
};

export const contestTemplateSlice = createSlice({
  name: "contest_template",
  initialState,
  reducers: {
    // ✅ Set All Templates
    setTemplatesInfo: (state, action) => {
      state.templates = action.payload.templates;
    },
    unsetTemplatesInfo: (state) => {
      state.templates = null;
    },

    // ✅ Set Active Templates
    setActiveTemplates: (state, action) => {
      state.activeTemplates = action.payload.activeTemplates;
    },
    unsetActiveTemplates: (state) => {
      state.activeTemplates = null;
    },

    // ✅ Set Single Template
    setSelectedTemplate: (state, action) => {
      state.selectedTemplate = action.payload.template;
    },
    unsetSelectedTemplate: (state) => {
      state.selectedTemplate = null;
    },
  },
});

export const {
  setTemplatesInfo,
  unsetTemplatesInfo,
  setActiveTemplates,
  unsetActiveTemplates,
  setSelectedTemplate,
  unsetSelectedTemplate,
} = contestTemplateSlice.actions;

export default contestTemplateSlice.reducer;
