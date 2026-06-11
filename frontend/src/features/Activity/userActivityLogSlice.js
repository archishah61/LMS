import { createSlice } from '@reduxjs/toolkit';

// Minimal client-side UI state slice (filters, selected row, view mode) separate from server cache (RTK Query)
const initialState = {
  filters: {
    page: 1,
    limit: 25,
    user_id: '',
    event_category: '',
    event_action: '',
    outcome: '',
    entity_type: '',
    start_date: '',
    end_date: '',
    search: ''
  },
  selectedLog: null,
  view: 'table' // or 'timeline'
};

const userActivityLogSlice = createSlice({
  name: 'userActivityLog',
  initialState,
  reducers: {
    setFilters(state, { payload }) {
      state.filters = { ...state.filters, ...payload, page: payload.page || state.filters.page };
    },
    resetFilters(state) {
      state.filters = initialState.filters;
    },
    setPage(state, { payload }) {
      state.filters.page = payload;
    },
    setSelectedLog(state, { payload }) {
      state.selectedLog = payload;
    },
    setView(state, { payload }) {
      state.view = payload;
    }
  }
});

export const { setFilters, resetFilters, setPage, setSelectedLog, setView } = userActivityLogSlice.actions;
export default userActivityLogSlice.reducer;
