/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
    useGoogleLoginUserMutation,
    useLoginUserMutation,
    useRequestResetPasswordMutation,
    useVerifyResetOtpMutation,
    useResetPasswordMutation,
    useCheckIsUserAlreadyLoggedInMutation,
    useLogoutUserMutation,
} from "../../../services/userAuthApi";
import toast from "react-hot-toast";
import { setUserToken } from "../../../features/authSlice";
import { jwtDecode } from "jwt-decode";
import { storeToken, getStudentToken, isTokenExpired, getTokenExpiry, refreshUserToken, removeToken } from "../../../services/CookieService";
import { setUserInfo } from "../../../features/userSlice";
import { Link, useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../../../firebase";
import { signInWithPopup } from "firebase/auth";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, User, Shield, X, ArrowRight } from "lucide-react";

import { useGetTermsOfServiceByCategoryQuery } from "../../../services/LegalPages/termsOfServices";
import { useGetPrivacyPolicyByCategoryQuery } from "../../../services/LegalPages/privacyPolicy";
import { initSocket } from "../../../services/socket";

// Minimalist Button Component - Defined outside to prevent re-creation on render
const PrimaryButton = ({ onClick, disabled, children, className = "" }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 transform active:scale-[0.98] 
    bg-megistic text-white hover:bg-black hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

// Minimalist Input Component - Defined outside to prevent re-creation on render
const MinimalInput = ({ type, value, onChange, placeholder, icon: Icon, rightElement }) => (
    <div className="relative group">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-gray-600 transition-colors duration-200">
            <Icon className="w-5 h-5" />
        </div>
        <input
            type={type}
            value={value}
            onChange={onChange}
            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl text-gray-900 text-sm font-medium placeholder-gray-400 
      transition-all duration-200 focus:bg-white focus:border-gray-300 focus:ring-1 focus:ring-gray-100 outline-none"
            placeholder={placeholder}
        />
        {rightElement && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {rightElement}
            </div>
        )}
    </div>
);

const LoginModal = ({ userType, onClose, onSwitchToSignup }) => {

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [loginUser, { isLoading }] = useLoginUserMutation();
    const [googleLoginUser, { isLoading: googleLoading }] = useGoogleLoginUserMutation();

    // Forgot password states
    const [showReset, setShowReset] = useState(false);
    const [resetStep, setResetStep] = useState(1);
    const [resetEmail, setResetEmail] = useState("");
    const [resetOtp, setResetOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingLoginData, setPendingLoginData] = useState(null);

    const [showGoogleConfirmModal, setGoogleShowConfirmModal] = useState(false);
    const [pendingGoogleLoginData, setPendingGoogleLoginData] = useState(null);

    const [requestResetPassword, { isLoading: isRequestingOtp }] = useRequestResetPasswordMutation();
    const [verifyResetOtp, { isLoading: isVerifyingOtp }] = useVerifyResetOtpMutation();
    const [resetPasswordApi, { isLoading: isResettingPassword }] = useResetPasswordMutation();
    const [checkIsUserAlreadyLoggedIn, { isLoading: isCheckingLogin }] = useCheckIsUserAlreadyLoggedInMutation();
    const [logoutUser] = useLogoutUserMutation();
    const [otpTimer, setOtpTimer] = useState(0);
    const [otpExpired, setOtpExpired] = useState(false);
    const [resending, setResending] = useState(false);

    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const [modalContent, setModalContent] = useState({ title: "", content: [] });
    const [isClosing, setIsClosing] = useState(false);

    const { data: termsData } = useGetTermsOfServiceByCategoryQuery({ category: "login" });
    const { data: privacyData } = useGetPrivacyPolicyByCategoryQuery("login");

    useEffect(() => {
        let interval;
        if (resetStep === 2 && otpSent && otpTimer > 0 && !otpExpired) {
            interval = setInterval(() => {
                setOtpTimer((prev) => {
                    if (prev <= 1) {
                        setOtpExpired(true);
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resetStep, otpSent, otpTimer, otpExpired]);

    useEffect(() => {
        // Prevent scrolling on body when modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const notifySuccess = (message) => toast.success(message);
    const notifyError = (error) => toast.error(error);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowPolicyModal(false);
            setIsClosing(false);
        }, 200);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        };
    };

    const doLogin = async ({ identifier, password, forceLogin = false }) => {
        try {
            const res = await loginUser({
                identifier,
                password,
                app_platform: "web",
                login_type: "normal",
                forceLogin
            }).unwrap();

            notifySuccess("User logged in successfully");

            if (res.accessToken && res.refreshToken) {
                storeToken(res.accessToken, res.refreshToken, userType);
                const { access_token } = getStudentToken();
                dispatch(setUserToken({ access_token }));
                const userInfo = jwtDecode(res.accessToken);
                dispatch(setUserInfo(userInfo));
                initSocket(userInfo.id, "student", logoutUser, navigate, dispatch);
            }

            onClose();
            navigate("/student-dashboard");

        } catch (error) {
            notifyError(
                error.data?.error ||
                error.data?.message ||
                "Failed to login. Please try again."
            );
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!identifier || !password) {
            notifyError("All fields are required");
            return;
        }

        try {
            const data = await checkIsUserAlreadyLoggedIn(identifier).unwrap();

            if (data?.isUserAlreadyLoggedIn) {
                setPendingLoginData({ identifier, password });
                setShowConfirmModal(true);
                return;
            }

            await doLogin({ identifier, password });

        } catch (error) {
            notifyError(error.data?.error || error.data?.message || "Failed to login. Please try again.");
        }
    };

    const doGoogleLogin = async ({ token, forceLogin = false }) => {
        try {
            const res = await googleLoginUser({ idToken: token, app_platform: "web", forceLogin }).unwrap();
            notifySuccess("User logged in successfully");

            if (res.accessToken && res.refreshToken) {
                storeToken(res.accessToken, res.refreshToken, userType);
                const { access_token } = getStudentToken();
                dispatch(setUserToken({ access_token }));
                dispatch(setUserInfo(jwtDecode(res.accessToken)));
                const userInfo = jwtDecode(res.accessToken);
                initSocket(userInfo.id, "student", logoutUser, navigate, dispatch);
            }
            onClose();
            navigate("/student-dashboard");

        } catch (error) {
            notifyError(error.data?.error || error.data?.message || "Failed to login. Please try again.");
        }
    }

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const token = await result.user.getIdToken();
            const identifier = result.user.email;
            try {
                const data = await checkIsUserAlreadyLoggedIn(identifier).unwrap();

                if (data?.isUserAlreadyLoggedIn) {
                    setPendingGoogleLoginData({ identifier, token });
                    setGoogleShowConfirmModal(true);
                    return;
                }
                await doGoogleLogin({ token });

            } catch (error) {
                notifyError(error.data?.error || error.data?.message || "Failed to login. Please try again.");
            }
        } catch (error) {
            notifyError(error.data?.error || error.data?.message || "Failed to login. Please try again.");
        }
    };

    const handleSendOtp = async () => {
        if (!resetEmail) return notifyError("Please enter your registered email");
        try {
            const data = await requestResetPassword({ email: resetEmail }).unwrap();
            setOtpSent(true);
            setResetStep(2);
            setOtpExpired(false);
            setOtpTimer(Math.floor((data.expiresIn || 60000) / 1000));
            notifySuccess("OTP sent to your email");
        } catch (error) {
            const msg = error.data?.message || "Failed to send OTP. Please try again later.";
            notifyError(msg);
        }
    };

    const handleResendOtp = async () => {
        setResending(true);
        try {
            const data = await requestResetPassword({ email: resetEmail }).unwrap();
            setOtpSent(true);
            setOtpExpired(false);
            setOtpTimer(Math.floor((data.expiresIn || 60000) / 1000));
            notifySuccess("OTP resent to your email");
        } catch (error) {
            const msg = error.data?.message || "Failed to resend OTP. Please try again later.";
            notifyError(msg);
        }
        setResending(false);
    };

    const handleVerifyOtp = async () => {
        if (!resetOtp) return notifyError("Please enter the OTP");
        try {
            await verifyResetOtp({ email: resetEmail, otp: resetOtp }).unwrap();
            setOtpVerified(true);
            setResetStep(3);
            notifySuccess("OTP verified");
        } catch (error) {
            if (error.data?.expired) {
                setOtpExpired(true);
                setOtpTimer(0);
            }
            const msg = error.data?.message || "OTP verification failed. Please try again.";
            notifyError(msg);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) return notifyError("Please fill both password fields");
        if (newPassword !== confirmPassword) return notifyError("Passwords do not match");
        try {
            await resetPasswordApi({ email: resetEmail, otp: resetOtp, newPassword }).unwrap();
            notifySuccess("Password reset successful. Please login.");
            setShowReset(false);
            setResetStep(1);
            setResetEmail("");
            setResetOtp("");
            setNewPassword("");
            setConfirmPassword("");
            setOtpSent(false);
            setOtpVerified(false);
        } catch (error) {
            let msg = error.data?.message || "Failed to reset password. Please try again.";
            if (msg.includes("Password must be")) msg = "Password must be at least 8 characters, include uppercase, number, and special character.";
            notifyError(msg);
        }
    };

    const resetToLogin = () => {
        setShowReset(false);
        setResetStep(1);
        setResetEmail("");
        setResetOtp("");
        setNewPassword("");
        setConfirmPassword("");
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-[380px] bg-white rounded-3xl shadow-2xl p-6 transform transition-all duration-300 animate-in fade-in zoom-in-95">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-full transition-all duration-200"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-5 pt-1">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-black text-white rounded-xl mb-3 shadow-xl shadow-black/10">
                        {userType === "admin" ? (
                            <Shield className="w-5 h-5" />
                        ) : (
                            <User className="w-5 h-5" />
                        )}
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                        {showReset ? "Reset Password" : "Welcome Back"}
                    </h1>
                    <p className="text-gray-500 text-xs mt-1.5 font-medium">
                        {showReset
                            ? "Follow the steps to recover your account"
                            : userType === "admin"
                                ? "Please sign in to the administration portal"
                                : "Enter your details to access your account"}
                    </p>
                </div>

                {showReset ? (
                    <div className="space-y-4">
                        <button
                            onClick={resetToLogin}
                            className="flex items-center text-xs font-medium text-gray-500 hover:text-black transition-colors mb-2 -mt-2 mx-auto"
                        >
                            <ArrowLeft className="w-3 h-3 mr-1" />
                            Back to Sign In
                        </button>

                        {/* Step Indicator */}
                        <div className="flex justify-center gap-1.5 mb-4">
                            {[1, 2, 3].map((step) => (
                                <div
                                    key={step}
                                    className={`h-1 rounded-full transition-all duration-300 ${step <= resetStep ? "w-6 bg-black" : "w-1.5 bg-gray-200"
                                        }`}
                                />
                            ))}
                        </div>

                        {resetStep === 1 && (
                            <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
                                <MinimalInput
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    icon={Mail}
                                />
                                <PrimaryButton onClick={handleSendOtp} disabled={isRequestingOtp || !resetEmail}>
                                    {isRequestingOtp ? "Sending Code..." : "Send Reset Code"}
                                </PrimaryButton>
                            </div>
                        )}

                        {resetStep === 2 && (
                            <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-200">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={resetOtp}
                                        onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        className="w-full pl-10 py-2.5 bg-gray-50 border-2 border-transparent rounded-xl text-center text-lg font-bold tracking-[0.5em] text-gray-900
                    transition-all duration-200 focus:bg-white focus:border-black/5 focus:ring-4 focus:ring-gray-100 outline-none hover:bg-gray-100/50"
                                        placeholder="0000"
                                        maxLength={4}
                                    />
                                </div>

                                <div className="text-center text-xs">
                                    {otpTimer > 0 ? (
                                        <span className="text-gray-500 font-medium">Resend code in <span className="text-black">{otpTimer}s</span></span>
                                    ) : (
                                        <button
                                            onClick={handleResendOtp}
                                            disabled={resending}
                                            className="text-primary hover:text-black font-semibold transition-colors disabled:opacity-50"
                                        >
                                            Resend Code
                                        </button>
                                    )}
                                </div>

                                <PrimaryButton onClick={handleVerifyOtp} disabled={isVerifyingOtp || resetOtp.length !== 4}>
                                    {isVerifyingOtp ? "Verifying..." : "Verify Code"}
                                </PrimaryButton>
                            </div>
                        )}

                        {resetStep === 3 && (
                            <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
                                <MinimalInput
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="New password"
                                    icon={Lock}
                                    rightElement={
                                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="text-gray-400 hover:text-black transition-colors">
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    }
                                />
                                <MinimalInput
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm password"
                                    icon={Lock}
                                    rightElement={
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-gray-400 hover:text-black transition-colors">
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    }
                                />
                                <PrimaryButton onClick={handleResetPassword} disabled={isResettingPassword}>
                                    {isResettingPassword ? "Updating..." : "Update Password"}
                                </PrimaryButton>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Login Form */
                    <div className="space-y-4">
                        {/* Google Login */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={googleLoading}
                            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50/80 hover:border-gray-300 transition-all duration-200 group text-sm font-medium text-gray-700"
                        >
                            {googleLoading ? (
                                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <FcGoogle className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                            )}
                            <span>Continue with Google</span>
                        </button>

                        <div className="relative flex items-center justify-center py-1">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100"></div>
                            </div>
                            <span className="relative bg-white px-2 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                                Or continue with
                            </span>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-3">
                            <MinimalInput
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="Email or username"
                                icon={User}
                            />

                            <div className="space-y-1.5">
                                <MinimalInput
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    icon={Lock}
                                    rightElement={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-gray-400 hover:text-black transition-colors focus:outline-none p-1"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    }
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowReset(true)}
                                        className="text-[11px] font-medium text-gray-500 hover:text-black transition-colors"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            </div>

                            <PrimaryButton onClick={handleLogin} disabled={isLoading}>
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Signing in...
                                    </span>
                                ) : (
                                    "Sign In"
                                )}
                            </PrimaryButton>
                        </form>

                        <div className="text-center pt-1">
                            <p className="text-xs text-gray-500">
                                Don't have an account?{" "}
                                <button
                                    onClick={onSwitchToSignup}
                                    className="font-semibold text-black hover:text-megistic transition-colors inline-flex items-center gap-1 group"
                                >
                                    Create account
                                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                                </button>
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer Policy Links */}
                <div className="mt-4 pt-4 border-t border-gray-50 text-center">
                    <p className="text-[10px] text-gray-400 flex flex-wrap justify-center gap-x-1">
                        Privacy secured by
                        <span className="font-semibold text-gray-500">Queekies</span>
                        •
                        <Link
                            to="/terms-of-service"
                            target="_blank"
                            className="cursor-pointer border-b border-gray-400"
                        >
                            Terms & Conditions
                        </Link>
                        &
                        <Link
                            to="/privacy-policy"
                            target="_blank"
                            className="cursor-pointer border-b border-gray-400"
                        >
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>

            {/* Nested modals for policies and confirmations */}
            {showPolicyModal && (
                <div
                    className={`fixed inset-0 z-[110] flex items-center justify-center p-4 transition-all duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                    onClick={handleBackdropClick}
                >
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                    <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col transform transition-all duration-200 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div className="flex items-center space-x-3">
                                <h2 className="text-xl font-bold text-gray-900">{modalContent.title}</h2>
                            </div>
                            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="prose prose-gray max-w-none text-sm leading-relaxed">
                                {modalContent.content.map((html, index) => (
                                    <div key={index} className="mb-4" dangerouslySetInnerHTML={{ __html: html }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showConfirmModal && (
                <div className="fixed inset-0 flex items-center justify-center z-[120] p-4">

                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"></div>

                    <div className="relative bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Session Conflict</h2>
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                            You are currently logged in on another device. Continuing will end that session and log you in here.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={async () => {
                                setShowConfirmModal(false);
                                if (pendingLoginData) await doLogin({ ...pendingLoginData, forceLogin: true });
                            }} className="flex-1 py-3 px-4 rounded-xl bg-black text-white font-medium hover:opacity-90 transition-opacity">Continue Login</button>
                        </div>
                    </div>
                </div>
            )}

            {showGoogleConfirmModal && (
                <div className="fixed inset-0 flex items-center justify-center z-[120] p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"></div>

                    <div className="relative bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Session Conflict</h2>
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                            You are currently logged in on another device. Continuing will end that session and log you in here.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setGoogleShowConfirmModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={async () => {
                                setGoogleShowConfirmModal(false);
                                if (pendingGoogleLoginData) await doGoogleLogin({ ...pendingGoogleLoginData, forceLogin: true });
                            }} className="flex-1 py-3 px-4 rounded-xl bg-black text-white font-medium hover:opacity-90 transition-opacity">Continue Login</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default LoginModal;
