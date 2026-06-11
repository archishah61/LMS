import { createSlice } from '@reduxjs/toolkit';
import { newProgressTrackingApi } from '../../services/progressTracking/newProgressTrackingApi';

const initialState = {
    currentSession: null,
    currentModule: null,
    currentTopic: null,
    accessibleData: {
        sessions: [],
        modules: [],
        topics: [],
        quizzes: [],
        assignments: []
    },
    loading: false,
    error: null
};

const progressTrackingSlice = createSlice({
    name: 'progressTracking',
    initialState,
    reducers: {
        setCurrentSession: (state, action) => {
            state.currentSession = action.payload;
        },
        setCurrentModule: (state, action) => {
            state.currentModule = action.payload;
        },
        setCurrentTopic: (state, action) => {
            state.currentTopic = action.payload;
        },
        clearProgressState: (state) => {
            state.currentSession = null;
            state.currentModule = null;
            state.currentTopic = null;
            state.accessibleData = {
                sessions: [],
                modules: [],
                topics: [],
                quizzes: [],
                assignments: []
            };
        }
    },
    extraReducers: (builder) => {
        // Handle sessions data
        builder.addMatcher(
            newProgressTrackingApi.endpoints.getAccessibleSessions.matchFulfilled,
            (state, { payload }) => {
                state.accessibleData.sessions = payload.sessions;
            }
        );

        // Handle modules data
        builder.addMatcher(
            newProgressTrackingApi.endpoints.getAccessibleModules.matchFulfilled,
            (state, { payload }) => {
                state.accessibleData.modules = payload.modules;
            }
        );

        // Handle topics data
        builder.addMatcher(
            newProgressTrackingApi.endpoints.getAccessibleTopics.matchFulfilled,
            (state, { payload }) => {
                state.accessibleData.topics = payload.topics;
            }
        );

        // Handle quizzes data
        builder.addMatcher(
            newProgressTrackingApi.endpoints.getAccessibleQuizzes.matchFulfilled,
            (state, { payload }) => {
                state.accessibleData.quizzes = payload.quizzes;
            }
        );

        // Handle assignments data
        builder.addMatcher(
            newProgressTrackingApi.endpoints.getAccessibleAssignments.matchFulfilled,
            (state, { payload }) => {
                state.accessibleData.assignments = payload.assignments;
            }
        );

        // Handle topic completion
        builder.addMatcher(
            newProgressTrackingApi.endpoints.markTopicCompleted.matchFulfilled,
            (state, { payload }) => {
                // Update topic accessibility in state if needed
                if (payload.nextTopicId) {
                    const nextTopic = state.accessibleData.topics.find(
                        topic => topic.id === payload.nextTopicId
                    );
                    if (nextTopic) {
                        nextTopic.isAccessible = true;
                    }
                }
            }
        );

        // Handle loading states
        builder.addMatcher(
            (action) => action.type.endsWith('/pending'),
            (state) => {
                state.loading = true;
                state.error = null;
            }
        );

        // Handle error states
        builder.addMatcher(
            (action) => action.type.endsWith('/rejected'),
            (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            }
        );

        // Handle success states
        builder.addMatcher(
            (action) => action.type.endsWith('/fulfilled'),
            (state) => {
                state.loading = false;
                state.error = null;
            }
        );
    }
});

// Export actions
export const {
    setCurrentSession,
    setCurrentModule,
    setCurrentTopic,
    clearProgressState
} = progressTrackingSlice.actions;

// Export selectors
export const selectCurrentSession = (state) => state.progressTracking.currentSession;
export const selectCurrentModule = (state) => state.progressTracking.currentModule;
export const selectCurrentTopic = (state) => state.progressTracking.currentTopic;
export const selectAccessibleSessions = (state) => state.progressTracking.accessibleData.sessions;
export const selectAccessibleModules = (state) => state.progressTracking.accessibleData.modules;
export const selectAccessibleTopics = (state) => state.progressTracking.accessibleData.topics;
export const selectAccessibleQuizzes = (state) => state.progressTracking.accessibleData.quizzes;
export const selectAccessibleAssignments = (state) => state.progressTracking.accessibleData.assignments;
export const selectProgressLoading = (state) => state.progressTracking.loading;
export const selectProgressError = (state) => state.progressTracking.error;

export default progressTrackingSlice.reducer;