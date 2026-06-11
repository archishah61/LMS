import React, { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const AuthModalContext = createContext();

export const useAuthModal = () => {
    const context = useContext(AuthModalContext);
    if (!context) {
        throw new Error("useAuthModal must be used within an AuthModalProvider");
    }
    return context;
};

export const AuthModalProvider = ({ children }) => {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isSignupOpen, setIsSignupOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    const openLogin = () => {
        setIsSignupOpen(false);
        setIsLoginOpen(true);
    };

    const closeLogin = () => {
        setIsLoginOpen(false);
        // Remove login query param if it exists
        if (searchParams.get("login")) {
            searchParams.delete("login");
            setSearchParams(searchParams);
        }
    };

    const openSignup = () => {
        setIsLoginOpen(false);
        setIsSignupOpen(true);
    };

    const closeSignup = () => {
        setIsSignupOpen(false);
    };

    // Check for query param to auto-open login
    useEffect(() => {
        if (searchParams.get("login") === "true") {
            openLogin();
        }
    }, [searchParams]);

    return (
        <AuthModalContext.Provider
            value={{
                isLoginOpen,
                isSignupOpen,
                openLogin,
                closeLogin,
                openSignup,
                closeSignup,
            }}
        >
            {children}
        </AuthModalContext.Provider>
    );
};
