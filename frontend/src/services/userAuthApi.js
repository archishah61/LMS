import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define a service using a base URL and expected endpoints
export const userAuthApi = createApi({
  reducerPath: "userAuthApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/user/auth/`,
    credentials: "include", // Allow sending cookies with requests
  }),
  endpoints: (builder) => ({
    registerUser: builder.mutation({
      query: (user) => ({
        url: "signup/",
        method: "POST",
        body: user,
        headers: {
          "Content-type": "application/json",
        },
      }),
    }),
    loginUser: builder.mutation({
      query: (user) => ({
        url: "login/",
        method: "POST",
        body: user,
        headers: {
          "Content-type": "application/json",
        },
      }),
    }),
    logoutUser: builder.mutation({
      query: (access_token) => ({
        url: "logout/",
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),
    googleLoginUser: builder.mutation({
      query: ({ idToken, app_platform, forceLogin }) => ({
        url: "googleLogin/",
        method: "POST",
        body: { app_platform, forceLogin },
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }),
    }),
    getUserById: builder.query({
      query: ({ id, access_token }) => ({
        url: `/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
      providesTags: ["User"],
    }),
    updateUserProfile: builder.mutation({
      query: ({ id, updatedData }) => ({
        url: `/user/${id}`,
        method: "PUT",
        body: updatedData,
      }),
    }),
    deleteProfileImage: builder.mutation({
      query: ({ userId }) => ({
        url: `/users/${userId}/delete-profile-image`,
        method: "DELETE",
      }),
    }),
    changePassword: builder.mutation({
      query: ({ id, currentPassword, newPassword }) => ({
        url: `/users/${id}/change-password`,
        method: "POST",
        body: { currentPassword, newPassword },
        headers: {
          "Content-type": "application/json",
        },
      }),
    }),
    getUserPointsById: builder.query({
      query: (id) => ({
        url: `/points/${id}`, // <- Adjust if your backend route is different
        method: "GET",
      }),
    }),
    verifyToken: builder.query({
      query: ({ access_token }) => ({
        url: "/verify-token",
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }),
    }),

    // For Admin Use
    // Get all users with pagination
    getAllUsers: builder.query({
      query: ({ page = 1, limit = 10, search = "" }) => ({
        url: "all",
        method: "GET",
        params: { page, limit, search },
      }),
      providesTags: ["User"],
    }),

    // Create new user
    createUser: builder.mutation({
      query: ({ userData, access_token }) => ({
        url: "create",
        method: "POST",
        body: userData,
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["User"],
    }),

    // Update user
    updateUser: builder.mutation({
      query: ({ id, userData, access_token }) => ({
        url: `update/${id}`, // Assuming the route should include ID
        method: "PUT",
        body: userData,
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["User"],
    }),

    // Toggle user status
    toggleUserStatus: builder.mutation({
      query: ({ id, is_active, access_token }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: { is_active },
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      }),
      invalidatesTags: ["User"],
    }),

    // Forgot password: request reset
    requestResetPassword: builder.mutation({
      query: ({ email }) => ({
        url: "request-reset-password",
        method: "POST",
        body: { email },
        headers: { "Content-type": "application/json" },
      }),
    }),
    // Forgot password: verify OTP
    verifyResetOtp: builder.mutation({
      query: ({ email, otp }) => ({
        url: "verify-reset-otp",
        method: "POST",
        body: { email, otp },
        headers: { "Content-type": "application/json" },
      }),
    }),
    // Forgot password: reset password
    resetPassword: builder.mutation({
      query: ({ email, otp, newPassword }) => ({
        url: "reset-password",
        method: "POST",
        body: { email, otp, newPassword },
        headers: { "Content-type": "application/json" },
      }),
    }),

    // Check if user is already logged in
    checkIsUserAlreadyLoggedIn: builder.mutation({
      query: (identifier) => ({
        url: "/check-user-login",
        method: "POST",
        body: { identifier },
        headers: { "Content-type": "application/json" },
      }),
    }),
  }),
});

export const {
  useRegisterUserMutation,
  useLoginUserMutation,
  useLogoutUserMutation,
  useGoogleLoginUserMutation,
  useGetUserByIdQuery,
  useUpdateUserProfileMutation,
  useDeleteProfileImageMutation,
  useChangePasswordMutation, // Hook for changing password
  useGetUserPointsByIdQuery,
  useVerifyTokenQuery,
  useGetAllUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useToggleUserStatusMutation,
  useRequestResetPasswordMutation,
  useVerifyResetOtpMutation,
  useResetPasswordMutation,
  useCheckIsUserAlreadyLoggedInMutation,
} = userAuthApi;
