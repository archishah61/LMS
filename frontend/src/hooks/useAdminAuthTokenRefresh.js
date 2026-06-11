import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getAdminToken, getTokenExpiry, isTokenExpired, refreshAdminToken, refreshPartnerToken, removeToken } from "../services/CookieService";
import { setUserToken } from "../features/authSlice";
import { setUserInfo } from "../features/userSlice";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";



const useAdminAuthRefreshToken = () => {
    const dispatch = useDispatch();

    const navigate = useNavigate();


    useEffect(() => {
        let timer;

        const doLogout = () => {
            removeToken("admin");
            dispatch(setUserToken({ access_token: null }));
            dispatch(setUserInfo({ id: "", email: "", username: "", picture: "", points: 0, role: "" }));
            navigate("/admin/login");
        };

        const attemptRefresh = async (role) => {
            try {
                let data;
                if (role === "partner") {
                    data = await refreshPartnerToken();
                } else {
                    data = await refreshAdminToken();
                }
                if (data.accessToken) {
                    dispatch(setUserToken({ access_token: data.accessToken }));
                    // After refreshing, schedule the next refresh
                    scheduleRefresh();
                } else {
                    doLogout();
                }
            } catch (error) {
                doLogout();
            }
        };

        const scheduleRefresh = () => {
            const { access_token, refresh_token } = getAdminToken();

            // If no refresh token at all, logout
            if (!refresh_token || isTokenExpired(refresh_token)) {
                doLogout();
                return;
            }

            // If access token is missing or expired, try to refresh immediately
            if (!access_token || isTokenExpired(access_token)) {
                // Decode the refresh token to get the role
                try {
                    const decoded = jwtDecode(refresh_token);
                    attemptRefresh(decoded.role);
                } catch {
                    doLogout();
                }
                return;
            }

            const timeLeft = getTokenExpiry(access_token);

            // Get the current role from the token
            const decodedToken = jwtDecode(access_token);
            const userRole = decodedToken.role;

            // Schedule refresh 1 minute before expiry, minimum 10 seconds
            timer = setTimeout(() => {
                attemptRefresh(userRole);
            }, Math.max(timeLeft - 60 * 1000, 10 * 1000));
        };

        scheduleRefresh();

        return () => clearTimeout(timer);
    }, [dispatch, navigate]);
};

export default useAdminAuthRefreshToken;
