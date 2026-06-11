import React from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

// Filtered list of unique technology icons
const techIcons = [
    "46a76c802176eb17b04e12108de7e7e0f3736dc6-1024x1024 2.png",
    "Adobe_XD-Logo.wine 2.png",
    "macos-app-icons-sketch-2-png-icon 2.png",
    "free-framer-logo-icon-svg-download-png-2944880 2.png",
    "Photoshop-logo 2.png",
    "Adobe_Illustrator_CC_icon.svg 2.png",
    "Adobe_After_Effects_CC_icon.svg 2.png",
    "image 109.png",
    "Mask group (2).png",
    "Rectangle 34627066.png",
    "Group (4).png",
    "tech-12.png",
    "Android_Studio_icon_(2023).svg 4.png",
    "IntelliJ_IDEA_Icon.svg 2.png",
    "image 110.png",
    "image 111.png",
    "tech-17.png",
    "sublime-icon 2.png",
    "Android_Studio_icon_(2023).svg 4.png",
    "android-os 2.png",
    "Group 1261158271.png",
    "Group (6).png",
    "Clip path group.png",
    "1_Yafu7ihc1LFuP4azerAa4w 3.png",
    "IntelliJ_IDEA_Icon.svg 3.png",
    "Capa_1 (3).png",
    "Capa_1.png",
    "tech-29.png",
    "tech-30.png"
];

export default function TechnologySection() {
    return (
        <section className="bg-white py-12 md:py-16 lg:py-20">
            <motion.div
                className="container px-4 sm:px-6 lg:px-8 text-center bg-white"
                initial={{ opacity: 0, y: "1.25rem" }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                    duration: 0.7,
                    ease: [0.22, 1, 0.36, 1]
                }}
            >
                {/* Stars with sequential wave animation */}
                <div className="flex justify-center items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => {
                        const StarMotion = motion(Star);
                        return (
                            <StarMotion
                                key={i}
                                className="
                    w-4 h-4
                    sm:w-5 sm:h-5
                    md:w-4 md:h-4
                    lg:w-4 lg:h-4
                    xl:w-6 xl:h-6
                "
                                initial={{
                                    fill: "#00000000",
                                    color: "#000000",
                                    scale: 0.8,
                                    rotate: -15,
                                    opacity: 0
                                }}
                                whileInView={{
                                    fill: "#FFD700",
                                    color: "#FFD700",
                                    scale: [0.8, 1.1, 1],
                                    rotate: [0, 10, 0],
                                    opacity: 1
                                }}
                                viewport={{ once: true, amount: 0.8 }}
                                transition={{
                                    duration: 0.8,
                                    ease: [0.22, 1, 0.36, 1],
                                    delay: i * 0.1,
                                    scale: {
                                        duration: 0.6,
                                        times: [0, 0.4, 1]
                                    },
                                    rotate: {
                                        duration: 0.6,
                                        delay: i * 0.1
                                    },
                                    opacity: {
                                        duration: 0.4,
                                        delay: i * 0.1
                                    }
                                }}
                            />
                        );
                    })}
                </div>

                {/* Heading */}
                <motion.h2
                    className="text-sm xs:text-xs sm:text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-xl font-semibold tracking-widest text-[#0B1221] uppercase mb-8 md:mb-10 lg:mb-12"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    Globally Leading Technologies
                </motion.h2>

                {/* Desktop Grid (Hidden on Mobile) */}
                <div className="hidden md:flex flex-col items-center gap-8 md:gap-10 lg:gap-12 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
                    {/* First Row (14 icons) */}
                    <div className="flex flex-wrap justify-center items-center gap-6 md:gap-6 lg:gap-8 xl:gap-12 w-full">
                        {techIcons.slice(0, 14).map((icon, index) => (
                            <motion.div
                                key={`row1-${index}`}
                                className="flex items-center justify-center"
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{
                                    opacity: 1,
                                    scale: 1,
                                    transition: {
                                        duration: 0.4,
                                        delay: index * 0.03,
                                        ease: "easeOut"
                                    }
                                }}
                                whileHover={{
                                    scale: 1.15,
                                    transition: { duration: 0.2 }
                                }}
                                viewport={{ once: true, amount: 0.5 }}
                            >
                                <img
                                    src={`/assets/techs/${icon}`}
                                    alt={`Technology ${index + 1}`}
                                    className="h-6 md:h-6 lg:h-8 xl:h-10 w-6 lg:w-8 xl:w-10 object-contain transition-all duration-300 hover:drop-shadow-lg"
                                />
                            </motion.div>
                        ))}
                    </div>

                    {/* Second Row (13 icons) */}
                    <div className="flex flex-wrap justify-center items-center gap-6 md:gap-6 lg:gap-8 xl:gap-12 w-full">
                        {techIcons.slice(14, 27).map((icon, index) => (
                            <motion.div
                                key={`row2-${index}`}
                                className="flex items-center justify-center"
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{
                                    opacity: 1,
                                    scale: 1,
                                    transition: {
                                        duration: 0.4,
                                        delay: (index + 14) * 0.03,
                                        ease: "easeOut"
                                    }
                                }}
                                whileHover={{
                                    scale: 1.15,
                                    transition: { duration: 0.2 }
                                }}
                                viewport={{ once: true, amount: 0.5 }}
                            >
                                <img
                                    src={`/assets/techs/${icon}`}
                                    alt={`Technology ${index + 14 + 1}`}
                                    className="h-6 md:h-6 lg:h-8 xl:h-10 w-6 lg:w-8 xl:w-10 object-contain transition-all duration-300 hover:drop-shadow-lg"
                                />
                            </motion.div>
                        ))}
                    </div>

                    {/* Third Row (Remaining icons) */}
                    <div className="flex flex-wrap justify-center items-center gap-6 md:gap-6 lg:gap-8 xl:gap-12 w-full">
                        {techIcons.slice(27).map((icon, index) => {
                            const isLastItem = icon === "tech-30.png";
                            return (
                                <motion.div
                                    key={`row3-${index}`}
                                    className="flex items-center justify-center"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{
                                        opacity: 1,
                                        scale: 1,
                                        transition: {
                                            duration: 0.4,
                                            delay: (index + 27) * 0.03,
                                            ease: "easeOut"
                                        }
                                    }}
                                    whileHover={{
                                        scale: isLastItem ? 1.1 : 1.15,
                                        transition: { duration: 0.2 }
                                    }}
                                    viewport={{ once: true, amount: 0.5 }}
                                >
                                    <img
                                        src={`/assets/techs/${icon}`}
                                        alt={`Technology ${index + 27 + 1}`}
                                        className={`${isLastItem ? "h-10 md:h-8 lg:h-10 xl:h-12 w-auto" : "h-6 md:h-6 lg:h-8 xl:h-10 w-6 xl:w-10"} object-contain transition-all duration-300 hover:drop-shadow-lg`}
                                    />
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Mobile Marquee (Hidden on Desktop) */}
                <div className="md:hidden flex flex-col gap-6 overflow-hidden w-full opacity-80 grayscale-[0%]">
                    {/* Marquee 1: Moves Left to Right */}
                    <div className="flex relative items-center overflow-hidden py-2">
                        <motion.div
                            className="flex gap-8 items-center flex-nowrap"
                            animate={{
                                x: ["-50%", "0%"]
                            }}
                            transition={{
                                ease: "linear",
                                duration: 20,
                                repeat: Infinity,
                                repeatType: "loop"
                            }}
                            style={{ minWidth: "200%" }}
                        >
                            {[...techIcons.slice(0, 15), ...techIcons.slice(0, 15)].map((icon, index) => (
                                <div
                                    key={`marquee1-${index}`}
                                    className="flex-shrink-0 transition-transform duration-300 hover:scale-110"
                                >
                                    <img
                                        src={`/assets/techs/${icon}`}
                                        alt="tech"
                                        className="h-8 w-auto object-contain"
                                    />
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Marquee 2: Moves Right to Left */}
                    <div className="flex relative items-center overflow-hidden py-2">
                        <motion.div
                            className="flex gap-8 items-center flex-nowrap"
                            animate={{
                                x: ["0%", "-50%"]
                            }}
                            transition={{
                                ease: "linear",
                                duration: 20,
                                repeat: Infinity,
                                repeatType: "loop"
                            }}
                            style={{ minWidth: "200%" }}
                        >
                            {[...techIcons.slice(15), ...techIcons.slice(15)].map((icon, index) => {
                                const isLastItem = icon === "tech-30.png";
                                return (
                                    <div
                                        key={`marquee2-${index}`}
                                        className="flex-shrink-0 transition-transform duration-300 hover:scale-110"
                                    >
                                        <img
                                            src={`/assets/techs/${icon}`}
                                            alt="tech"
                                            className={`${isLastItem ? "h-12 w-auto" : "h-8 w-auto"} object-contain`}
                                        />
                                    </div>
                                );
                            })}
                        </motion.div>
                    </div>
                </div>

                {/* Subtle background pattern */}
                <div className="absolute inset-0 -z-10 opacity-5">
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-purple-500 rounded-full blur-3xl"></div>
                </div>
            </motion.div>
        </section>
    );
}