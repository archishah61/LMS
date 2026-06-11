import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    selectedCourse: null,
    selectedSession: null,
    selectedModule: null,
    selectedTopic: null,
};

export const importContentSlice = createSlice({
    name: "import_content",
    initialState,
    reducers: {
        setSelectedCourse: (state, action) => {
            state.selectedCourse = action.payload;

            // reset dependant fields
            state.selectedSession = null;
            state.selectedModule = null;
            state.selectedTopic = null;
        },
        setSelectedSession: (state, action) => {
            state.selectedSession = action.payload;

            state.selectedModule = null;
            state.selectedTopic = null;
        },
        setSelectedModule: (state, action) => {
            state.selectedModule = action.payload;

            state.selectedTopic = null;
        },
        setSelectedTopic: (state, action) => {
            state.selectedTopic = action.payload;
        },

        resetImportContent: (state) => {
            state.selectedCourse = null;
            state.selectedSession = null;
            state.selectedModule = null;
            state.selectedTopic = null;
        }
    },
});

export const {
    setSelectedCourse,
    setSelectedSession,
    setSelectedModule,
    setSelectedTopic,
    resetImportContent
} = importContentSlice.actions;

export default importContentSlice.reducer;
