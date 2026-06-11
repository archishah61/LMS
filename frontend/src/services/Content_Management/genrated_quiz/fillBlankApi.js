import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../../CookieService";

export const fillBlankApi = createApi({
  reducerPath: "fillBlankApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${
      import.meta.env.VITE_BACKEND_URL
    }/generated-quiz/fill-in-the-blanks/`, // Base URL for Fill in the Blank
  }),
  endpoints: (builder) => ({
    createFillBlank: builder.mutation({
      query: ({ fillBlank, access_token }) => ({
        url: "create",
        method: "POST",
        body: fillBlank,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["FillBlank"],
    }),
    deleteFillBlank: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `delete/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["FillBlank"],
    }),
  }),
});

export const {
  useCreateFillBlankMutation,
  // useGetAllFillBlankQuery,
  // useGetFillBlankByIdQuery,
  useUpdateFillBlankMutation,
  useDeleteFillBlankMutation,
} = fillBlankApi;
