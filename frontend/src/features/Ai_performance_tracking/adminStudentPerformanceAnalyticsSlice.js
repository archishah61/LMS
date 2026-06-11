import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    currentAnalytics: null,
    selectedVersion: null,
    versionComparison: null,
    topicStrengthAnalysis: null,
    moduleCompletionData: null,
    timeSpentAnalysis: null,
    errorAnalysisData: null,
    availableVersions: [],
    enrolledStudents: [],
    selectedStudent: null,
    studentEnrollments: [],
    selectedCourseId: null,
    modules: [],
    selectedModuleId: null,
    topics: [],
    selectedTopicId: null,
    isFilterOpen: false,
};

export const adminStudentPerformanceAnalyticsSlice = createSlice({
    name: "adminStudentPerformanceAnalytics",
    initialState,
    reducers: {
        setCurrentAnalytics: (state, action) => {
            state.currentAnalytics = action.payload;
        },
        setSelectedVersion: (state, action) => {
            state.selectedVersion = action.payload;
        },
        setVersionComparison: (state, action) => {
            state.versionComparison = action.payload;
        },
        setTopicStrengthAnalysis: (state, action) => {
            state.topicStrengthAnalysis = action.payload;
        },
        setModuleCompletionData: (state, action) => {
            state.moduleCompletionData = action.payload;
        },
        setTimeSpentAnalysis: (state, action) => {
            state.timeSpentAnalysis = action.payload;
        },
        setAvailableVersions: (state, action) => {
            state.availableVersions = action.payload;
        },
        setEnrolledStudents: (state, action) => {
            state.enrolledStudents = action.payload;
        },
        setSelectedStudent: (state, action) => {
            state.selectedStudent = action.payload;
        },
        setStudentEnrollments: (state, action) => {
            state.studentEnrollments = action.payload;
        },
        setSelectedCourseId: (state, action) => {
            state.selectedCourseId = action.payload;
            // Reset dependent filters when course changes
            state.selectedModuleId = null;
            state.selectedTopicId = null;
            state.topics = [];
        },
        setModules: (state, action) => {
            state.modules = action.payload;
        },
        setSelectedModuleId: (state, action) => {
            state.selectedModuleId = action.payload;
            // Reset topic filter when module changes
            state.selectedTopicId = null;
        },
        setTopics: (state, action) => {
            state.topics = action.payload;
        },
        setSelectedTopicId: (state, action) => {
            state.selectedTopicId = action.payload;
        },
        toggleFilterPanel: (state) => {
            state.isFilterOpen = !state.isFilterOpen;
        },
        resetAnalytics: (state) => {
            state.currentAnalytics = null;
            state.selectedVersion = null;
            state.versionComparison = null;
            state.topicStrengthAnalysis = null;
            state.moduleCompletionData = null;
            state.timeSpentAnalysis = null;
            state.availableVersions = [];
            state.selectedStudent = null;
            state.studentEnrollments = [];
            state.selectedCourseId = null;
            state.modules = [];
            state.selectedModuleId = null;
            state.topics = [];
            state.selectedTopicId = null;
            state.isFilterOpen = false;
        },
        setErrorAnalysisData: (state, action) => {
            state.errorAnalysisData = action.payload;
        },
    },
});

export const { 
    setCurrentAnalytics, 
    setSelectedVersion, 
    setVersionComparison,
    setTopicStrengthAnalysis,
    setModuleCompletionData,
    setTimeSpentAnalysis,
    setErrorAnalysisData,
    setAvailableVersions,
    setEnrolledStudents,
    setSelectedStudent,
    setStudentEnrollments,
    setSelectedCourseId,
    setModules,
    setSelectedModuleId,
    setTopics,
    setSelectedTopicId,
    toggleFilterPanel,
    resetAnalytics
} = adminStudentPerformanceAnalyticsSlice.actions;

export default adminStudentPerformanceAnalyticsSlice.reducer;
