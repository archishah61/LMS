// api/summaryApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const summaryApi = createApi({
  reducerPath: "summaryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/ai-summary/summaries`,
  }),
  tagTypes: ['Summary'],
  endpoints: (builder) => ({
    createSummary: builder.mutation({
      query: ({ summaryData, access_token }) => ({
        url: '',
        method: 'POST',
        body: summaryData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ['Summary'],
    }),

    getSummariesByGeneralMaterialDescId: builder.query({
      query: ({ topic_id, general_material_desc_id, access_token }) => ({
        url: `/topic/${topic_id}/general-material-desc/${general_material_desc_id}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ['Summary'],
    }),

    getSummariesByGeneralMaterialPdfId: builder.query({
      query: ({ topic_id, general_material_pdf_id, access_token }) => ({
        url: `/topic/${topic_id}/general-material-pdf/${general_material_pdf_id}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ['Summary'],
    }),

    getSummariesByAccordionId: builder.query({
      query: ({ topic_id, accordion_id, access_token }) => ({
        url: `/topic/${topic_id}/accordion/${accordion_id}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ['Summary'],
      transformResponse: (response) => {
        // Ensure we always return an array
        return Array.isArray(response) ? response : [response];
      },
    }),

    getSummariesByMultiSlideGeneralDescId: builder.query({
      query: ({ topic_id, multi_slide_general_desc_id, access_token }) => ({
        url: `/topic/${topic_id}/multi-slide-general-desc/${multi_slide_general_desc_id}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ['Summary'],
    }),

    getSummariesByMultiSlideGeneralPdfId: builder.query({
      query: ({ topic_id, multi_slide_general_pdf_id, access_token }) => ({
        url: `/topic/${topic_id}/multi-slide-general-pdf/${multi_slide_general_pdf_id}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ['Summary'],
    }),

    getSummariesByMultiSlideAccordionId: builder.query({
      query: ({ topic_id, multi_slide_accordion_id, access_token }) => ({
        url: `/topic/${topic_id}/multi-slide-accordion/${multi_slide_accordion_id}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ['Summary'],
    }),

  }),
});

export const {
  useCreateSummaryMutation,
  useUpdateSummaryMutation,
  useGetSummariesByGeneralMaterialDescIdQuery,
  useGetSummariesByGeneralMaterialPdfIdQuery,
  useGetSummariesByAccordionIdQuery,
  useGetSummariesByMultiSlideGeneralDescIdQuery,
  useGetSummariesByMultiSlideGeneralPdfIdQuery,
  useGetSummariesByMultiSlideAccordionIdQuery,
} = summaryApi;