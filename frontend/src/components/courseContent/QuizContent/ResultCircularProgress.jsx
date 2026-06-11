import React from "react";
import { motion } from "framer-motion";

const ResultCircularProgress = ({ score, isPassed }) => {
    const radius = 60;
    const stroke = 12;
    const normalizedRadius = radius - stroke * 0.5;
    const circumference = normalizedRadius * 2 * Math.PI;
    const progress = (score / 100) * circumference;
    const strokeDashoffset = circumference - progress;

    return (
        <div className="relative w-48 h-48 flex items-center justify-center">
            <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
                <circle
                    stroke="#f0f2f5"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    stroke={isPassed ? "#10b981" : "#f43f5e"} // Emerald-500 or Rose-500
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + " " + circumference}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-slate-800 tracking-tight">
                    {Math.round(score)}%
                </span>
            </div>
        </div>
    );
};

export default ResultCircularProgress;
