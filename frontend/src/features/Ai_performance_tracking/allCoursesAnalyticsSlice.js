import { createSlice } from '@reduxjs/toolkit';
import {
    allCoursesAnalyticsApi,
} from '../../services/Ai_performace_tracking/allCoursesAnalyticsApi';

const initialState = {
    moduleAnalytics: null,
    topicStrengthAnalytics: null,
    errorAnalytics: null,
    loading: false,
    error: null,
};

const allCoursesAnalyticsSlice = createSlice({
    name: 'allCoursesAnalyticsSlice',
    initialState,
    reducers: {
        resetAllAnalytics: (state) => {
            state.moduleAnalytics = null;
            state.topicStrengthAnalytics = null;
            state.errorAnalytics = null;
            state.loading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // All Courses Module Analytics
        builder.addMatcher(
            allCoursesAnalyticsApi.endpoints.getAllCoursesModuleAnalytics.matchPending,
            (state) => {
                state.loading = true;
                state.error = null;
            }
        );
        builder.addMatcher(
            allCoursesAnalyticsApi.endpoints.getAllCoursesModuleAnalytics.matchFulfilled,
            (state, action) => {
                state.moduleAnalytics = action.payload?.data || [];
                state.loading = false;
            }
        );
        builder.addMatcher(
            allCoursesAnalyticsApi.endpoints.getAllCoursesModuleAnalytics.matchRejected,
            (state, action) => {
                state.loading = false;
                state.error = action.error || 'Failed to fetch module analytics';
            }
        );

        // All Courses Topic Strength Analytics
        builder.addMatcher(
            allCoursesAnalyticsApi.endpoints.getAllCoursesTopicStrengthAnalytics.matchFulfilled,
            (state, action) => {
                state.topicStrengthAnalytics = action.payload?.data || [];
            }
        );

        // All Courses Error Analytics
        builder.addMatcher(
            allCoursesAnalyticsApi.endpoints.getAllCoursesErrorAnalyticsAverage.matchFulfilled,
            (state, action) => {
                state.errorAnalytics = action.payload?.data || [];
            }
        );
    },
});

export const { resetAllAnalytics } = allCoursesAnalyticsSlice.actions;

export default allCoursesAnalyticsSlice.reducer;
