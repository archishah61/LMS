import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const userActivityLogApi = createApi({
  reducerPath: 'userActivityLogApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/activity/`,
  }),
  tagTypes: ['UserActivityLogs'],
  endpoints: (builder) => ({
    getActivityLogDates: builder.query({
      query: (params = {}) => {
        const { access_token, ...rest } = params;
        const sp = new URLSearchParams();
        Object.entries(rest).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') sp.append(k, v); });
        const headers = access_token ? { Authorization: `Bearer ${access_token}` } : {};
        return { url: `logs/dates?${sp.toString()}`, method: 'GET', headers };
      },
      providesTags: () => [{ type: 'UserActivityLogs', id: 'DATES' }]
    }),
    getActivityLogsByDate: builder.query({
      query: ({ date, ...params }) => {
        const { access_token, ...rest } = params;
        const sp = new URLSearchParams();
        Object.entries(rest).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') sp.append(k, v); });
        const headers = access_token ? { Authorization: `Bearer ${access_token}` } : {};
        return { url: `logs/date/${date}?${sp.toString()}`, method: 'GET', headers };
      },
      providesTags: () => [{ type: 'UserActivityLogs', id: 'DATE_LOGS' }]
    }),
    getActivityLogMeta: builder.query({
      query: (params = {}) => {
        const { access_token, user_id } = params;
        const sp = new URLSearchParams();
        if (user_id) sp.append('user_id', user_id);
        const headers = access_token ? { Authorization: `Bearer ${access_token}` } : {};
        return { url: `logs/meta?${sp.toString()}`, method: 'GET', headers };
      },
      providesTags: () => [{ type: 'UserActivityLogs', id: 'META' }]
    }),
    exportActivityLogs: builder.query({
      query: (params = {}) => {
        const { access_token, ...rest } = params;
        const sp = new URLSearchParams();
        Object.entries(rest).forEach(([k,v]) => { if (v !== undefined && v !== null && v !== '') sp.append(k,v); });
        const headers = access_token ? { Authorization: `Bearer ${access_token}` } : {};
        return { url: `logs/export?${sp.toString()}`, method: 'GET', headers };
      }
    })
  })
});

export const { useGetActivityLogDatesQuery, useGetActivityLogsByDateQuery, useGetActivityLogMetaQuery, useExportActivityLogsQuery } = userActivityLogApi;
