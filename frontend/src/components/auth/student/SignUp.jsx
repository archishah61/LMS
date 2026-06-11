/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { useRegisterUserMutation, useGoogleLoginUserMutation } from "../../../services/userAuthApi"

import { useGetAllActiveCitiesQuery } from "../../../services/Masters/cityAPI"

import { useGetAllActiveStatesQuery } from "../../../services/Masters/stateAPI"

import { useGetAllActiveCountriesQuery } from "../../../services/Masters/countryAPI"

import toast from "react-hot-toast"
import { setUserToken } from "../../../features/authSlice"
import { jwtDecode } from "jwt-decode"
import { storeToken, getStudentToken, refreshUserToken } from "../../../services/CookieService"
import { setUserInfo } from "../../../features/userSlice"
import { Link, useNavigate } from "react-router-dom"
import { auth, googleProvider } from "../../../firebase"
import { signInWithPopup } from "firebase/auth"
import { FcGoogle } from "react-icons/fc"
import { X, FileText, ExternalLink } from 'lucide-react';

import { useGetTermsOfServiceByCategoryQuery } from "../../../services/LegalPages/termsOfServices";
import { useGetPrivacyPolicyByCategoryQuery } from "../../../services/LegalPages/privacyPolicy";
const SignUp = () => {
  const [username, setUserName] = useState("")
  const [fullname, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [countryId, setCountryId] = useState(0)
  const [stateId, setStateId] = useState(0)
  const [cityId, setCityId] = useState(0)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [isClosing, setIsClosing] = useState(false);


  // API hooks
  const { data: countriesData } = useGetAllActiveCountriesQuery({
    limit: "ALL",
  })

  // Queries
  const { data: statesResponse } = useGetAllActiveStatesQuery(
    {
      limit: "ALL",
      country_id: countryId,
    },
    {
      skip: !countryId, // Skip fetching if countryId is undefined/null
    }
  )

  // RTK Query hooks
  const { data: citiesData, refetch: refetchCity } = useGetAllActiveCitiesQuery(
    {
      state_id: stateId,
    },
    {
      skip: !stateId, // Skip fetching if countryId is undefined/null
    }
  )
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", content: [] });


  const {
    data: termsData,
    isLoading: termsLoading,
    error: termsError,
  } = useGetTermsOfServiceByCategoryQuery({ category: "signup" });

  const {
    data: privacyData,
    isLoading: privacyLoading,
    error: privacyError,
  } = useGetPrivacyPolicyByCategoryQuery("signup");

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

  useEffect(() => {
    setStateId(0)
    setCityId(0)
  }, [countryId])

  useEffect(() => {
    setCityId(0)
  }, [stateId])

  // Check if the user is already logged in
  useEffect(() => {
    const { access_token } = getStudentToken()
    if (access_token) {
      try {
        const decodedToken = jwtDecode(access_token)
        if (decodedToken && !decodedToken.role) {
          // Redirect to the dashboard if the token is valid
          navigate(`/student-dashboard`)
        }
      } catch (error) {
        console.error("Invalid token", error)
      }
    }
  }, [navigate])

  const [registerUser, { isLoading }] = useRegisterUserMutation()

  const [googleLoginUser, { isLoading: googleLoading }] = useGoogleLoginUserMutation()

  const notifySuccess = (message) => toast.success(message)
  const notifyError = (error) => toast.error(error)

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Basic validation
    if (!fullname || !username || !email || !password || countryId === 0 || stateId === 0 || cityId === 0) {
      notifyError("All fields are required")
      return
    }

    // Email validation
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
        // Set up timer to refresh access token 1 min before expiry
        const refreshAccessToken = async () => {
          try {
            const data = await refreshUserToken()
            if (data.accessToken) {
              // Token is already stored by refreshUserToken function
              dispatch(setUserToken({ access_token: data.accessToken }))
              dispatch(setUserInfo(jwtDecode(data.accessToken)))
            }
          } catch {
            // Optionally, remove token and redirect
            // removeToken("student")
            navigate("/login")
          }
        }
        const { exp } = jwtDecode(response.accessToken)
        const timeLeft = exp * 1000 - Date.now()
        if (timeLeft > 60 * 1000) {
          setTimeout(refreshAccessToken, timeLeft - 60 * 1000)
        }
        setTimeout(() => {
          navigate("/student-dashboard")
        }, 1500)
      }
    } catch (error) {
      const errorMessage = error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'An unexpected error occurred';
      toast.error(errorMessage);
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
        // Set up timer to refresh access token 1 min before expiry
        const refreshAccessToken = async () => {
          try {
            const data = await refreshUserToken()
            if (data.accessToken) {
              // Token is already stored by refreshUserToken function
              dispatch(setUserToken({ access_token: data.accessToken }))
              dispatch(setUserInfo(jwtDecode(data.accessToken)))
            }
          } catch {
            // Optionally, remove token and redirect
            // removeToken("student")
            navigate("/login")
          }
        }
        const { exp } = jwtDecode(res.accessToken)
        const timeLeft = exp * 1000 - Date.now()
        if (timeLeft > 60 * 1000) {
          setTimeout(refreshAccessToken, timeLeft - 60 * 1000)
        }
        setTimeout(() => {
          navigate("/student-dashboard")
        }, 1500)
      }
    } catch (error) {
      const errorMessage = error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'An unexpected error occurred';
      toast.error(errorMessage);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Compact Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full mb-2">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>
          <p className="text-sm text-gray-600">Join us today and get started</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          {/* Google Login Button */}
          <button
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 text-sm font-medium rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all duration-200 mb-4"
            onClick={handleGoogleLogin}
            type="button"
            aria-label="Sign up with Google"
            disabled={googleLoading}
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            ) : (
              <FcGoogle size={18} />
            )}
            Continue with Google
          </button>

          {/* Compact Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-500 font-medium">Or continue with email</span>
            </div>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            {/* Name and Username Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="full_name">
                  Full Name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  value={fullname}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 placeholder-gray-400"
                  placeholder="Full name"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 placeholder-gray-400"
                  placeholder="Username"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Email and Password Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 placeholder-gray-400"
                  placeholder="Email address"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 placeholder-gray-400"
                  placeholder="Password"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Location Selectors */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Location</label>
              <div className="grid grid-cols-3 gap-2">
                {/* Country */}
                <select
                  value={countryId}
                  onChange={(e) => setCountryId(e.target.value)}
                  className="w-full px-2 py-2.5 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200"
                >
                  <option value="0">Country</option>
                  {countriesData?.data?.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>

                {/* State */}
                <select
                  value={stateId}
                  onChange={(e) => setStateId(e.target.value)}
                  className="w-full px-2 py-2.5 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400"
                  disabled={countryId === 0}
                >
                  <option value="0">State</option>
                  {statesResponse?.data?.map((state) => (
                    <option key={state.id} value={state.id}>
                      {state.name}
                    </option>
                  ))}
                </select>

                {/* City */}
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  className="w-full px-2 py-2.5 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400"
                  disabled={stateId === 0}
                >
                  <option value="0">City</option>
                  {citiesData?.data?.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="text-center mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-600">
              Already have an account?{" "}
              <Link
                to={"/login"}
                className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline transition-colors duration-200"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Compact Footer */}
        {/* Additional Info */}
        <div className="text-center mt-6 text-xs text-gray-500 space-y-2">
          <p>
            By signing in, you agree to our{" "}
            <button
              onClick={() => {
                const sentences =
                  termsData?.data
                    ?.filter((item) => item.status === "active")
                    ?.flatMap((item) => item.sentences) || [];
                setModalContent({
                  title: "Terms of Service",
                  content: sentences.length > 0 ? sentences : ["There is no data in Terms of Service"],
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
                const sentences =
                  privacyData?.data
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
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'
            }`}
          onClick={handleBackdropClick}
        >
          {/* Backdrop with blur effect */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal Container */}
          <div
            className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col transform transition-all duration-200 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
              }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{modalContent.title}</h2>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-gray max-w-none">
                {modalContent.content.map((html, index) => (
                  <div
                    key={index}
                    className="mb-6 flex items-start space-x-4"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div
                      className="flex-1 text-gray-700 leading-relaxed pt-1"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  </div>
                ))}

                {/* Additional styled content */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <h3 className="font-semibold text-blue-900 mb-2">Important Notice</h3>
                  <p className="text-blue-800 text-sm">
                    By continuing to use our service, you acknowledge that you have read and understood our privacy policy.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SignUp
