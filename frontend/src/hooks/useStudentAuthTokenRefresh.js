import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getTokenExpiry, getTokens, isTokenExpired, refreshUserToken, removeToken } from "../services/CookieService";
import { setUserToken, unSetUserToken } from "../features/authSlice";
import { unsetUserInfo } from "../features/userSlice";


const useStudentAuthTokenRefresh = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        let timer;

        const scheduleRefresh = async () => {
            const { accessToken, refreshToken } = getTokens("student");

            // If no refresh token, we can't refresh. We might be logged out.
            if (!refreshToken) {
                return;
            }

            // If access token is missing or expired, try to refresh immediately
            if (!accessToken || isTokenExpired(accessToken)) {
                try {
                    const data = await refreshUserToken();
                    if (data.accessToken) {
                        dispatch(setUserToken({ access_token: data.accessToken }));
                        scheduleRefresh(); // Schedule next
                    }
                } catch (error) {
                    // Refresh failed (e.g. refresh token expired or invalid)
                    console.error("Token refresh failed:", error);
                    removeToken("student");
                    dispatch(unSetUserToken({ access_token: null }));
                    dispatch(
                        unsetUserInfo({
                            id: "",
                            email: "",
                            username: "",
                            picture: "",
                            points: 0,
                            role: "",
                        })
                    );
                }
                return;
            }

            // Access token is valid. Calculate time to refresh.
            const timeLeft = getTokenExpiry(accessToken);
            // Refresh 1 minute before expiry. 
            // If timeLeft is less than 1 minute, refresh immediately (delay 0).
            const bufferTime = 60 * 1000;
            const delay = Math.max(timeLeft - bufferTime, 0);

            timer = setTimeout(async () => {
                try {
                    const data = await refreshUserToken();
                    if (data.accessToken) {
                        dispatch(setUserToken({ access_token: data.accessToken }));
                        scheduleRefresh(); // Schedule next refresh
                    }
                } catch (error) {
                    console.error("Scheduled token refresh failed:", error);
                    removeToken("student");
                    dispatch(unSetUserToken({ access_token: null }));
                    dispatch(
                        unsetUserInfo({
                            id: "",
                            email: "",
                            username: "",
                            picture: "",
                            points: 0,
                            role: "",
                        })
                    );
                }
            }, delay);
        };

        scheduleRefresh();

        return () => clearTimeout(timer);
    }, [dispatch]);
};

export default useStudentAuthTokenRefresh;
