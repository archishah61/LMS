import React from 'react';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaBook, FaLightbulb } from 'react-icons/fa';

const CustomLoader = ({
    message = "Loading your learning journey...",
    size = "large",
    variant = "default"
}) => {
    const sizeClasses = {
        small: "w-8 h-8",
        medium: "w-12 h-12",
        large: "w-20 h-20"
    };

    const containerClasses = {
        small: "p-4",
        medium: "p-6",
        large: "p-8"
    };

    const textClasses = {
        small: "text-sm mt-2",
        medium: "text-base mt-4",
        large: "text-lg mt-6"
    };

    const icons = [FaGraduationCap, FaBook, FaLightbulb];
    const colors = ['text-blue-500', 'text-indigo-500', 'text-purple-500'];

    if (variant === "minimal") {
        return (
            <div className="flex items-center justify-center">
                <motion.div
                    className={`${sizeClasses[size]} border-4 border-blue-500 border-t-transparent rounded-full`}
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            </div>
        );
    }

    if (variant === "fullscreen") {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 z-50">
                <div className="text-center px-4">
                    {/* Loader Ring */}
                    <motion.div
                        className="w-20 h-20 sm:w-28 sm:h-28 border-4 border-indigo-300 border-t-indigo-600 rounded-full mx-auto"
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    >
                        {/* Center Icon */}
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <FaGraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
                        </motion.div>
                    </motion.div>

                    {/* Loading Message */}
                    <motion.p
                        className="mt-8 text-indigo-700 font-medium text-lg sm:text-xl"
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        {message}
                    </motion.p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
            <div className="relative">
                {/* Outer ring */}
                <motion.div
                    className={`${sizeClasses[size]} border-4 border-blue-200 rounded-full`}
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />

                {/* Inner spinning ring */}
                <motion.div
                    className={`absolute inset-2 border-4 border-blue-500 border-t-transparent rounded-full`}
                    animate={{ rotate: -360 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />

                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        animate={{ scale: [0.8, 1.1, 0.8] }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <FaGraduationCap className="w-6 h-6 text-blue-600" />
                    </motion.div>
                </div>
            </div>

            {message && (
                <motion.p
                    className={`text-blue-600 font-medium text-center ${textClasses[size]}`}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    {message}
                </motion.p>
            )}
        </div>
    );
};

export default CustomLoader;