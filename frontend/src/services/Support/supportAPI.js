import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAdminToken } from "../CookieService";

export const supportApi = createApi({
  reducerPath: "supportApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/support`,
  }),
  tagTypes: ["SupportTicket", "SupportReply"],
  endpoints: (builder) => ({
    // ✅ Create a new support ticket
    createSupportTicket: builder.mutation({
      query: ({ data, access_token }) => ({
        url: "/tickets",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["SupportTicket"],
    }),

    // ✅ Get all support tickets
    getAllSupportTickets: builder.query({
      query: ({ search_term, limit = "10", offset = "0", status, category, access_token }) => ({
        url: "/tickets",
        method: "GET",
        params: { search_term, limit, offset, status, category },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["SupportTicket"],
    }),

    // ✅ Get all support tickets
    getAllUserSupportTickets: builder.query({
      query: ({ access_token }) => ({
        url: "/user-tickets",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["SupportTicket"],
    }),

    // ✅ Get a single support ticket with replies & attachments
    getSupportTicketById: builder.query({
      query: ({ id, access_token }) => ({
        url: `/tickets/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: (result, error, id) => [
        { type: "SupportTicket", id },
        "SupportReply",
      ],
    }),

    // ✅ Update ticket
    updateSupportTicket: builder.mutation({
      query: ({ id, access_token, ...data }) => ({
        url: `/tickets/${id}`,
        method: "PUT",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "SupportTicket", id },
      ],
    }),

    // ✅ Delete ticket
    deleteSupportTicket: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `/tickets/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: (result, error, id) => [{ type: "SupportTicket", id }],
    }),

    // ✅ Add a reply to a ticket
    createSupportReply: builder.mutation({
      query: ({ data, access_token }) => ({
        url: "/replies",
        method: "POST",
        body: data,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["SupportReply"],
    }),

    // ✅ Delete a reply
    deleteSupportReply: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `/replies/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["SupportReply"],
    }),
  }),
});

export const {
  useCreateSupportTicketMutation,
  useGetAllSupportTicketsQuery,
  useGetAllUserSupportTicketsQuery,
  useGetSupportTicketByIdQuery,
  useUpdateSupportTicketMutation,
  useDeleteSupportTicketMutation,
  useCreateSupportReplyMutation,
  useDeleteSupportReplyMutation,
} = supportApi;
