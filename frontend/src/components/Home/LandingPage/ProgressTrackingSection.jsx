import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const ProgressTrackingSection = () => {
    return (
        <section className="py-10 xs:py-2 md:py-6 bg-white">
            <motion.div
                className="container px-4 sm:px-6 md:px-6 lg:px-8 mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
            >
                <div
                    className="relative w-full rounded-[1rem] overflow-hidden"
                    style={{
                        backgroundImage: `url('/assets/Group 1261158261.png')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="flex flex-col md:flex-row items-center justify-center p-8 md:p-12 lg:p-20 gap-8 sm:gap-4 md:gap-8 lg:gap-12">
                        {/* Left Content */}
                        <div className="w-full md:w-1/2 flex flex-col items-center gap-8 md:gap-5 z-10 order-3 md:order-1">
                            <h2 className="text-4xl xs:text-xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-forestGreen leading-snug tracking-tight text-center">
                                From courses to progress tracking — <br className="hidden lg:block" />
                                all in one place.
                            </h2>

                            <Link to="/courses" className="hidden md:block bg-forestGreen text-white px-8 py-1.5 rounded-lg text-lg xs:text-sm md:text-base lg:text-md xl:text-lg 2xl:text-xl font-light mx-auto">
                                Get Started for Free
                            </Link>
                        </div>

                        {/* Mobile Button (Middle) */}
                        <Link to="/courses" className="md:hidden order-3 bg-forestGreen text-white px-8 py-1.5 rounded-lg text-lg xs:text-sm md:text-base lg:text-md xl:text-lg 2xl:text-xl font-light mx-auto">
                            Get Started for Free
                        </Link>

                        {/* Right Content - Illustration */}
                        <div className="w-full md:w-1/2 flex justify-center lg:justify-center z-10 order-1 md:order-2">
                            <img
                                src="/assets/Group 1261158567.png"
                                alt="Progress Tracking Illustration"
                                className="w-full max-w-[400px] xs:max-w-[230px] md:max-w-[240px] lg:max-w-[300px] xl:max-w-[400px] h-auto object-contain "
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

export default ProgressTrackingSection;
