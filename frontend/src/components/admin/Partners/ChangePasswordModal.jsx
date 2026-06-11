/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState } from "react";
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react";
import { useUpdatePasswordMutation } from "../../../services/Become_partner/becomePartnerApi";
import { getAdminToken } from "../../../services/CookieService";
import toast from "react-hot-toast";

export default function ChangePasswordModal({ onClose, userId, mustChangePassword }) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [touched, setTouched] = useState({
        password: false,
        confirmPassword: false,
    });
    const [updatePassword, { isLoading }] = useUpdatePasswordMutation();

    const { access_token } = getAdminToken();

    const validatePassword = (password) => {
        return {
            minLength: password.length >= 8,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        };
    };

    const passwordValidation = validatePassword(newPassword);
    const isPasswordValid = Object.values(passwordValidation).every(Boolean);
    const passwordsMatch = newPassword === confirmPassword && confirmPassword !== "";
    const canSubmit = isPasswordValid && passwordsMatch && !loading;

    const handleChangePassword = async () => {
        if (!canSubmit) return;

        try {
            setLoading(true);
            const result = await updatePassword({
                partnerId: userId,
                password: newPassword,
                access_token: access_token,
            }).unwrap();

            toast.success("Password updated successfully");
            onClose();
        } catch (err) {
            console.error("Password update failed", err);
            toast.error("Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    const ValidationItem = ({ isValid, text }) => (
        <div className="flex items-center gap-2 text-sm">
            {isValid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
                <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className={`transition-colors ${isValid ? "text-green-700" : "text-red-600"}`}>{text}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md mx-auto bg-white rounded-lg border shadow-2xl">
                {/* Header */}
                <div className="p-6 pb-2 text-center space-y-1 relative">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-lightGreen relative">
                        <Lock className="h-6 w-6 text-forestGreen" />
                    </div>

                    {/* Close Icon - Positioned outside the lock circle but inside header */}
                    {!mustChangePassword && (
                        <button
                            type="button"
                            className="absolute right-6 top-6 rounded-full p-1 hover:bg-gray-200 focus:outline-none z-10"
                            onClick={onClose}
                        >
                            <span className="sr-only">Close</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-gray-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}

                    <h2 className="text-2xl font-bold tracking-tight">Change Password</h2>
                    <p className="text-sm text-gray-600">Create a strong password to secure your account</p>
                </div>

                {/* Content */}
                <div className="p-6 pt-0 space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="new-password" className="text-sm font-medium leading-none">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                id="new-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                                className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leafGreen focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10 ${touched.password && !isPasswordValid
                                    ? "border-red-500 focus-visible:ring-red-500"
                                    : "border-gray-200"
                                    }`}
                            />
                            <button
                                type="button"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                )}
                                <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                            </button>
                        </div>

                        {touched.password && (
                            <div className="space-y-2 p-2 bg-gray-50 rounded-md">
                                <p className="text-sm font-medium text-gray-700">Password requirements:</p>
                                <div className="space-y-1 grid grid-cols-1 sm:grid-cols-2">
                                    <ValidationItem isValid={passwordValidation.minLength} text="At least 8 characters" />
                                    <ValidationItem isValid={passwordValidation.hasUppercase} text="One uppercase letter" />
                                    <ValidationItem isValid={passwordValidation.hasLowercase} text="One lowercase letter" />
                                    <ValidationItem isValid={passwordValidation.hasNumber} text="One number" />
                                    <ValidationItem isValid={passwordValidation.hasSpecialChar} text="One special character" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="confirm-password" className="text-sm font-medium leading-none">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                id="confirm-password"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm your new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                                className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leafGreen focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10 ${touched.confirmPassword && !passwordsMatch && confirmPassword !== ""
                                    ? "border-red-500 focus-visible:ring-red-500"
                                    : touched.confirmPassword && passwordsMatch
                                        ? "border-green-500 focus-visible:ring-green-500"
                                        : "border-gray-200"
                                    }`}
                            />
                            <button
                                type="button"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                )}
                                <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                            </button>
                        </div>

                        {touched.confirmPassword && confirmPassword !== "" && (
                            <div className="space-y-2 p-2 bg-gray-50 rounded-md">
                                <div className="space-y-1 grid grid-cols-1 sm:grid-cols-2">
                                    {passwordsMatch ? (
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span className={`transition-colors text-green-700`}>Passwords match</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm">
                                            <XCircle className="h-4 w-4 text-red-500" />
                                            <span className={`transition-colors text-red-600`}>Passwords do not match</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleChangePassword}
                        disabled={!canSubmit}
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leafGreen focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-leafGreen text-white   h-11 px-8 w-full ${!canSubmit ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                    >
                        {loading ? (
                            <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Updating Password...
                            </>
                        ) : (
                            "Update Password"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
