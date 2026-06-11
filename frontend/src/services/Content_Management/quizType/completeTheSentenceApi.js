import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const completeTheSentenceApi = createApi({
    reducerPath: "completeTheSentenceApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_BACKEND_URL}/complete-sentence/`,
    }),
    tagTypes: ["CompleteSentence"],
    endpoints: (builder) => ({

        // ✅ Create
        createCompleteSentenceQuestion: builder.mutation({
            query: ({ data, access_token }) => ({
                url: "create",
                method: "POST",
                body: data,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["CompleteSentence"],
        }),

        // ✅ Get All
        getAllCompleteSentenceQuestions: builder.query({
            query: ({ access_token }) => ({
                url: "",
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["CompleteSentence"],
        }),

        // ✅ Get by Quiz ID
        getCompleteSentencesByQuizId: builder.query({
            query: ({ quiz_id, access_token }) => ({
                url: `quiz/${quiz_id}`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            providesTags: ["CompleteSentence"],
        }),

        // ✅ Update
        updateCompleteSentenceQuestion: builder.mutation({
            query: ({ id, data, access_token }) => ({
                url: `update/${id}`,
                method: "PUT",
                body: data,
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }),
            invalidatesTags: ["CompleteSentence"],
        }),

        // ✅ Delete (optional if needed later)
        // deleteCompleteSentenceQuestion: builder.mutation({
        //     query: ({ id, access_token }) => ({
        //         url: `delete/${id}`,
        //         method: "DELETE",
        //         headers: {
        //             Authorization: `Bearer ${access_token}`,
        //         },
        //     }),
        //     invalidatesTags: ["CompleteSentence"],
        // }),
    }),
});

export const {
    useCreateCompleteSentenceQuestionMutation,
    useGetAllCompleteSentenceQuestionsQuery,
    useGetCompleteSentencesByQuizIdQuery,
    useUpdateCompleteSentenceQuestionMutation,
    // useDeleteCompleteSentenceQuestionMutation,
} = completeTheSentenceApi;
