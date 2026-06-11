import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../../CookieService";

export const trueFalseApi = createApi({
  reducerPath: "trueFalseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/generated-quiz/true-false/`, // Base URL for True/False
  }),
  endpoints: (builder) => ({
    createTrueFalse: builder.mutation({
      query: ({ tf, access_token }) => ({
        url: "create",
        method: "POST",
        body: tf,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["TrueFalse"],
    }),
    // getAllTrueFalse: builder.query({
    //     query: () => ({
    //         url: "",
    //         method: "GET",
    //     }),
    //     providesTags: ["TrueFalse"],
    // }),
    // getTrueFalseById: builder.query({
    //     query: (id) => ({
    //         url: `${id}`,
    //         method: "GET",
    //     }),
    // }),
    updateTrueFalse: builder.mutation({
      query: ({ id, tf, access_token }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: tf,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["TrueFalse"],
    }),
    deleteTrueFalse: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `delete/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["TrueFalse"],
    }),
  }),
});

export const {
  useCreateTrueFalseMutation,
  // useGetAllTrueFalseQuery,
  // useGetTrueFalseByIdQuery,
  useUpdateTrueFalseMutation,
  useDeleteTrueFalseMutation,
} = trueFalseApi;
