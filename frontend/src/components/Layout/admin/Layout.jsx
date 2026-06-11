/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import AdminSidebar from "../../admin/Sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getAdminToken, refreshAdminToken, refreshPartnerToken } from "../../../services/CookieService";
import { jwtDecode } from "jwt-decode";
import { setUserToken } from "../../../features/authSlice";
import { setUserInfo } from "../../../features/userSlice";
import { getTokenExpiry, isTokenExpired, storeToken, removeToken } from "../../../services/CookieService";
import useAdminAuthRefreshToken from "../../../hooks/useAdminAuthTokenRefresh";
import { useSocketInitialization } from "../../../services/useSocketInitialization";
import { useLogoutAdminOrPartnerUserMutation } from "../../../services/adminAuthApi";

export default function Layout() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen(!isOpen);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [logoutAdminOrPartner] = useLogoutAdminOrPartnerUserMutation();

  useAdminAuthRefreshToken();
  // Initialize socket on app load
  useSocketInitialization("admin", logoutAdminOrPartner, navigate, dispatch);

  // Check if the user is already logged in
  useEffect(() => {
    const { access_token } = getAdminToken();
    if (access_token) {
      try {
        const decodedToken = jwtDecode(access_token);
        if (
          decodedToken &&
          (decodedToken.role == "admin" || decodedToken.role == "partner")
        ) {
          dispatch(setUserToken({ access_token: access_token }));
          dispatch(setUserInfo(decodedToken));
        } else {
          navigate("/admin/login");
        }
      } catch (error) {
        console.error("error", error);
      }
    } else {
      navigate("/admin/login");
    }
  }, [navigate]);

  // --- Token Refresh Logic (Admin) ---
  // useEffect(() => {
  //   let timer;

  //   const scheduleRefresh = () => {
  //     const { access_token } = getAdminToken();

  //     // If token is expired, remove it and logout
  //     if (!access_token || isTokenExpired(access_token)) {
  //       removeToken("admin");
  //       dispatch(setUserToken({ access_token: null }));
  //       dispatch(setUserInfo({ id: "", email: "", username: "", picture: "", points: 0, role: "" }));
  //       navigate("/dashboard");
  //       return;
  //     }

  //     const timeLeft = getTokenExpiry(access_token);

  //     // Get the current role from the token
  //     const decodedToken = jwtDecode(access_token);
  //     const userRole = decodedToken.role;

  //     // Schedule refresh 1 minute before expiry, or every 1 min if expiry is short
  //     timer = setTimeout(async () => {
  //       try {
  //         // Call appropriate refresh function based on role
  //         let data;
  //         if (userRole === "partner") {
  //           data = await refreshPartnerToken();
  //         } else {
  //           data = await refreshAdminToken();
  //         }

  //         if (data.accessToken) {
  //           // Token is already stored by the refresh function
  //           dispatch(setUserToken({ access_token: data.accessToken }));
  //           // After refreshing, schedule the next refresh
  //           scheduleRefresh();
  //         }
  //       } catch (error) {
  //         // On error, remove token and logout
  //         removeToken("admin");
  //         dispatch(setUserToken({ access_token: null }));
  //         dispatch(setUserInfo({ id: "", email: "", username: "", picture: "", points: 0, role: "" }));
  //         navigate("/dashboard");
  //       }
  //     }, Math.max(timeLeft - 60 * 1000, 60 * 1000));
  //   };

  //   scheduleRefresh();

  //   return () => clearTimeout(timer);
  // }, [dispatch, navigate]);

  // --- Logout if Refresh Token Expired (Admin) ---
  useEffect(() => {
    const { refresh_token } = getAdminToken();
    if (isTokenExpired(refresh_token)) {
      removeToken("admin");
    }
  }, [dispatch]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
      {/* Main content area with proper spacing for sidebar */}
      <main className="flex-1 ml-4 lg:ml-20 transition-all duration-300 ease-in-out">
        <div className="w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}