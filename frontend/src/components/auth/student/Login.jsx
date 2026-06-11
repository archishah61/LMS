// /* eslint-disable react/no-unescaped-entities */
// /* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable react/prop-types */
// /* eslint-disable no-unused-vars */
// import React, { useEffect, useState } from "react";
// import { useDispatch } from "react-redux";
// import {
//   useGoogleLoginUserMutation,
//   useLoginUserMutation,
//   useRequestResetPasswordMutation,
//   useVerifyResetOtpMutation,
//   useResetPasswordMutation,
//   useCheckIsUserAlreadyLoggedInMutation,
// } from "../../../services/userAuthApi";
// import toast from "react-hot-toast";
// import { setUserToken } from "../../../features/authSlice";
// import { jwtDecode } from "jwt-decode";
// import { storeToken, getStudentToken, isTokenExpired, getTokenExpiry, refreshUserToken, removeToken } from "../../../services/CookieService";
// import { setUserInfo } from "../../../features/userSlice";
// import { Link, useNavigate } from "react-router-dom";
// import { auth, googleProvider } from "../../../firebase";
// import { signInWithPopup } from "firebase/auth";
// import { FcGoogle } from "react-icons/fc"; // Import Google icon
// import { Eye, EyeOff, ArrowLeft, Mail, Lock, User, Shield } from "lucide-react";

// import { useGetTermsOfServiceByCategoryQuery } from "../../../services/LegalPages/termsOfServices";
// import { useGetPrivacyPolicyByCategoryQuery } from "../../../services/LegalPages/privacyPolicy";
// import { X, FileText, ExternalLink } from 'lucide-react';
// import { initSocket } from "../../../services/socket";


// const Login = ({ userType }) => {
//   const [identifier, setIdentifier] = useState("");
//   const [password, setPassword] = useState("");
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const [loginUser, { isLoading }] = useLoginUserMutation();
//   const [googleLoginUser, { isLoading: googleLoading }] =
//     useGoogleLoginUserMutation();

//   // Forgot password states
//   const [showReset, setShowReset] = useState(false);
//   const [resetStep, setResetStep] = useState(1); // 1: email, 2: otp, 3: new password
//   const [resetEmail, setResetEmail] = useState("");
//   const [resetOtp, setResetOtp] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [otpSent, setOtpSent] = useState(false);
//   const [otpVerified, setOtpVerified] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const [showConfirmModal, setShowConfirmModal] = useState(false);
//   const [pendingLoginData, setPendingLoginData] = useState(null);

//   const [showGoogleConfirmModal, setGoogleShowConfirmModal] = useState(false);
//   const [pendingGoogleLoginData, setPendingGoogleLoginData] = useState(null);

//   const [requestResetPassword, { isLoading: isRequestingOtp }] = useRequestResetPasswordMutation();
//   const [verifyResetOtp, { isLoading: isVerifyingOtp }] = useVerifyResetOtpMutation();
//   const [resetPasswordApi, { isLoading: isResettingPassword }] = useResetPasswordMutation();
//   const [checkIsUserAlreadyLoggedIn, { isLoading: isCheckingLogin }] = useCheckIsUserAlreadyLoggedInMutation();
//   // OTP timer states
//   const [otpTimer, setOtpTimer] = useState(0); // in seconds
//   const [otpExpired, setOtpExpired] = useState(false);
//   const [resending, setResending] = useState(false);

//   const [showPolicyModal, setShowPolicyModal] = useState(false);
//   const [modalContent, setModalContent] = useState({ title: "", content: [] });
//   const [isClosing, setIsClosing] = useState(false);

//   const {
//     data: termsData,
//     isLoading: termsLoading,
//     error: termsError,
//   } = useGetTermsOfServiceByCategoryQuery({ category: "login" });

//   const {
//     data: privacyData,
//     isLoading: privacyLoading,
//     error: privacyError,
//   } = useGetPrivacyPolicyByCategoryQuery("login");

//   // OTP countdown effect
//   useEffect(() => {
//     let interval;
//     if (resetStep === 2 && otpSent && otpTimer > 0 && !otpExpired) {
//       interval = setInterval(() => {
//         setOtpTimer((prev) => {
//           if (prev <= 1) {
//             setOtpExpired(true);
//             clearInterval(interval);
//             return 0;
//           }
//           return prev - 1;
//         });
//       }, 1000);
//     }
//     return () => clearInterval(interval);
//   }, [resetStep, otpSent, otpTimer, otpExpired]);

//   // Check if the user is already logged in
//   useEffect(() => {
//     const { access_token, refresh_token } = getStudentToken();
//     if (refresh_token && isTokenExpired(refresh_token)) {
//       removeToken("user");
//       // Optionally, dispatch logout and redirect
//       navigate("/login");
//       return;
//     }
//     if (access_token) {
//       try {
//         const decodedToken = jwtDecode(access_token);
//         if (decodedToken && decodedToken.role) {
//           dispatch(setUserToken({ access_token }));
//           dispatch(setUserInfo(decodedToken));
//           navigate(decodedToken.role === "admin" ? "/admin/dashboard" : "/student-dashboard");
//         }
//       } catch (error) {
//         console.error("Invalid token", error);
//       }
//     }
//   }, [navigate, userType]);

//   const notifySuccess = (message) => toast.success(message);
//   const notifyError = (error) => toast.error(error);

//   const handleClose = () => {
//     setIsClosing(true);
//     setTimeout(() => {
//       setShowPolicyModal(false);
//       setIsClosing(false);
//     }, 200);
//   };

//   const handleBackdropClick = (e) => {
//     if (e.target === e.currentTarget) {
//       handleClose();
//     };
//   };

//   const doLogin = async ({ identifier, password, forceLogin = false }) => {
//     try {
//       const res = await loginUser({
//         identifier,
//         password,
//         app_platform: "web",
//         login_type: "normal",
//         forceLogin
//       }).unwrap();

//       notifySuccess("User logged in successfully");

//       if (res.accessToken && res.refreshToken) {
//         storeToken(res.accessToken, res.refreshToken, userType);
//         const { access_token } = getStudentToken();
//         dispatch(setUserToken({ access_token }));
//         const userInfo = jwtDecode(res.accessToken);
//         dispatch(setUserInfo(userInfo));

//         // 🔑 Register socket session
//         initSocket(userInfo.id, dispatch);
//       }

//       setTimeout(() => {
//         navigate("/student-dashboard");
//       }, 1500);
//     } catch (error) {
//       notifyError(
//         error.data?.error ||
//         error.data?.message ||
//         "Failed to login. Please try again."
//       );
//     }
//   };

//   const handleLogin = async (e) => {
//     e.preventDefault();

//     if (!identifier || !password) {
//       notifyError("All fields are required");
//       return;
//     }

//     try {
//       const data = await checkIsUserAlreadyLoggedIn(identifier).unwrap();

//       if (data?.isUserAlreadyLoggedIn) {
//         // Store the login payload temporarily
//         setPendingLoginData({ identifier, password });
//         setShowConfirmModal(true);
//         return; // Stop here, wait for user confirmation
//       }

//       // Otherwise proceed with login directly
//       await doLogin({ identifier, password });

//     } catch (error) {
//       notifyError(error.data?.error || error.data?.message || "Failed to login. Please try again.");
//     }
//   };

//   const doGoogleLogin = async ({ token, forceLogin = false }) => {
//     try {

//       const res = await googleLoginUser({ idToken: token, app_platform: "web", forceLogin }).unwrap();
//       notifySuccess("User logged in successfully");

//       if (res.accessToken && res.refreshToken) {
//         storeToken(res.accessToken, res.refreshToken, userType);
//         const { access_token } = getStudentToken();
//         dispatch(setUserToken({ access_token }));
//         dispatch(setUserInfo(jwtDecode(res.accessToken)));
//         // Set up timer to refresh access token 1 min before expiry

//         const userInfo = jwtDecode(res.accessToken);
//         initSocket(userInfo.id, dispatch);
//       }
//       // Redirect based on role
//       setTimeout(() => {
//         navigate("/student-dashboard");
//       }, 1500);

//     } catch (error) {
//       notifyError(error.data?.error || error.data?.message || "Failed to login. Please try again.");
//     }
//   }


//   const handleGoogleLogin = async () => {
//     try {
//       const result = await signInWithPopup(auth, googleProvider);
//       const token = await result.user.getIdToken();
//       const identifier = result.user.email;
//       try {
//         const data = await checkIsUserAlreadyLoggedIn(identifier).unwrap();

//         if (data?.isUserAlreadyLoggedIn) {
//           // Store the login payload temporarily
//           setPendingGoogleLoginData({ identifier, token });
//           setGoogleShowConfirmModal(true);
//           return; // Stop here, wait for user confirmation
//         }

//         // Otherwise proceed with login directly
//         await doGoogleLogin({ token });

//       } catch (error) {
//         notifyError(error.data?.error || error.data?.message || "Failed to login. Please try again.");
//       }


//     } catch (error) {
//       notifyError(error.data?.error || error.data?.message || "Failed to login. Please try again.");
//     }
//   };

//   // Handle send OTP (request + timer)
//   const handleSendOtp = async () => {
//     if (!resetEmail) return notifyError("Please enter your registered email");
//     try {
//       const data = await requestResetPassword({ email: resetEmail }).unwrap();
//       setOtpSent(true);
//       setResetStep(2);
//       setOtpExpired(false);
//       setOtpTimer(Math.floor((data.expiresIn || 60000) / 1000)); // default 60s
//       notifySuccess("OTP sent to your email");
//     } catch (error) {
//       const msg = error.data?.message || "Failed to send OTP. Please try again later.";
//       notifyError(msg);
//     }
//   };

//   // Resend OTP logic
//   const handleResendOtp = async () => {
//     setResending(true);
//     try {
//       const data = await requestResetPassword({ email: resetEmail }).unwrap();
//       setOtpSent(true);
//       setOtpExpired(false);
//       setOtpTimer(Math.floor((data.expiresIn || 60000) / 1000));
//       notifySuccess("OTP resent to your email");
//     } catch (error) {
//       const msg = error.data?.message || "Failed to resend OTP. Please try again later.";
//       notifyError(msg);
//     }
//     setResending(false);
//   };

//   // Handle verify OTP
//   const handleVerifyOtp = async () => {
//     if (!resetOtp) return notifyError("Please enter the OTP");
//     try {
//       await verifyResetOtp({ email: resetEmail, otp: resetOtp }).unwrap();
//       setOtpVerified(true);
//       setResetStep(3);
//       notifySuccess("OTP verified");
//     } catch (error) {
//       // If expired, show resend button
//       if (error.data?.expired) {
//         setOtpExpired(true);
//         setOtpTimer(0);
//       }
//       const msg = error.data?.message || "OTP verification failed. Please try again.";
//       notifyError(msg);
//     }
//   };
//   const handleResetPassword = async () => {
//     if (!newPassword || !confirmPassword) return notifyError("Please fill both password fields");
//     if (newPassword !== confirmPassword) return notifyError("Passwords do not match");
//     try {
//       await resetPasswordApi({ email: resetEmail, otp: resetOtp, newPassword }).unwrap();
//       notifySuccess("Password reset successful. Please login.");
//       setShowReset(false);
//       setResetStep(1);
//       setResetEmail("");
//       setResetOtp("");
//       setNewPassword("");
//       setConfirmPassword("");
//       setOtpSent(false);
//       setOtpVerified(false);
//     } catch (error) {
//       let msg = error.data?.message || "Failed to reset password. Please try again.";
//       if (msg.includes("Password must be")) msg = "Password must be at least 8 characters, include uppercase, number, and special character.";
//       notifyError(msg);
//     }
//   };

//   const resetToLogin = () => {
//     setShowReset(false);
//     setResetStep(1);
//     setResetEmail("");
//     setResetOtp("");
//     setNewPassword("");
//     setConfirmPassword("");
//   };


//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
//       <div className="w-full max-w-md">
//         {/* Logo/Header Section */}
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4 shadow-lg">
//             {userType === "admin" ? (
//               <Shield className="w-8 h-8 text-white" />
//             ) : (
//               <User className="w-8 h-8 text-white" />
//             )}
//           </div>
//           <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//             Welcome Back
//           </h1>
//           <p className="text-gray-600 mt-2">
//             {userType === "admin" ? "Admin Portal Access" : "Sign in to your account"}
//           </p>
//         </div>

//         {/* Main Card */}
//         <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 transition-all duration-300 hover:shadow-3xl">
//           {showReset ? (
//             <div className="space-y-6">
//               {/* Reset Password Header */}
//               <div className="text-center">
//                 <button
//                   onClick={resetToLogin}
//                   className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
//                 >
//                   <ArrowLeft className="w-4 h-4 mr-2" />
//                   Back to Login
//                 </button>
//                 <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
//                 <p className="text-gray-600 mt-2">
//                   {resetStep === 1 && "Enter your email to receive OTP"}
//                   {resetStep === 2 && "Enter the verification code"}
//                   {resetStep === 3 && "Create your new password"}
//                 </p>
//               </div>

//               {/* Step Indicator */}
//               <div className="flex justify-center space-x-2">
//                 {[1, 2, 3].map((step) => (
//                   <div
//                     key={step}
//                     className={`w-3 h-3 rounded-full transition-all duration-300 ${step <= resetStep
//                       ? "bg-gradient-to-r from-blue-500 to-purple-500"
//                       : "bg-gray-300"
//                       }`}
//                   />
//                 ))}
//               </div>

//               {/* Reset Form Steps */}
//               <div className="space-y-4">
//                 {resetStep === 1 && (
//                   <div className="space-y-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Email Address
//                       </label>
//                       <div className="relative">
//                         <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                         <input
//                           type="email"
//                           value={resetEmail}
//                           onChange={(e) => setResetEmail(e.target.value)}
//                           className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
//                           placeholder="Enter your registered email"
//                         />
//                       </div>
//                     </div>
//                     <button
//                       onClick={handleSendOtp}
//                       disabled={isRequestingOtp || !resetEmail}
//                       className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
//                     >
//                       {isRequestingOtp ? (
//                         <div className="flex items-center justify-center">
//                           <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
//                           Sending OTP...
//                         </div>
//                       ) : (
//                         "Send OTP"
//                       )}
//                     </button>
//                   </div>
//                 )}

//                 {resetStep === 2 && (
//                   <div className="space-y-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Verification Code
//                       </label>
//                       <input
//                         type="text"
//                         value={resetOtp}
//                         onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
//                         className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-center text-2xl font-mono tracking-widest"
//                         placeholder="0000"
//                         maxLength={4}
//                         disabled={otpExpired}
//                       />
//                       <p className="text-sm text-gray-500 mt-2 text-center">
//                         Check your email for the 4-digit code<br />
//                         {otpTimer > 0 && !otpExpired && (
//                           <span>OTP expires in <b>{otpTimer}s</b></span>
//                         )}
//                         {otpExpired && (
//                           <span className="text-red-500">OTP expired. Please resend OTP.</span>
//                         )}
//                       </p>
//                     </div>
//                     <button
//                       onClick={handleVerifyOtp}
//                       disabled={isVerifyingOtp || resetOtp.length !== 4 || otpExpired}
//                       className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
//                     >
//                       {isVerifyingOtp ? (
//                         <div className="flex items-center justify-center">
//                           <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
//                           Verifying...
//                         </div>
//                       ) : (
//                         "Verify OTP"
//                       )}
//                     </button>
//                     {otpExpired && (
//                       <button
//                         onClick={handleResendOtp}
//                         disabled={resending}
//                         className="w-full mt-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
//                       >
//                         {resending ? "Resending..." : "Resend OTP"}
//                       </button>
//                     )}
//                   </div>
//                 )}

//                 {resetStep === 3 && (
//                   <div className="space-y-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         New Password
//                       </label>
//                       <div className="relative">
//                         <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                         <input
//                           type={showNewPassword ? "text" : "password"}
//                           value={newPassword}
//                           onChange={(e) => setNewPassword(e.target.value)}
//                           className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
//                           placeholder="Enter new password"
//                         />
//                         <button
//                           type="button"
//                           onClick={() => setShowNewPassword(!showNewPassword)}
//                           className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
//                         >
//                           {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//                         </button>
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Confirm Password
//                       </label>
//                       <div className="relative">
//                         <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                         <input
//                           type={showConfirmPassword ? "text" : "password"}
//                           value={confirmPassword}
//                           onChange={(e) => setConfirmPassword(e.target.value)}
//                           className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
//                           placeholder="Confirm new password"
//                         />
//                         <button
//                           type="button"
//                           onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                           className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
//                         >
//                           {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//                         </button>
//                       </div>
//                     </div>
//                     <button
//                       onClick={handleResetPassword}
//                       disabled={isResettingPassword || !newPassword || !confirmPassword}
//                       className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
//                     >
//                       {isResettingPassword ? (
//                         <div className="flex items-center justify-center">
//                           <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
//                           Resetting...
//                         </div>
//                       ) : (
//                         "Reset Password"
//                       )}
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </div>
//           ) : (
//             <div className="space-y-6">
//               {/* Google Login Button */}
//               <button
//                 onClick={handleGoogleLogin}
//                 disabled={googleLoading}
//                 className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {googleLoading ? (
//                   <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
//                 ) : (
//                   <FcGoogle size={20} />
//                 )}
//                 <span className="font-medium text-gray-700">
//                   {googleLoading ? "Signing in..." : "Continue with Google"}
//                 </span>
//               </button>

//               {/* Divider */}
//               <div className="relative">
//                 <div className="absolute inset-0 flex items-center">
//                   <div className="w-full border-t border-gray-200"></div>
//                 </div>
//                 <div className="relative flex justify-center text-sm">
//                   <span className="px-4 bg-white text-gray-500">or continue with email</span>
//                 </div>
//               </div>

//               {/* Login Form */}
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Email or Username
//                   </label>
//                   <div className="relative">
//                     <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                     <input
//                       type="text"
//                       value={identifier}
//                       onChange={(e) => setIdentifier(e.target.value)}
//                       className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
//                       placeholder="Enter your email or username"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Password
//                   </label>
//                   <div className="relative">
//                     <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                     <input
//                       type={showPassword ? "text" : "password"}
//                       value={password}
//                       onChange={(e) => setPassword(e.target.value)}
//                       className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
//                       placeholder="Enter your password"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPassword(!showPassword)}
//                       className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
//                     >
//                       {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//                     </button>
//                   </div>
//                 </div>

//                 <button
//                   onClick={handleLogin}
//                   disabled={isLoading}
//                   className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
//                 >
//                   {isLoading ? (
//                     <div className="flex items-center justify-center">
//                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
//                       Signing in...
//                     </div>
//                   ) : (
//                     "Sign In"
//                   )}
//                 </button>
//               </div>

//               {/* Footer Links */}
//               <div className="text-center space-y-3">
//                 <button
//                   onClick={() => setShowReset(true)}
//                   className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
//                 >
//                   Forgot your password?
//                 </button>
//                 <p className="text-gray-600 text-sm">
//                   Don't have an account?{" "}
//                   <a href="/signup" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
//                     Sign up here
//                   </a>
//                 </p>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Additional Info */}
//         <div className="text-center mt-6 text-xs text-gray-500 space-y-2">
//           <p>
//             By signing in, you agree to our{" "}
//             <button
//               onClick={() => {
//                 const activeSentences =
//                   termsData?.data
//                     ?.filter((item) => item.status === "active")
//                     ?.flatMap((item) => item.sentences) || [];
//                 setModalContent({
//                   title: "Terms of Service",
//                   content: activeSentences.length > 0 ? activeSentences : ["There is no data in Terms of Service"],
//                 });
//                 setShowPolicyModal(true);
//               }}
//               className="text-blue-600 hover:underline"
//             >
//               Terms of Service
//             </button>{" "}
//             and{" "}
//             <button
//               onClick={() => {
//                 const sentences = privacyData?.data
//                   ?.filter((item) => item.status === "active")
//                   ?.flatMap((item) => item.sentences) || [];
//                 setModalContent({
//                   title: "Privacy Policy",
//                   content: sentences.length > 0 ? sentences : ["There is no data in Privacy Policy"],
//                 });
//                 setShowPolicyModal(true);
//               }}
//               className="text-blue-600 hover:underline"
//             >
//               Privacy Policy
//             </button>.
//           </p>
//         </div>
//       </div>

//       {showPolicyModal && (
//         <div
//           className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'
//             }`}
//           onClick={handleBackdropClick}
//         >
//           {/* Backdrop with blur effect */}
//           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

//           {/* Modal Container */}
//           <div
//             className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col transform transition-all duration-200 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
//               }`}
//           >
//             {/* Header */}
//             <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
//               <div className="flex items-center space-x-3">
//                 <div className="p-2 bg-blue-100 rounded-lg">
//                   <FileText className="w-5 h-5 text-blue-600" />
//                 </div>
//                 <div>
//                   <h2 className="text-xl font-bold text-gray-900">{modalContent.title}</h2>
//                 </div>
//               </div>

//               <button
//                 onClick={handleClose}
//                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
//                 aria-label="Close modal"
//               >
//                 <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
//               </button>
//             </div>

//             {/* Content */}
//             <div className="flex-1 overflow-y-auto p-6">
//               <div className="prose prose-gray max-w-none">
//                 {modalContent.content.map((html, index) => (
//                   <div
//                     key={index}
//                     className="mb-6 flex items-start space-x-4"
//                   >
//                     <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
//                       {index + 1}
//                     </div>
//                     <div
//                       className="flex-1 text-gray-700 leading-relaxed pt-1"
//                       dangerouslySetInnerHTML={{ __html: html }}
//                     />
//                   </div>
//                 ))}

//                 {/* Additional styled content */}
//                 <div className="mt-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
//                   <h3 className="font-semibold text-blue-900 mb-2">Important Notice</h3>
//                   <p className="text-blue-800 text-sm">
//                     By continuing to use our service, you acknowledge that you have read and understood our privacy policy.
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Footer */}
//             <div className="flex items-center justify-end p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
//               <div className="flex space-x-3">
//                 <button
//                   onClick={handleClose}
//                   className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleClose}
//                   className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
//                 >
//                   I Understand
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {showConfirmModal && (
//         <div className="fixed inset-0 flex items-center justify-center bg-gray-900/70 backdrop-blur-md z-50 animate-in fade-in duration-300">
//           <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-0 w-full max-w-lg mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out overflow-hidden">

//             {/* Header Section */}
//             <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-8 py-6 border-b border-amber-100/50">
//               <div className="flex items-center gap-4">
//                 <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center shadow-sm">
//                   <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
//                   </svg>
//                 </div>
//                 <div>
//                   <h2 className="text-xl font-semibold text-gray-900 mb-1">
//                     Session Conflict Detected
//                   </h2>
//                   <p className="text-sm text-gray-600">
//                     Multiple login attempt detected
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Content Section */}
//             <div className="px-8 py-6">
//               <div className="mb-6">
//                 <p className="text-gray-700 leading-relaxed mb-4">
//                   You're currently logged in on another device. Continuing will automatically
//                   sign you out from that session and log you in here instead.
//                 </p>

//                 <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
//                   <div className="flex items-start gap-3">
//                     <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                     <p className="text-sm text-gray-700">
//                       This action will terminate your existing session for security purposes.
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* Action Buttons */}
//               <div className="flex gap-3">
//                 <button
//                   onClick={() => {
//                     setShowConfirmModal(false);
//                     setPendingLoginData(null);
//                     notifyError("Login cancelled. You remain logged in on your old device.");
//                   }}
//                   className="flex-1 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-sm"

//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={async () => {
//                     setShowConfirmModal(false);
//                     if (pendingLoginData) {
//                       await doLogin({ ...pendingLoginData, forceLogin: true });
//                       setPendingLoginData(null);
//                     }
//                   }}
//                   className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
//                 >
//                   Continue Login
//                 </button>
//               </div>
//             </div>

//             {/* Subtle bottom accent */}
//             <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400"></div>
//           </div>
//         </div>
//       )}

//       {showGoogleConfirmModal && (
//         <div className="fixed inset-0 flex items-center justify-center bg-gray-900/70 backdrop-blur-md z-50 animate-in fade-in duration-300">
//           <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-0 w-full max-w-lg mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out overflow-hidden">

//             {/* Header Section */}
//             <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-8 py-6 border-b border-amber-100/50">
//               <div className="flex items-center gap-4">
//                 <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center shadow-sm">
//                   <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
//                   </svg>
//                 </div>
//                 <div>
//                   <h2 className="text-xl font-semibold text-gray-900 mb-1">
//                     Session Conflict Detected
//                   </h2>
//                   <p className="text-sm text-gray-600">
//                     Multiple login attempt detected
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Content Section */}
//             <div className="px-8 py-6">
//               <div className="mb-6">
//                 <p className="text-gray-700 leading-relaxed mb-4">
//                   You're currently logged in on another device. Continuing will automatically
//                   sign you out from that session and log you in here instead.
//                 </p>

//                 <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
//                   <div className="flex items-start gap-3">
//                     <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                     <p className="text-sm text-gray-700">
//                       This action will terminate your existing session for security purposes.
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* Action Buttons */}
//               <div className="flex gap-3">
//                 <button
//                   onClick={() => {
//                     setGoogleShowConfirmModal(false);
//                     setPendingGoogleLoginData(null);
//                     notifyError("Login cancelled. You remain logged in on your old device.");
//                   }}
//                   className="flex-1 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-sm"

//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={async () => {
//                     setShowConfirmModal(false);
//                     if (pendingGoogleLoginData) {

//                       await doGoogleLogin({ ...pendingGoogleLoginData, forceLogin: true });
//                       setPendingGoogleLoginData(null);
//                     }
//                   }}
//                   className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
//                 >
//                   Continue Login
//                 </button>
//               </div>
//             </div>

//             {/* Subtle bottom accent */}
//             <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400"></div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Login;


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
} from "../../../services/userAuthApi";
import toast from "react-hot-toast";
import { setUserToken } from "../../../features/authSlice";
import { jwtDecode } from "jwt-decode";
import { storeToken, getStudentToken, isTokenExpired, getTokenExpiry, refreshUserToken, removeToken } from "../../../services/CookieService";
import { setUserInfo } from "../../../features/userSlice";
import { Link, useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../../../firebase";
import { signInWithPopup } from "firebase/auth";
import { FcGoogle } from "react-icons/fc"; // Import Google icon
import { Eye, EyeOff, ArrowLeft, Mail, Lock, User, Shield, Home } from "lucide-react";

import { useGetTermsOfServiceByCategoryQuery } from "../../../services/LegalPages/termsOfServices";
import { useGetPrivacyPolicyByCategoryQuery } from "../../../services/LegalPages/privacyPolicy";
import { X, FileText, ExternalLink } from 'lucide-react';
import { initSocket } from "../../../services/socket";


const Login = ({ userType }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loginUser, { isLoading }] = useLoginUserMutation();
  const [googleLoginUser, { isLoading: googleLoading }] =
    useGoogleLoginUserMutation();

  // Forgot password states
  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: otp, 3: new password
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
  // OTP timer states
  const [otpTimer, setOtpTimer] = useState(0); // in seconds
  const [otpExpired, setOtpExpired] = useState(false);
  const [resending, setResending] = useState(false);

  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", content: [] });
  const [isClosing, setIsClosing] = useState(false);

  const {
    data: termsData,
    isLoading: termsLoading,
    error: termsError,
  } = useGetTermsOfServiceByCategoryQuery({ category: "login" });

  const {
    data: privacyData,
    isLoading: privacyLoading,
    error: privacyError,
  } = useGetPrivacyPolicyByCategoryQuery("login");

  // OTP countdown effect
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

  // Check if the user is already logged in
  useEffect(() => {
    const { access_token, refresh_token } = getStudentToken();
    if (refresh_token && isTokenExpired(refresh_token)) {
      removeToken("user");
      // Optionally, dispatch logout and redirect
      navigate("/login");
      return;
    }
    if (access_token) {
      try {
        const decodedToken = jwtDecode(access_token);
        if (decodedToken && decodedToken.role) {
          dispatch(setUserToken({ access_token }));
          dispatch(setUserInfo(decodedToken));
          navigate(decodedToken.role === "admin" ? "/admin/dashboard" : "/student-dashboard");
        }
      } catch (error) {
        console.error("Invalid token", error);
      }
    }
  }, [navigate, userType]);

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

        // 🔑 Register socket session
        initSocket(userInfo.id, dispatch);
      }

      setTimeout(() => {
        navigate("/student-dashboard");
      }, 1500);
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
        // Store the login payload temporarily
        setPendingLoginData({ identifier, password });
        setShowConfirmModal(true);
        return; // Stop here, wait for user confirmation
      }

      // Otherwise proceed with login directly
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
        // Set up timer to refresh access token 1 min before expiry

        const userInfo = jwtDecode(res.accessToken);
        initSocket(userInfo.id, dispatch);
      }
      // Redirect based on role
      setTimeout(() => {
        navigate("/student-dashboard");
      }, 1500);

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
          // Store the login payload temporarily
          setPendingGoogleLoginData({ identifier, token });
          setGoogleShowConfirmModal(true);
          return; // Stop here, wait for user confirmation
        }

        // Otherwise proceed with login directly
        await doGoogleLogin({ token });

      } catch (error) {
        notifyError(error.data?.error || error.data?.message || "Failed to login. Please try again.");
      }


    } catch (error) {
      notifyError(error.data?.error || error.data?.message || "Failed to login. Please try again.");
    }
  };

  // Handle send OTP (request + timer)
  const handleSendOtp = async () => {
    if (!resetEmail) return notifyError("Please enter your registered email");
    try {
      const data = await requestResetPassword({ email: resetEmail }).unwrap();
      setOtpSent(true);
      setResetStep(2);
      setOtpExpired(false);
      setOtpTimer(Math.floor((data.expiresIn || 60000) / 1000)); // default 60s
      notifySuccess("OTP sent to your email");
    } catch (error) {
      const msg = error.data?.message || "Failed to send OTP. Please try again later.";
      notifyError(msg);
    }
  };

  // Resend OTP logic
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

  // Handle verify OTP
  const handleVerifyOtp = async () => {
    if (!resetOtp) return notifyError("Please enter the OTP");
    try {
      await verifyResetOtp({ email: resetEmail, otp: resetOtp }).unwrap();
      setOtpVerified(true);
      setResetStep(3);
      notifySuccess("OTP verified");
    } catch (error) {
      // If expired, show resend button
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 relative">
      {/* Back Button - Top Right */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-200 text-gray-700 hover:text-gray-900 z-10"
      >
        <Home className="w-4 h-4" />
        <span className="text-sm font-medium">Home</span>
      </button>

      <div className="w-full max-w-md">
        {/* Logo/Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-3 sm:mb-4 shadow-lg">
            {userType === "admin" ? (
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            ) : (
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            {userType === "admin" ? "Admin Portal Access" : "Sign in to your account"}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-white/20 p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl sm:hover:shadow-3xl">
          {showReset ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Reset Password Header */}
              <div className="text-center">
                <button
                  onClick={resetToLogin}
                  className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 transition-colors text-sm sm:text-base"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </button>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Reset Password</h2>
                <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                  {resetStep === 1 && "Enter your email to receive OTP"}
                  {resetStep === 2 && "Enter the verification code"}
                  {resetStep === 3 && "Create your new password"}
                </p>
              </div>

              {/* Step Indicator */}
              <div className="flex justify-center space-x-2">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${step <= resetStep
                      ? "bg-gradient-to-r from-blue-500 to-purple-500"
                      : "bg-gray-300"
                      }`}
                  />
                ))}
              </div>

              {/* Reset Form Steps */}
              <div className="space-y-3 sm:space-y-4">
                {resetStep === 1 && (
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                          placeholder="Enter your registered email"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSendOtp}
                      disabled={isRequestingOtp || !resetEmail}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 sm:py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] text-sm sm:text-base"
                    >
                      {isRequestingOtp ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                          Sending OTP...
                        </div>
                      ) : (
                        "Send OTP"
                      )}
                    </button>
                  </div>
                )}

                {resetStep === 2 && (
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-center text-xl sm:text-2xl font-mono tracking-widest"
                        placeholder="0000"
                        maxLength={4}
                        disabled={otpExpired}
                      />
                      <p className="text-xs sm:text-sm text-gray-500 mt-2 text-center">
                        Check your email for the 4-digit code<br />
                        {otpTimer > 0 && !otpExpired && (
                          <span>OTP expires in <b>{otpTimer}s</b></span>
                        )}
                        {otpExpired && (
                          <span className="text-red-500">OTP expired. Please resend OTP.</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={handleVerifyOtp}
                      disabled={isVerifyingOtp || resetOtp.length !== 4 || otpExpired}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 sm:py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] text-sm sm:text-base"
                    >
                      {isVerifyingOtp ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                          Verifying...
                        </div>
                      ) : (
                        "Verify OTP"
                      )}
                    </button>
                    {otpExpired && (
                      <button
                        onClick={handleResendOtp}
                        disabled={resending}
                        className="w-full mt-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base"
                      >
                        {resending ? "Resending..." : "Resend OTP"}
                      </button>
                    )}
                  </div>
                )}

                {resetStep === 3 && (
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-10 sm:pl-11 pr-10 sm:pr-11 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-10 sm:pl-11 pr-10 sm:pr-11 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleResetPassword}
                      disabled={isResettingPassword || !newPassword || !confirmPassword}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 sm:py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] text-sm sm:text-base"
                    >
                      {isResettingPassword ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                          Resetting...
                        </div>
                      ) : (
                        "Reset Password"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {/* Google Login Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 py-2.5 sm:py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {googleLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-gray-600"></div>
                ) : (
                  <FcGoogle size={18} className="sm:w-5 sm:h-5" />
                )}
                <span className="font-medium text-gray-700">
                  {googleLoading ? "Signing in..." : "Continue with Google"}
                </span>
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span className="px-2 sm:px-4 bg-white text-gray-500">or continue with email</span>
                </div>
              </div>

              {/* Login Form */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email or Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                      placeholder="Enter your email or username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 sm:pl-11 pr-10 sm:pr-11 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 sm:py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] text-sm sm:text-base"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>

              {/* Footer Links */}
              <div className="text-center space-y-2 sm:space-y-3">
                <button
                  onClick={() => setShowReset(true)}
                  className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium transition-colors"
                >
                  Forgot your password?
                </button>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Don't have an account?{" "}
                  <a href="/signup" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    Sign up here
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-4 sm:mt-6 text-xs text-gray-500 space-y-1 sm:space-y-2">
          <p className="text-xs">
            By signing in, you agree to our{" "}
            <button
              onClick={() => {
                const activeSentences =
                  termsData?.data
                    ?.filter((item) => item.status === "active")
                    ?.flatMap((item) => item.sentences) || [];
                setModalContent({
                  title: "Terms of Service",
                  content: activeSentences.length > 0 ? activeSentences : ["There is no data in Terms of Service"],
                });
                setShowPolicyModal(true);
              }}
              className="text-blue-600 hover:underline"
            >
              Terms of Service
            </button>{" "}
            and{" "}
            <button
              onClick={() => {
                const sentences = privacyData?.data
                  ?.filter((item) => item.status === "active")
                  ?.flatMap((item) => item.sentences) || [];
                setModalContent({
                  title: "Privacy Policy",
                  content: sentences.length > 0 ? sentences : ["There is no data in Privacy Policy"],
                });
                setShowPolicyModal(true);
              }}
              className="text-blue-600 hover:underline"
            >
              Privacy Policy
            </button>.
          </p>
        </div>
      </div>

      {showPolicyModal && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 transition-all duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'
            }`}
          onClick={handleBackdropClick}
        >
          {/* Backdrop with blur effect */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal Container */}
          <div
            className={`relative bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl w-full max-w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col transform transition-all duration-200 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
              }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl sm:rounded-t-2xl">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">{modalContent.title}</h2>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
                aria-label="Close modal"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="prose prose-gray max-w-none text-sm sm:text-base">
                {modalContent.content.map((html, index) => (
                  <div
                    key={index}
                    className="mb-4 sm:mb-6 flex items-start space-x-2 sm:space-x-4"
                  >
                    <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm">
                      {index + 1}
                    </div>
                    <div
                      className="flex-1 text-gray-700 leading-relaxed pt-0.5 text-sm sm:text-base"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  </div>
                ))}

                {/* Additional styled content */}
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <h3 className="font-semibold text-blue-900 mb-1 sm:mb-2 text-sm sm:text-base">Important Notice</h3>
                  <p className="text-blue-800 text-xs sm:text-sm">
                    By continuing to use our service, you acknowledge that you have read and understood our privacy policy.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-4 sm:p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl sm:rounded-b-2xl">
              <div className="flex space-x-2 sm:space-x-3">
                <button
                  onClick={handleClose}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 sm:px-6 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base"
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900/70 backdrop-blur-md z-50 animate-in fade-in duration-300 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl border border-gray-100 p-0 w-full max-w-full sm:max-w-lg mx-2 sm:mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out overflow-hidden">

            {/* Header Section */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 sm:px-8 py-4 sm:py-6 border-b border-amber-100/50">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                    Session Conflict Detected
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Multiple login attempt detected
                  </p>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="mb-4 sm:mb-6">
                <p className="text-gray-700 leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
                  You're currently logged in on another device. Continuing will automatically
                  sign you out from that session and log you in here instead.
                </p>

                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border-l-4 border-blue-500">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs sm:text-sm text-gray-700">
                      This action will terminate your existing session for security purposes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingLoginData(null);
                    notifyError("Login cancelled. You remain logged in on your old device.");
                  }}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-sm text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowConfirmModal(false);
                    if (pendingLoginData) {
                      await doLogin({ ...pendingLoginData, forceLogin: true });
                      setPendingLoginData(null);
                    }
                  }}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
                >
                  Continue Login
                </button>
              </div>
            </div>

            {/* Subtle bottom accent */}
            <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400"></div>
          </div>
        </div>
      )}

      {showGoogleConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900/70 backdrop-blur-md z-50 animate-in fade-in duration-300 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl border border-gray-100 p-0 w-full max-w-full sm:max-w-lg mx-2 sm:mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out overflow-hidden">

            {/* Header Section */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 sm:px-8 py-4 sm:py-6 border-b border-amber-100/50">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                    Session Conflict Detected
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Multiple login attempt detected
                  </p>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="mb-4 sm:mb-6">
                <p className="text-gray-700 leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
                  You're currently logged in on another device. Continuing will automatically
                  sign you out from that session and log you in here instead.
                </p>

                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border-l-4 border-blue-500">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs sm:text-sm text-gray-700">
                      This action will terminate your existing session for security purposes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setGoogleShowConfirmModal(false);
                    setPendingGoogleLoginData(null);
                    notifyError("Login cancelled. You remain logged in on your old device.");
                  }}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-sm text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowConfirmModal(false);
                    if (pendingGoogleLoginData) {

                      await doGoogleLogin({ ...pendingGoogleLoginData, forceLogin: true });
                      setPendingGoogleLoginData(null);
                    }
                  }}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
                >
                  Continue Login
                </button>
              </div>
            </div>

            {/* Subtle bottom accent */}
            <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;