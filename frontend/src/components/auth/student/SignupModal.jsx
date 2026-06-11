/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRegisterUserMutation, useGoogleLoginUserMutation } from "../../../services/userAuthApi";
import { useGetAllActiveCitiesQuery } from "../../../services/Masters/cityAPI";
import { useGetAllActiveStatesQuery } from "../../../services/Masters/stateAPI";
import { useGetAllActiveCountriesQuery } from "../../../services/Masters/countryAPI";
import toast from "react-hot-toast";
import { setUserToken } from "../../../features/authSlice";
import { jwtDecode } from "jwt-decode";
import { storeToken, getStudentToken, refreshUserToken } from "../../../services/CookieService";
import { setUserInfo } from "../../../features/userSlice";
import { Link, useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../../../firebase";
import { signInWithPopup } from "firebase/auth";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff, User, Mail, Lock, X, MapPin, UserPlus, ArrowRight, UserCircle } from 'lucide-react';


// Minimalist Button Component
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

// Minimalist Input Component
const MinimalInput = ({ type, value, onChange, placeholder, icon: Icon, rightElement, name, id }) => (
    <div className="relative group w-full">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-gray-700 transition-colors duration-200">
            <Icon className="w-5 h-5" />
        </div>
        <input
            id={id}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl text-gray-900 text-sm font-medium placeholder-gray-400 
      transition-all duration-200 focus:bg-white focus:border-gray-300 focus:ring-1 focus:ring-gray-200 outline-none"
            placeholder={placeholder}
        />
        {rightElement && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {rightElement}
            </div>
        )}
    </div>
);

// Minimalist Select Component
const MinimalSelect = ({ value, onChange, options, placeholder, icon: Icon, disabled }) => (
    <div className="relative group w-full">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors duration-200">
            <Icon className="w-5 h-5" />
        </div>
        <select
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl text-gray-900 text-sm font-medium 
      transition-all duration-200 focus:bg-white focus:border-gray-800 focus:ring-1 focus:ring-gray-200 outline-none appearance-none disabled:bg-gray-100 disabled:text-gray-400"
        >
            <option value="0">{placeholder}</option>
            {options?.map((option) => (
                <option key={option.id} value={option.id}>
                    {option.name}
                </option>
            ))}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
        </div>
    </div>
);

const SignupModal = ({ onClose, onSwitchToLogin }) => {
    const [username, setUserName] = useState("")
    const [fullname, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [countryId, setCountryId] = useState(0)
    const [stateId, setStateId] = useState(0)
    const [cityId, setCityId] = useState(0)
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [isClosing, setIsClosing] = useState(false);

    // API hooks
    const { data: countriesData } = useGetAllActiveCountriesQuery({ limit: "ALL" })
    const { data: statesResponse } = useGetAllActiveStatesQuery(
        { limit: "ALL", country_id: countryId },
        { skip: !countryId }
    )
    const { data: citiesData } = useGetAllActiveCitiesQuery(
        { state_id: stateId },
        { skip: !stateId }
    )

    const [registerUser, { isLoading }] = useRegisterUserMutation()
    const [googleLoginUser, { isLoading: googleLoading }] = useGoogleLoginUserMutation()



    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        setStateId(0)
        setCityId(0)
    }, [countryId])

    useEffect(() => {
        setCityId(0)
    }, [stateId])

    const notifySuccess = (message) => toast.success(message)
    const notifyError = (error) => toast.error(error)

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 200); // Wait for animation
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!fullname || !username || !email || !password || countryId === 0 || stateId === 0 || cityId === 0) {
            notifyError("All fields are required")
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            notifyError("Please enter a valid email address")
            return
        }

        try {
            const response = await registerUser({
                full_name: fullname,
                username,
                email,
                password,
                country_id: countryId,
                state_id: stateId,
                city_id: cityId,
                app_platform: "web",
            }).unwrap()

            notifySuccess("User registered successfully")

            if (response.accessToken && response.refreshToken) {
                storeToken(response.accessToken, response.refreshToken, "student")
                const { access_token } = getStudentToken()
                dispatch(setUserToken({ access_token }))
                dispatch(setUserInfo(jwtDecode(response.accessToken)))

                onClose();
                navigate("/student-dashboard");
            }
        } catch (error) {
            const errorMessage = error?.data?.error || error?.data?.message || 'An unexpected error occurred';
            notifyError(errorMessage);
        }
    }

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider)
            const token = await result.user.getIdToken()

            const res = await googleLoginUser({
                idToken: token,
                app_platform: "web",
            }).unwrap()

            notifySuccess("User registered successfully")

            if (res.accessToken && res.refreshToken) {
                storeToken(res.accessToken, res.refreshToken, "student")
                const { access_token } = getStudentToken()
                dispatch(setUserToken({ access_token }))
                dispatch(setUserInfo(jwtDecode(res.accessToken)))

                onClose();
                navigate("/student-dashboard");
            }
        } catch (error) {
            const errorMessage = error?.data?.error || error?.data?.message || 'An unexpected error occurred';
            notifyError(errorMessage);
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                onClick={handleClose}
            />

            <div className={`relative z-10 w-full max-w-[420px] bg-white rounded-3xl shadow-2xl p-6 transform transition-all duration-300 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-full transition-all duration-200"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-5 pt-1">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-black text-white rounded-xl mb-3 shadow-xl shadow-black/10">
                        <UserPlus className="w-5 h-5" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Create Account</h1>
                    <p className="text-gray-500 text-xs mt-1.5 font-medium">Join us today and get started</p>
                </div>

                <div className="space-y-4">
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

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <MinimalInput
                                type="text"
                                value={fullname}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Full Name"
                                icon={UserCircle}
                            />
                            <MinimalInput
                                type="text"
                                value={username}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="Username"
                                icon={User}
                            />
                        </div>

                        <MinimalInput
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            icon={Mail}
                        />

                        <MinimalInput
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            icon={Lock}
                            rightElement={
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-black transition-colors">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            }
                        />

                        <div className="grid grid-cols-3 gap-2">
                            <MinimalSelect
                                placeholder="Country"
                                value={countryId}
                                onChange={(e) => setCountryId(Number(e.target.value))}
                                options={countriesData?.data}
                                icon={MapPin}
                            />
                            <MinimalSelect
                                placeholder="State"
                                value={stateId}
                                onChange={(e) => setStateId(Number(e.target.value))}
                                options={statesResponse?.data}
                                icon={MapPin}
                                disabled={!countryId}
                            />
                            <MinimalSelect
                                placeholder="City"
                                value={cityId}
                                onChange={(e) => setCityId(Number(e.target.value))}
                                options={citiesData?.data}
                                icon={MapPin}
                                disabled={!stateId}
                            />
                        </div>

                        <PrimaryButton onClick={handleSubmit} disabled={isLoading}>
                            {isLoading ? "Creating Account..." : "Create Account"}
                        </PrimaryButton>
                    </form>

                    <div className="text-center pt-1">
                        <p className="text-xs text-gray-500">
                            Already have an account?{" "}
                            <button
                                onClick={onSwitchToLogin}
                                className="font-semibold text-black hover:text-megistic transition-colors inline-flex items-center gap-1 group"
                            >
                                Sign in
                                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                            </button>
                        </p>
                    </div>
                </div>

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


        </div>
    );
};

export default SignupModal;
