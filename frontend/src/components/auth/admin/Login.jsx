/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import {
  useLoginUserMutation,
  useGetAdminPermissionsQuery,
  useLogoutAdminOrPartnerUserMutation,
} from "../../../services/adminAuthApi"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { setUserToken } from "../../../features/authSlice"
import { setAdminPermissions } from "../../../features/adminSlice"
import { jwtDecode } from "jwt-decode"
import { storeToken, getAdminToken, isTokenExpired, getTokenExpiry, refreshAdminToken, refreshPartnerToken, removeToken } from "../../../services/CookieService";
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, ArrowLeft, Lock, Mail, ShieldCheck, ChevronRight } from "lucide-react"
import { useForgotPasswordMutation } from "../../../services/Become_partner/becomePartnerApi"
import { initSocket } from "../../../services/socket"

const Login = ({ userType }) => {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [formErrors, setFormErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  const [isFlipped, setIsFlipped] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [forgotFormErrors, setForgotFormErrors] = useState({})

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [loginUser, { isLoading }] = useLoginUserMutation()
  const [token, setToken] = useState("")

  const [
    forgotPassword,
    {
      isLoading: isForgotLoading,
      isError: isForgotError,
      error: forgotError,
      isSuccess: isForgotSuccess,
      data: forgotData,
    },
  ] = useForgotPasswordMutation()

  const {
    data: permissionsData,
    refetch: refetchPermissions,
    isSuccess: permissionsSuccess,
    isError: permissionsError,
  } = useGetAdminPermissionsQuery(token, {
    skip: !token,
  })

  const [logoutAdminOrPartner] = useLogoutAdminOrPartnerUserMutation();

  useEffect(() => {
    const { access_token, refresh_token } = getAdminToken();

    // If no refresh token or it's expired, clear everything and stay on login
    if (!refresh_token || isTokenExpired(refresh_token)) {
      removeToken("admin");
      return;
    }

    // If access token is expired but refresh token is valid, try to refresh
    if (!access_token || isTokenExpired(access_token)) {
      const refreshAccessToken = async () => {
        try {
          let decoded;
          try { decoded = jwtDecode(refresh_token); } catch { return; }
          let data;
          if (decoded.role === "partner") { data = await refreshPartnerToken(); }
          else { data = await refreshAdminToken(); }
          if (data.accessToken) {
            dispatch(setUserToken({ access_token: data.accessToken }));
            if (decoded.role === "admin") { setToken(data.accessToken); }
            navigate("/admin/dashboard");
          }
        } catch (error) {
          console.error("Error refreshing token on mount", error);
          removeToken("admin");
        }
      };
      refreshAccessToken();
      return;
    }

    // Access token is valid
    try {
      const decodedToken = jwtDecode(access_token);
      const userRole = decodedToken.role;
      if (decodedToken && (userRole === "admin" || userRole === "partner")) {
        dispatch(setUserToken({ access_token }));
        // If access token is about to expire (less than 2 min left), refresh proactively
        if (getTokenExpiry(access_token) < 2 * 60 * 1000 && refresh_token && !isTokenExpired(refresh_token)) {
          const refreshAccessToken = async () => {
            try {
              let data;
              if (userRole === "partner") { data = await refreshPartnerToken(); }
              else { data = await refreshAdminToken(); }
              if (data.accessToken) { dispatch(setUserToken({ access_token: data.accessToken })); }
            } catch (error) { console.error("Error refreshing token", error); }
          };
          refreshAccessToken();
        }
        if (userRole === "admin") { setToken(access_token); }
        navigate("/admin/dashboard");
      }
    } catch (error) { console.error("Invalid token", error); }
  }, [navigate, userType]);

  useEffect(() => {
    if (permissionsSuccess && permissionsData) {
      dispatch(setAdminPermissions({ adminPermissions: permissionsData.data }))
    }
  }, [permissionsSuccess, permissionsData, dispatch])

  const validatePassword = (password) => {
    const errors = []
    if (password.length < 8) errors.push("Password must be at least 8 characters long")
    if (!/(?=.*[a-z])/.test(password)) errors.push("Password must contain at least one lowercase letter")
    if (!/(?=.*[A-Z])/.test(password)) errors.push("Password must contain at least one uppercase letter")
    if (!/(?=.*\d)/.test(password)) errors.push("Password must contain at least one number")
    if (!/(?=.*[@$!%*?&])/.test(password)) errors.push("Password must contain at least one special character (@$!%*?&)")
    return errors
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setFormErrors({})
    const errors = {}
    if (!identifier.trim()) errors.identifier = "Email or username is required"
    if (!password) errors.password = "Password is required"
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }

    try {
      const res = await loginUser({ identifier, password }).unwrap()
      toast.success("User logged in successfully")
      if (res.accessToken && res.refreshToken) {
        const decodedToken = jwtDecode(res.accessToken)
        const userRole = decodedToken.role
        if (!userRole) { toast.error("Invalid role detected."); return }
        storeToken(res.accessToken, res.refreshToken, "admin");
        const { access_token } = getAdminToken();
        dispatch(setUserToken({ access_token }));
        initSocket(decodedToken.id, userRole, logoutAdminOrPartner, navigate, dispatch);
        const refreshAccessToken = async () => {
          try {
            let data;
            if (userRole === "partner") { data = await refreshPartnerToken(); }
            else { data = await refreshAdminToken(); }
            if (data.accessToken) { dispatch(setUserToken({ access_token: data.accessToken })); }
          } catch {
            removeToken("admin");
            navigate("/admin/login");
          }
        };
        const timeLeft = getTokenExpiry(res.accessToken);
        if (timeLeft > 60 * 1000) { setTimeout(refreshAccessToken, timeLeft - 60 * 1000); }
        try { setToken(access_token) } catch (error) { console.error("Failed to fetch permissions:", error); toast.error("Failed to load admin permissions") }
      }
      setTimeout(() => { navigate("/admin/dashboard") }, 1500)
    } catch (error) {
      console.error("Login error:", error)
      toast.error(error.data?.message || "Failed to log in. Please try again.")
    }
  }

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault()
    setForgotFormErrors({})
    const errors = {}
    if (!forgotEmail.trim()) errors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(forgotEmail)) errors.email = "Email format is invalid"
    if (!newPassword) errors.newPassword = "New password is required"
    else { const pe = validatePassword(newPassword); if (pe.length > 0) errors.newPassword = pe[0] }
    if (!confirmPassword) errors.confirmPassword = "Please confirm your password"
    else if (newPassword !== confirmPassword) errors.confirmPassword = "Passwords do not match"
    if (Object.keys(errors).length > 0) { setForgotFormErrors(errors); return }
    try { await forgotPassword({ email: forgotEmail, password: newPassword }) }
    catch (err) { toast.error("An unexpected error occurred"); console.error("Forgot password error:", err) }
  }

  const handleFlipToForgotPassword = (e) => { e.preventDefault(); setIsFlipped(true); setFormErrors({}); setForgotFormErrors({}) }
  const handleFlipToLogin = () => { setIsFlipped(false); setFormErrors({}); setForgotFormErrors({}) }

  useEffect(() => {
    if (isForgotError) toast.error(forgotError?.data?.message || "Failed to reset password. Please try again.")
    if (isForgotSuccess) {
      toast.success("Password reset successful! You can now login with your new password.")
      setForgotEmail(""); setNewPassword(""); setConfirmPassword("")
      setTimeout(() => { setIsFlipped(false) }, 2000)
    }
  }, [isForgotError, isForgotSuccess, forgotError])

  return (
    <div className="login-root">
      <ToastContainer position="top-right" autoClose={4000} theme="colored" />

      {/* Background */}
      <div className="login-bg">
        <div className="login-bg-orb orb-1" />
        <div className="login-bg-orb orb-2" />
        <div className="login-bg-grid" />
      </div>

      <div className="login-container">
        {/* Left panel — branding */}
        <motion.div
          className="login-brand"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="brand-logo">
            <ShieldCheck size={28} strokeWidth={1.8} />
          </div>
          <div className="brand-content">
            <h1 className="brand-title">Admin<br />Portal</h1>
            <p className="brand-sub">Secure management console for authorised personnel only.</p>
          </div>
          <div className="brand-dots">
            {[...Array(9)].map((_, i) => <span key={i} className="dot" />)}
          </div>
        </motion.div>

        {/* Right panel — card flip */}
        <div className="login-card-wrap">
          <div className="flip-scene">
            <motion.div
              className="flip-card"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* FRONT — Login */}
              <div className="flip-face flip-front">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <div className="card-header">
                    <p className="card-eyebrow">Welcome back</p>
                    <h2 className="card-title">Sign In</h2>
                    <p className="card-sub">Enter your credentials to access the dashboard</p>
                  </div>

                  <form onSubmit={handleLogin} className="card-form">
                    <div className="field-group">
                      <label className="field-label">Email or Username</label>
                      <div className="field-wrap">
                        <Mail className="field-icon" size={16} />
                        <input
                          type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          className={`field-input ${formErrors.identifier ? "field-error" : ""}`}
                          placeholder="you@company.com"
                        />
                      </div>
                      {formErrors.identifier && <p className="field-msg">{formErrors.identifier}</p>}
                    </div>

                    <div className="field-group">
                      <div className="field-label-row">
                        <label className="field-label">Password</label>
                        <button type="button" onClick={handleFlipToForgotPassword} className="forgot-link">
                          Forgot password?
                        </button>
                      </div>
                      <div className="field-wrap">
                        <Lock className="field-icon" size={16} />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`field-input ${formErrors.password ? "field-error" : ""}`}
                          placeholder="••••••••••"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="eye-btn">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {formErrors.password && <p className="field-msg">{formErrors.password}</p>}
                    </div>

                    <button type="submit" disabled={isLoading} className="submit-btn">
                      <span>{isLoading ? "Signing in…" : "Sign In"}</span>
                      {!isLoading && <ChevronRight size={18} />}
                      {isLoading && <span className="spinner" />}
                    </button>
                  </form>
                </motion.div>
              </div>

              {/* BACK — Reset Password */}
              <div className="flip-face flip-back">
                <div style={{ marginTop: "-50px" }}>
                  <div className="card-header">
                    <p className="card-eyebrow">Account recovery</p>
                    <h2 className="card-title title-reset">Reset Password</h2>
                    <p className="card-sub">Enter your email and choose a new password</p>
                  </div>

                  <form onSubmit={handleForgotPasswordSubmit} className="card-form form-reset">
                    <div className="field-group">
                      <label className="field-label">Email Address</label>
                      <div className="field-wrap">
                        <Mail className="field-icon" size={16} />
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className={`field-input ${forgotFormErrors.email ? "field-error" : ""}`}
                          placeholder="you@company.com"
                        />
                      </div>
                      {forgotFormErrors.email && <p className="field-msg">{forgotFormErrors.email}</p>}
                    </div>

                    <div className="field-group">
                      <label className="field-label">New Password</label>
                      <div className="field-wrap">
                        <Lock className="field-icon" size={16} />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={`field-input ${forgotFormErrors.newPassword ? "field-error" : ""}`}
                          placeholder="••••••••••"
                        />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="eye-btn">
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {forgotFormErrors.newPassword && <p className="field-msg">{forgotFormErrors.newPassword}</p>}
                    </div>

                    <div className="field-group">
                      <label className="field-label">Confirm Password</label>
                      <div className="field-wrap">
                        <Lock className="field-icon" size={16} />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`field-input ${forgotFormErrors.confirmPassword ? "field-error" : ""}`}
                          placeholder="••••••••••"
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="eye-btn">
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {forgotFormErrors.confirmPassword && <p className="field-msg">{forgotFormErrors.confirmPassword}</p>}
                    </div>

                    <button type="submit" disabled={isForgotLoading} className="submit-btn">
                      <span>{isForgotLoading ? "Resetting…" : "Reset Password"}</span>
                      {!isForgotLoading && <ChevronRight size={18} />}
                      {isForgotLoading && <span className="spinner" />}
                    </button>

                    <button type="button" onClick={handleFlipToLogin} className="back-btn">
                      Back to Sign In
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink: #002322; /* forestGreen */
          --ink-soft: #1a3d3c;
          --ink-muted: #5c7b7a;
          --surface: #ffffff;
          --surface-raised: #F0FBF6; /* lightGreen */
          --border: #d1e7dd;
          --accent: #009D5C; /* leafGreen */
          --accent-hover: #008A52;
          --accent-glow: rgba(0,157,92,0.15);
          --error: #d92d20;
          --error-bg: #fff5f4;
          --success: #00BB6E; /* primary */
          --radius: 14px;
        }

        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f2f8;
          position: relative;
          overflow: hidden;
        }

        /* — Background — */
        .login-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .login-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.45;
        }
        .orb-1 {
          width: 560px; height: 560px;
          background: radial-gradient(circle, #e6f9f0 0%, transparent 70%);
          top: -120px; left: -100px;
        }
        .orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #f0fdf4 0%, transparent 70%);
          bottom: -80px; right: -60px;
        }
        .login-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,157,92,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,157,92,0.045) 1px, transparent 1px);
          background-size: 44px 44px;
        }

        /* — Layout — */
        .login-container {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: stretch;
          width: min(960px, 95vw);
          min-height: 580px;
          background: var(--surface);
          border-radius: 24px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.06),
            0 24px 64px rgba(0,0,0,0.10),
            0 6px 20px rgba(0,0,0,0.06);
        }

        /* — Brand Panel — */
        .login-brand {
          width: 300px;
          flex-shrink: 0;
          background: var(--ink);
          padding: 52px 40px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          position: relative;
          overflow: hidden;
        }
        .login-brand::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 10% 20%, rgba(0,187,110,0.35) 0%, transparent 60%),
            radial-gradient(ellipse at 90% 80%, rgba(0,157,92,0.2) 0%, transparent 55%);
        }
        .brand-logo {
          position: relative;
          z-index: 1;
          width: 52px; height: 52px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
        .brand-content {
          position: relative;
          z-index: 1;
          flex: 1;
        }
        .brand-title {
          font-size: 42px;
          line-height: 1.05;
          color: #fff;
          letter-spacing: -0.5px;
          margin-bottom: 16px;
        }
        .brand-sub {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(255,255,255,0.5);
          font-weight: 300;
        }
        .brand-dots {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 10px;
          width: fit-content;
        }
        .dot {
          display: block;
          width: 5px; height: 5px;
          border-radius: 50%;
          background: rgba(255,255,255,0.18);
        }

        /* — Card / Flip — */
        .login-card-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 52px;        /* restored proper padding */
        }
        .flip-scene {
          width: 100%;
          max-width: 380px;
          perspective: 1200px;
        }
        .flip-card {
          position: relative;
          width: 100%;
        }
        .flip-face {
          width: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .flip-front { transform: rotateY(0deg); }
        .flip-back {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          transform: rotateY(180deg);
        }

        /* — Card content — */
        .card-header { margin-bottom: 20px; }
        .card-eyebrow {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 8px;
        }
        .card-title {
          font-size: 34px;
          color: var(--ink);
          letter-spacing: -0.5px;
          line-height: 1.1;
          margin-bottom: 8px;
        }
        .card-title.title-reset {
          font-size: 28px;
        }
        .card-sub {
          font-size: 14px;
          color: var(--ink-muted);
          font-weight: 400;
          line-height: 1.5;
        }

        /* — Form — */
        .card-form { display: flex; flex-direction: column; gap: 14px; }
        .card-form.form-reset { gap: 10px; }
        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .field-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--ink-soft);
          letter-spacing: 0.01em;
        }
        .field-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .field-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .field-icon {
          position: absolute;
          left: 14px;
          color: var(--ink-muted);
          pointer-events: none;
          flex-shrink: 0;
        }
        .field-input {
          width: 100%;
          padding: 11px 14px 11px 40px;
          font-size: 14px;
          color: var(--ink);
          background: var(--surface-raised);
          border: 1.5px solid var(--border);
          border-radius: 10px;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .field-input::placeholder { color: #b0b5c8; }
        .field-input:focus {
          border-color: var(--accent);
          background: #fff;
          box-shadow: 0 0 0 3px var(--accent-glow);
        }
        .field-input.field-error {
          border-color: var(--error);
          background: var(--error-bg);
        }
        .field-msg {
          font-size: 12px;
          color: var(--error);
          margin-top: 1px;
          line-height: 1.3;
        }
        .eye-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--ink-muted);
          display: flex;
          align-items: center;
          transition: color 0.15s;
          padding: 4px;
        }
        .eye-btn:hover { color: var(--ink); }

        .forgot-link {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          color: var(--accent);
          font-weight: 500;
          padding: 0;
          transition: opacity 0.15s;
        }
        .forgot-link:hover { opacity: 0.75; }

        /* — Buttons — */
        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 13px 20px;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s, transform 0.1s, box-shadow 0.18s;
          box-shadow: 0 4px 14px rgba(0,157,92,0.28);
          margin-top: 4px;
        }
        .submit-btn:hover:not(:disabled) {
          background: var(--accent-hover);
          box-shadow: 0 6px 20px rgba(0,157,92,0.35);
          transform: translateY(-1px);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .back-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          color: var(--accent);
          font-weight: 500;
          padding: 8px 0;
          transition: opacity 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }
        .back-btn:hover {
          opacity: 0.75;
        }

        /* — Spinner — */
        .spinner {
          display: inline-block;
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* — Responsive — */
        @media (max-width: 680px) {
          .login-brand { display: none; }
          .login-card-wrap { padding: 36px 28px; }
          .login-container { min-height: unset; }
        }
      `}</style>
    </div>
  )
}

export default Login