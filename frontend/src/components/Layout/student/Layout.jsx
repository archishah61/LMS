/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getTokens, isTokenExpired, getTokenExpiry, storeToken, removeToken, refreshUserToken, getStudentToken } from "../../../services/CookieService";
import { jwtDecode } from "jwt-decode";
import { setUserToken, unSetUserToken } from "../../../features/authSlice";
import { setUserInfo, unsetUserInfo } from "../../../features/userSlice";
import StudentSidebar from "../../student/studentSidebar";
import Navbar from "../../navbar/navbar";
import Footer from "../../Footer/Footer";
import ChatBot from "../../Home/courses/ChatBot";
import useStudentAuthTokenRefresh from "../../../hooks/useStudentAuthTokenRefresh";
import DefaultSEOMeta from "../../../context/DefaultSEOMeta";
import { useLogoutUserMutation } from "../../../services/userAuthApi";
import { useSocketInitialization } from "../../../services/useSocketInitialization";

export default function Layout() {
    const [isOpen, setIsOpen] = useState(false);
    const toggleSidebar = () => setIsOpen(!isOpen);
    const navigate = useNavigate(); // Initialize useNavigate
    const location = useLocation();
    const dispatch = useDispatch();

    const [logoutUser] = useLogoutUserMutation();

    useStudentAuthTokenRefresh();
    // Initialize socket on app load
    useSocketInitialization(logoutUser, navigate, dispatch);

    // Check if the user is already logged in
    const { access_token } = getTokens("student");
    useEffect(() => {

        if (access_token) {
            try {

                const decodedToken = jwtDecode(access_token);
                if (decodedToken) {
                    dispatch(setUserToken({ access_token: access_token }));
                    dispatch(setUserInfo(decodedToken));
                }
            } catch (error) {
            }
        }
    }, [navigate, access_token]);

    // Token refresh before expiry


    useEffect(() => {
        const { refresh_token } = getStudentToken();
        if (isTokenExpired(refresh_token)) {
            removeToken("student");
        }
    }, [dispatch]);

    // Paths where exam (challenge / contest / quiz) is in progress and UI chrome should be hidden
    const EXAM_ROUTE_PATTERNS = [
        /^\/daily-challenge\/[^/]+$/, // Daily challenge attempt
        /^\/challenges\/task\/[^/]+$/, // Challenge quest task attempt
        /^\/contests\/[^/]+\/quiz\/[^/]+\/start$/, // Contest quiz start/attempt
        /^\/contests\/[^/]+\/quiz\/[^/]+$/, // Contest activity quiz (if used)
        /^\/contests\/[^/]+\/coding\/[^/]+$/, // Contest coding quiz
        /^\/contests\/[^/]+\/coding\/[^/]+\/solve$/, // Contest coding solve
    ];

    // Also hide chrome for the student profile layout pages
    const PROFILE_LAYOUT_PATTERN = /^\/user-profile-layout(\/.*)?$/;

    const hideLayoutChrome = EXAM_ROUTE_PATTERNS.some(r => r.test(location.pathname)) || PROFILE_LAYOUT_PATTERN.test(location.pathname);

    if (hideLayoutChrome) {
        // Render only the outlet (exam content) without nav/footer/chatbot
        return (
            <div className="w-full min-h-screen">
                <Outlet />
            </div>
        );
    }

    return (
        <div className={` ${isOpen ? "ml-64" : "ml-0"}`}>
            {/* ✅ Global default SEO tags */}
            <DefaultSEOMeta />
            <Navbar />
            <main className="flex-1">
                <Outlet />
            </main>
            {/* <ChatBot /> */}
            <Footer />
        </div>
    );
}