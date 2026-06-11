"use client";
import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

export default function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // Stagger effect for children
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section className="bg-white xs:min-h-[calc(100vh-40vh)] sm:min-h-[calc(100vh-20vh)] md:min-h-[calc(100vh-70vh)] lg:min-h-[calc(100vh-20vh)] xl:min-h-[calc(100vh-10vh)] flex items-center justify-center py-[0.625rem] md:py-[1.25rem] lg:py-[1.875rem] xl:py-[2.5rem] 2xl:py-[1.875rem] ">
      <div className="container px-4 sm:px-6 lg:px-8 w-full">
        <div className="h-[calc(100vh-20vh)] xs:h-[calc(100vh-47vh)] sm:h-[calc(100vh-40vh)] md:h-[calc(100vh-65vh)] lg:h-[calc(100vh-35vh)] xl:h-[calc(100vh-20vh)] 2xl:h-[calc(100vh-15vh)] bg-white border border-[#F5F5F5] rounded-3xl p-6 md:p-8 lg:p-10 relative overflow-hidden shadow-sm">
          {/* Green Bottom Bar */}
          <div className="absolute bottom-0 left-0 w-full h-[15%] bg-[#F0FDF4]"></div>

          <motion.div
            className="relative z-10 h-full flex flex-col md:block"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Center Content */}
            <div className="w-full md:h-full md:flex md:flex-col md:justify-center md:items-center md:pb-20 md:-mt-12 md:pt-10 space-y-4 pt-4 text-center z-20 relative">
              <motion.h1
                className="text-2xl xs:text-[1.4rem] sm:text-[1.8rem] md:text-[2.2rem] lg:text-[2.4rem] xl:text-[3.2rem] 2xl:text-[3.6rem] font-bold text-forestGreen leading-[1.1] tracking-tight"
                variants={itemVariants}
              >
                <span className="relative inline-block whitespace-nowrap">
                  Powering Modern Learning
                  <motion.img
                    src="/assets/hero-3.png"
                    alt=""
                    initial={{ opacity: 0, scale: 0, rotate: -20 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.8,
                      duration: 0.6,
                      type: "spring",
                      stiffness: 200,
                    }}
                    className="absolute -bottom-[2.125rem] xs:-bottom-[0.8rem] sm:-bottom-[0.625rem] md:-bottom-[1.125rem] lg:-bottom-[1.375rem] xl:-bottom-[1.75rem] 2xl:-bottom-[2.125rem] -right-[0.9375rem] xs:-right-[0.625rem] sm:-right-[0.9375rem] xs:w-[32%] w-[35%] sm:w-[30%] md:w-[35%] lg:w-[35%] xl:w-[35%] 2xl:w-[35%] -z-10"
                  />
                </span>
                <br />
                <span className="block mt-1">Journeys</span>
              </motion.h1>

              <motion.p
                className="text-darkSand text-sm xs:text-[0.7rem] sm:text-[0.6rem] md:text-[0.8rem] lg:text-[0.8rem] xl:text-[1.0rem] 2xl:text-[1.2rem] leading-tight"
                variants={itemVariants}
              >
                Seamless online learning, built around your schedule.
                <br />
                Access lessons, assignments, and progress tracking anytime, from
                anywhere.
              </motion.p>

              <motion.div
                className="flex flex-row items-center justify-center gap-4 pt-1"
                variants={itemVariants}
              >
                <NavLink
                  to="/courses"
                  className="px-6 xs:px-4 sm:px-6 md:px-8 py-1 xs:py-2 sm:py-2 md:py-1 lg:py-1 xl:py-1 2xl:py-1 bg-forestGreen text-white font-medium rounded-lg hover:bg-black transition-colors duration-300 text-sm xs:text-xs md:text-sm lg:text-sm xl:text-base 2xl:text-lg "
                >
                  Get Started for Free
                </NavLink>
                <NavLink
                  to="/about-us"
                  className="px-6 xs:px-4 sm:px-6 md:px-8 py-1 xs:py-2 sm:py-2 md:py-1 lg:py-1 xl:py-1 2xl:py-1 bg-white text-[#00BB6E] font-medium border border-gray rounded-lg transition-all duration-300 text-sm xs:text-xs md:text-sm lg:text-sm xl:text-base 2xl:text-lg"
                >
                  Learn More
                </NavLink>
              </motion.div>
            </div>

            {/* Images Wrapper */}
            <div className="flex flex-row justify-center items-end w-full gap-2 xs:gap-4 sm:gap-12 md:contents pt-8 md:pt-0">
              {/* Left Image */}
              <motion.div
                className="md:absolute md:-bottom-[2.1875rem] md:left-0 md:ml-6 md:w-[25%] flex justify-center md:justify-start"
                variants={imageVariants}
              >
                <img
                  src="/assets/hero-1.png"
                  alt="Student learning"
                  className="w-36 xs:w-28 sm:w-48 md:w-64 lg:w-80 xl:w-96 2xl:w-[105%] object-contain"
                />
              </motion.div>

              {/* Right Image */}
              <motion.div
                className="md:absolute md:-bottom-[1.25rem] lg:-bottom-[1.25rem] xl:-bottom-[0.75rem] 2xl:-bottom-[0.1875rem] md:right-0 md:w-[25%] flex justify-center md:justify-end"
                variants={imageVariants}
              >
                <img
                  src="/assets/hero_2.png"
                  alt="Online education"
                  className="w-36 xs:w-28 sm:w-42 md:w-38 lg:w-56 xl:w-60 2xl:w-72 object-contain"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}