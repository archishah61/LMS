// hooks/useSocketInitialization.js
import { useEffect, useRef } from 'react';
import { initSocketIfNeeded, disconnectSocket } from '../services/socket';
import { getAdminToken, getStudentToken } from '../services/CookieService';
import { jwtDecode } from 'jwt-decode';

export const useSocketInitialization = (panel = "student", logoutUser, navigate, dispatch) => {
    const initialized = useRef(false);
    const isInitializing = useRef(false);

    useEffect(() => {
        const initializeSocket = async () => {
            if (isInitializing.current) return;

            let tokenData;
            // Check if user is logged in (has valid token)
            if (panel === "admin") {
                tokenData = getAdminToken();
            } else {
                tokenData = getStudentToken();
            }

            if (!tokenData?.access_token) {
                // console.log("No token found, skipping socket init");
                return;
            }

            try {
                isInitializing.current = true;

                // Decode token to get user info
                const userInfo = jwtDecode(tokenData.access_token);

                // console.log(userInfo.role, userInfo);

                // Check if token is expired
                const currentTime = Date.now() / 1000;
                if (userInfo.exp < currentTime) {
                    // console.log("Token expired");
                    return;
                }

                // Initialize socket if needed
                await initSocketIfNeeded(
                    userInfo.id,
                    userInfo.role === "user" ? "student" : userInfo.role,
                    logoutUser,
                    navigate,
                    dispatch
                );
                initialized.current = true;
            } catch (error) {
                console.error("Failed to initialize socket:", error);
            } finally {
                isInitializing.current = false;
            }
        };

        initializeSocket();

        // Cleanup on unmount
        return () => {
            if (initialized.current) {
                disconnectSocket();
                initialized.current = false;
            }
        };
    }, [logoutUser, navigate, dispatch]); // Re-run if these change
};