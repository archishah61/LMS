import React, { useState } from "react";
import { Lock, Eye, EyeOff, Shield } from "lucide-react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import SwaggerLayout from "./SwaggerLayout";

const SwaggerDocs = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleLogin = () => {
        setIsLoading(true);
        setError("");

        setTimeout(() => {
            if (password === import.meta.env.VITE_DOCUMENTATION_PASSWORD) {
                setIsAuthenticated(true);
            } else {
                setError("Incorrect password. Please try again.");
                setIsLoading(false);
            }
        }, 800);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && password) {
            handleLogin();
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', animationDelay: '1s' }}></div>
                </div>

                <div className="relative w-full max-w-md z-10">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">API Documentation</h1>
                        <p className="text-gray-500">Secure access to technical resources</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Access Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                        disabled={isLoading}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" style={{ animation: 'shake 0.4s ease-in-out' }}>
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleLogin}
                                disabled={isLoading || !password}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Authenticating...
                                    </div>
                                ) : (
                                    "Access Documentation"
                                )}
                            </button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-center text-xs text-gray-500">
                                Protected resource • Authorized access only
                            </p>
                        </div>
                    </div>


                </div>

                <style>{`
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-10px); }
                        75% { transform: translateX(10px); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{ height: "100vh", width: "100%" }}>
            {/* <SwaggerUI
                url="http://localhost:8000/swagger-output.json"
                docExpansion="none"
                defaultModelExpandDepth={0}
                defaultModelsExpandDepth={-1}
                layout="BaseLayout"
                deepLinking={true}
                supportedSubmitMethods={["get", "post", "put", "delete"]}
            /> */}

            <SwaggerLayout />
        </div>
    );
};

export default SwaggerDocs;