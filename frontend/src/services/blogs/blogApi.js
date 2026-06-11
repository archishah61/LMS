import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const blogApi = createApi({
  reducerPath: "blogApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/blogs`,
  }),
  tagTypes: ['Blog'],
  endpoints: (builder) => ({
    createBlog: builder.mutation({
      query: ({ blogData, access_token }) => ({
        url: "/",
        method: "POST",
        body: blogData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ['Blog'],
    }),

    updateBlog: builder.mutation({
      query: ({ id, blogData, access_token }) => ({
        url: `/${id}`,
        method: "PUT",
        body: blogData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ['Blog'],
    }),

    getAllBlogs: builder.query({
      query: (params = {}) => ({
        url: "/",
        params,
        method: "GET",
      }),
      providesTags: ['Blog'],
    }),

    getBlogBySlug: builder.query({
      query: (slug) => ({
        url: `/${slug}`,
        method: "GET",
      }),
      providesTags: (result, error, slug) => [{ type: 'Blog', id: slug }],
    }),

    deleteBlogById: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ['Blog'],
    }),

    // Category Endpoints
    getAllBlogCategories: builder.query({
      query: () => ({
        url: "/categories/all",
        method: "GET",
      }),
      providesTags: ['BlogCategory'],
    }),

    createBlogCategory: builder.mutation({
      query: ({ categoryData, access_token }) => ({
        url: "/categories",
        method: "POST",
        body: categoryData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ['BlogCategory'],
    }),

    updateBlogCategory: builder.mutation({
      query: ({ id, categoryData, access_token }) => ({
        url: `/categories/${id}`,
        method: "PUT",
        body: categoryData,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ['BlogCategory'],
    }),

    deleteBlogCategory: builder.mutation({
      query: ({ id, access_token }) => ({
        url: `/categories/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ['BlogCategory'],
    }),
  }),
});

export const {
  useCreateBlogMutation,
  useUpdateBlogMutation,
  useGetAllBlogsQuery,
  useGetBlogBySlugQuery,
  useDeleteBlogByIdMutation,
  useGetAllBlogCategoriesQuery,
  useCreateBlogCategoryMutation,
  useUpdateBlogCategoryMutation,
  useDeleteBlogCategoryMutation,
} = blogApi;
