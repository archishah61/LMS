import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

const storeToken = (accessToken, refreshToken, role) => {
  let accessKey, refreshKey;
  if (role === "admin" || role === "partner") {
    accessKey = "access_token";
    refreshKey = "refresh_token";
  } else {
    accessKey = "student_access_token";
    refreshKey = "student_refresh_token";
  }
  if (accessToken) Cookies.set(accessKey, accessToken, { 
    expires: 7, // 7 days
    path: "/",
    sameSite: "strict"
  });
  if (refreshToken) Cookies.set(refreshKey, refreshToken, { 
    expires: 7, // 7 days
    path: "/", 
    sameSite: "strict"
  });
};

const getTokens = (role) => {
  let accessKey, refreshKey;
  if (role === "admin" || role === "partner") {
    accessKey = "access_token";
    refreshKey = "refresh_token";
  } else {
    accessKey = "student_access_token";
    refreshKey = "student_refresh_token";
  }
  return {
    accessToken: Cookies.get(accessKey),
    refreshToken: Cookies.get(refreshKey),
  };
};

const getAdminToken = () => {
  const access_token = Cookies.get("access_token");
  const refresh_token = Cookies.get("refresh_token");
  return { access_token, refresh_token };
};

const getStudentToken = () => {
  const access_token = Cookies.get("student_access_token");
  const refresh_token = Cookies.get("student_refresh_token");
  return { access_token, refresh_token };
};

const removeToken = (role) => {
  let accessKey, refreshKey;
  
  if (role === "admin" || role === "partner") {
    accessKey = "access_token";
    refreshKey = "refresh_token";
  } else {
    accessKey = "student_access_token";
    refreshKey = "student_refresh_token";
  }
  
  // Use proper path when removing cookies
  Cookies.remove(accessKey, { path: "/" });
  Cookies.remove(refreshKey, { path: "/" });
  
};


const isTokenExpired = (token) => {
  if (!token || typeof token !== "string") return true;
  try {
    const { exp } = jwtDecode(token);
    return Date.now() >= exp * 1000;
  } catch (error) {
    return true;
  }
};

// Get token expiry in ms
const getTokenExpiry = (token) => {
  if (!token || typeof token !== "string") return 0;
  try {
    const { exp } = jwtDecode(token);
    return exp * 1000 - Date.now();
  } catch (error) {
    return 0;
  }
};

export const refreshUserToken = async () => {
  const tokens = getTokens("student");
  try {
    const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/user/auth/refresh-token`, { refreshToken: tokens.refreshToken }, { withCredentials: true });
    // Store the new access token only, keep the existing refresh token
    if (res.data && res.data.accessToken) {
      storeToken(res.data.accessToken, tokens.refreshToken, "student");
    }
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const refreshAdminToken = async () => {
  const tokens = getTokens("admin");
  try {
    const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/admin/auth/refresh-token`, { refreshToken: tokens.refreshToken }, { withCredentials: true });
    // Store both the new access token and rotated refresh token
    if (res.data && res.data.accessToken) {
      const newRefreshToken = res.data.refreshToken || tokens.refreshToken;
      storeToken(res.data.accessToken, newRefreshToken, "admin");
    }
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const refreshPartnerToken = async () => {
  // Partners share the same cookie space as admins
  const tokens = getTokens("admin");
  try {
    const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/admin/auth/refresh-token`, { refreshToken: tokens.refreshToken }, { withCredentials: true });
    // Store both the new access token and rotated refresh token
    if (res.data && res.data.accessToken) {
      const newRefreshToken = res.data.refreshToken || tokens.refreshToken;
      storeToken(res.data.accessToken, newRefreshToken, "admin");
    }
    return res.data;
  } catch (error) {
    throw error;
  }
};

export { storeToken, getAdminToken, getStudentToken, removeToken, getTokens, isTokenExpired, getTokenExpiry };