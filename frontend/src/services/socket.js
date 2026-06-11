import io from "socket.io-client";
import { getAdminToken, getStudentToken, removeToken } from "./CookieService";
import { useLogoutUserMutation } from "./userAuthApi";
import toast from "react-hot-toast";
import { useLogoutAdminOrPartnerUserMutation } from "./adminAuthApi";

let socket;

export const initSocket = (userId, userRole = "student", logOut, navigate, dispatch) => {
    const notifyError = (error) => toast.error(error);
    const notifySuccess = (msg) => toast.success(msg);

    if (!socket || !socket.connected) {
        socket = io(import.meta.env.VITE_BACKEND_MEDIA_URL, {
            transports: ["websocket"],
        });
    }

    // ✅ Clean old listeners to prevent duplicates
    socket.off("force-logout");
    socket.off("assignment-reminder");

    // ✅ Register user session with backend
    socket.emit("register-session", { userId, userRole });

    // 🔹 Handle force logout
    socket.on("force-logout", async (data) => {
        notifySuccess(data.message || "You’ve been logged out.");
        // console.log("data ", data)
        removeToken(data.userRole);
        await logOut();
        if (data.userRole && (data.userRole === "admin" || data.userRole === "partner")) {
            navigate("/admin/login");
        } else {
            navigate("/?login=true");
        }
    });

    // 🔹 Handle assignment reminder
    socket.on("assignment-reminder", (data) => {
        notifySuccess(data.message || "You have a pending assignment reminder!");
        // Optional: show native browser notification if tab is inactive
        if (Notification.permission === "granted") {
            new Notification("Assignment Reminder", {
                body: data.message,
            });
        }
    });
};

// NEW: Initialize or re-initialize socket based on existing session
export const initSocketIfNeeded = async (userId, userRole = "student", logOut, navigate, dispatch) => {
    // If socket already exists and connected, don't reinitialize
    if (socket && socket.connected) {
        // console.log("Socket already connected");
        return socket;
    }

    const { refresh_token } = (userRole === "admin" || userRole === "partner") ? getAdminToken() : getStudentToken();

    // Check if session is still valid on server
    const isValid = await checkSessionValidity(userId, userRole, refresh_token);

    if (!isValid) {
        // console.log("Session invalid, logging out");
        // Session was invalidated by another device
        removeToken(userRole);

        if (logOut) await logOut();

        toast.error("You've been logged out because you logged in on another device");
        navigate(userRole === "admin" || userRole === "partner" ? "/admin/login" : "/?login=true");
        return null;
    }

    // Create new socket connection
    if (socket) {
        socket.disconnect();
    }

    socket = io(import.meta.env.VITE_BACKEND_MEDIA_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });

    // Setup socket event handlers
    setupSocketHandlers(socket, userId, userRole, logOut, navigate, dispatch);

    return socket;
};

// Setup all socket event handlers
const setupSocketHandlers = (socket, userId, userRole, logOut, navigate, dispatch) => {
    // Clean old listeners
    socket.off("force-logout");
    socket.off("assignment-reminder");
    socket.off("connect");
    socket.off("disconnect");

    // Handle connection
    socket.on("connect", () => {
        socket.emit("register-session", {
            userId,
            userRole
        });
    });

    // Handle force logout
    socket.on("force-logout", async (data) => {
        toast.success(data.message || "You’ve been logged out.");
        removeToken(data.userRole);

        if (socket) {
            socket.disconnect();
            socket = null;
        }

        if (logOut) await logOut();

        if (data.userRole && (data.userRole === "admin" || data.userRole === "partner")) {
            navigate("/admin/login");
        } else {
            navigate("/?login=true");
        }
    });

    // Handle assignment reminders (keep your existing logic)
    socket.on("assignment-reminder", (data) => {
        toast.success(data.message || "You have a pending assignment reminder!");
        if (Notification.permission === "granted") {
            new Notification("Assignment Reminder", {
                body: data.message,
            });
        }
    });
};

// Check session validity with backend
const checkSessionValidity = async (userId, userRole, refresh_token) => {
    try {

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/${userRole == "admin" || userRole == "partner" ? "admin" : "user"}/auth/verify-refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: refresh_token })
        });
        const data = await response.json();

        return data.isValid;
    } catch (error) {
        console.error("Session check failed:", error);
        // If can't reach server, assume session is valid to avoid false positives
        return true;
    }
};

// Export function to disconnect socket
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

// Export function to get socket instance
export const getSocket = () => socket;