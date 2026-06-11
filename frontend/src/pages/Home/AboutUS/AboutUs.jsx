/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import React, { useRef, useState } from "react";
import {
    Users,
    Award,
    BookOpen,
    Target,
    Check,
    ArrowRight,
    Youtube,
    GraduationCap,
    Facebook,
    Instagram,
    Mail,
    MapPin,
    Phone,
    Clock,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { FaXTwitter } from "react-icons/fa6";

import Statistics from "../../../components/Home/LandingPage/Statistics";
import { useGetAllAboutQuery } from "../../../services/Support/aboutApi";
import { useGetSeoMetaByPageTypeQuery } from "../../../services/LegalPages/seoMetaAPI";
import { Helmet } from "react-helmet-async";

const AboutUs = () => {
    const { data: response, error, isLoading, refetch } = useGetAllAboutQuery({ all: true, status: "active" });
    const aboutEntries = response?.data || []
    const teamSwiperRef = useRef(null);
    const [teamSwiperState, setTeamSwiperState] = useState({
        isBeginning: true,
        isEnd: true,
    });

    const { data: seoMetaData, isLoading: seoMetaLoading, error: seoMetaError } = useGetSeoMetaByPageTypeQuery({
        page_type: "about"
    });

    // Sample testimonials data
    const testimonials = [
        {
            quote: "Queekies transformed my learning experience completely. The interactive courses and personalized learning paths helped me master skills I struggled with for years. The community of learners and instructors is incredibly supportive.",
            name: "Emily Rodriguez",
            role: "Data Science Student",
            image: "/assets/testimonial2.jpeg"
        },
        {
            quote: "As someone who struggled with traditional education, Queekies was a game-changer. The flexibility to learn at my own pace combined with the engaging content made learning enjoyable again. I've completed three certifications already!",
            name: "Michael Chen",
            role: "Web Development Student",
            image: "/assets/testimonial3.jpg"
        },
        {
            quote: "The personalized feedback from instructors is what sets Queekies apart. Every time I submitted a project, I received detailed guidance on how to improve. This level of attention has accelerated my growth tremendously.",
            name: "Sophia Williams",
            role: "UX Design Student",
            image: "/assets/testimonial1.jpeg"
        },
        {
            quote: "I was skeptical about online learning until I tried Queekies. The interactive exercises and real-world projects provided practical experience that I could immediately apply to my job. The ROI has been incredible.",
            name: "James Peterson",
            role: "Business Analytics Student",
            image: "/assets/testimonial4.jpeg"
        }
    ];

    // Testimonial swiper state
    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    // Navigation functions for testimonials
    const nextTestimonial = () => {
        setCurrentTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    };

    const prevTestimonial = () => {
        setCurrentTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    };

    // Function to get full URLs for images
    const getFullUrl = (path) => {
        if (!path) return null;
        return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${path}`;
    };

    const shouldShowTeamControls = aboutEntries.length > 4;

    const syncTeamSwiperState = (swiper) => {
        setTeamSwiperState({
            isBeginning: swiper.isBeginning,
            isEnd: swiper.isEnd,
        });
    };

    // const stats = [
    //     { number: "10K+", label: "Active Students", icon: Users },
    //     { number: "500+", label: "Expert Instructors", icon: GraduationCap },
    //     { number: "1200+", label: "Learning Courses", icon: BookOpen },
    //     { number: "15+", label: "Years Experience", icon: Award }
    // ];

    const values = [
        {
            title: "Accessible Education",
            description: "We believe quality education should be accessible to everyone, regardless of location or background.",
            icon: Users
        },
        {
            title: "Innovation-Driven",
            description: "We constantly evolve our platform and methods to incorporate the latest educational technologies.",
            icon: Target
        },
        {
            title: "Student-Centered",
            description: "Every feature and course we develop focuses on enhancing the student learning experience.",
            icon: BookOpen
        },
        {
            title: "Excellence",
            description: "We maintain the highest standards for our content, instructors, and learning outcomes.",
            icon: Award
        }
    ];

    const seo = seoMetaData?.data;

    return (
        <div className="container px-8 text-gray-900 py-4 sm:py-6">
            <Helmet>
                {Boolean(seo?.is_active) ? (
                    <>
                        {/* Basic SEO */}
                        <title>{seo?.seo_title || "About Us"}</title>
                        <meta name="description" content={seo?.seo_description} />
                        <meta name="keywords" content={seo?.seo_keywords} />
                        <link rel="canonical" href={seo?.canonical_url || window.location.href} />

                        {/* OG Tags */}
                        <meta property="og:title" content={seo?.og_title || seo?.seo_title} />
                        <meta property="og:description" content={seo?.og_description || seo?.seo_description} />
                        <meta property="og:image" content={getFullUrl(seo?.og_image) || getFullUrl(seo?.seo_image)} />
                        <meta property="og:image:alt" content={seo?.og_alt} />
                        <meta property="og:url" content={seo?.canonical_url || window.location.href} />
                        <meta property="og:type" content="website" />

                        {/* Optional image dimensions */}
                        {seo?.seo_image && (
                            <>
                                <meta property="og:image:width" content="1200" />
                                <meta property="og:image:height" content="630" />
                            </>
                        )}

                        {/* Twitter Tags */}
                        <meta name="twitter:card" content="summary_large_image" />
                        <meta name="twitter:title" content={seo?.og_title || seo?.seo_title} />
                        <meta name="twitter:description" content={seo?.og_description || seo?.seo_description} />
                        <meta name="twitter:image" content={getFullUrl(seo?.og_image) || getFullUrl(seo?.seo_image)} />
                        <meta name="twitter:image:alt" content={seo?.og_alt} />

                        {/* JSON-LD Structured Data */}
                        <script type="application/ld+json">
                            {JSON.stringify({
                                "@context": "https://schema.org",
                                "@type": "WebPage",
                                "name": seo?.seo_title,
                                "description": seo?.seo_description,
                                "url": seo?.canonical_url || window.location.href,
                                "image": getFullUrl(seo?.seo_image),
                            })}
                        </script>
                    </>
                ) : (
                    <>
                        {/* RESET SEO */}
                        <title>Queekies</title>
                        <meta name="description" content="" />
                        <meta name="keywords" content="" />
                        <link rel="canonical" href={window.location.href} />

                        {/* Clear OG */}
                        <meta property="og:title" content="Queekies" />
                        <meta property="og:description" content="" />
                        <meta property="og:image" content="" />
                        <meta property="og:url" content={window.location.href} />

                        {/* Clear Twitter */}
                        <meta name="twitter:card" content="summary_large_image" />
                        <meta name="twitter:title" content="Queekies" />
                        <meta name="twitter:description" content="" />
                        <meta name="twitter:image" content="" />
                    </>
                )}
            </Helmet>

            {/* Hero Section */}
            <section className="py-6 sm:py-8 md:py-12 lg:py-12 xl:py-12">
                {/* Decorative Background Element - Optimized for all screens */}
                <div className="relative z-10">
                    <div className="text-center max-w-2xl sm:max-w-3xl mx-auto mb-8 sm:mb-10 md:mb-12 lg:mb-14 xl:mb-16">
                        <h1 className="text-2xl xs:text-2.5xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 md:mb-5 text-forestGreen">
                            About <span className="font-bold text-forestGreen">
                                Queekies
                            </span>
                            <span className="text-xs xs:text-sm sm:text-sm md:text-sm lg:text-base bg-leafGreen text-white px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full ml-1 sm:ml-1.5 md:ml-2 lg:ml-2">
                                LMS
                            </span>
                        </h1>
                        <p className="text-xs sm:text-sm md:text-base text-gray-500 mb-4 sm:mb-5 md:mb-6 px-2 sm:px-4 md:px-0">
                            Transforming Education Through Technology Since 2015
                        </p>
                        <div className="w-16 sm:w-18 md:w-20 h-0.5 sm:h-1 bg-leafGreen mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-16 items-center">
                        <div>
                            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 md:mb-4 lg:mb-4 text-forestGreen">Our Mission</h2>
                            <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm md:text-base leading-relaxed sm:leading-relaxed">
                                At Queekies, we're on a mission to democratize education by providing high-quality learning experiences
                                accessible to everyone. We believe that technology can break down barriers and create opportunities
                                for learners worldwide.
                            </p>
                            <p className="text-gray-600 mb-4 sm:mb-5 md:mb-6 text-xs sm:text-sm md:text-base leading-relaxed sm:leading-relaxed">
                                Our platform combines cutting-edge technology with proven educational methodologies to create
                                a learning environment that's engaging, effective, and tailored to individual needs.
                            </p>
                            <div className="flex items-center">
                                <a
                                    href="/courses"
                                    className="inline-flex items-center text-white bg-forestGreen hover:bg-secondaryForestGreen font-medium px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg shadow-sm transition-all duration-300 text-xs sm:text-sm md:text-base"
                                >
                                    Explore Our Courses <ArrowRight className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                                </a>
                            </div>
                        </div>
                        <div className="relative mt-4 sm:mt-0">
                            {/* Decorative solid background - hidden on mobile & tablet, shown on desktop and up */}
                            <div className="absolute -left-3 -top-3 sm:-left-4 sm:-top-4 md:-left-5 md:-top-5 lg:-left-6 lg:-top-6 w-full h-full bg-lightGreen rounded-lg sm:rounded-xl rotate-2 hidden lg:block"></div>
                            <img
                                src="/assets/StudentAboutus.svg"
                                alt="Students learning online"
                                className="rounded-lg sm:rounded-xl relative z-10 w-full shadow-md sm:shadow-lg"
                            />
                            {/* Trusted badge - hidden on mobile, shown on tablet and up */}
                            <div className="absolute -right-2 -bottom-2 sm:-right-3 sm:-bottom-3 md:-right-4 md:-bottom-4 lg:-right-5 lg:-bottom-5 p-2 sm:p-3 bg-white rounded-md sm:rounded-lg shadow-sm sm:shadow-md z-20 hidden sm:block">
                                <div className="flex items-center space-x-1.5 sm:space-x-2 bg-lightGreen p-2 sm:p-3 rounded-md sm:rounded-lg">
                                    <div className="bg-forestGreen rounded-full p-1.5 sm:p-2 text-white">
                                        <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                                    </div>
                                    <p className="text-xs sm:text-sm md:text-base font-medium text-gray-700 whitespace-nowrap">Trusted by 500K+ students</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <div className="py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
                <Statistics />
            </div>

            {/* Our Story Section */}
            <section className="py-8 sm:py-10 md:py-12 lg:py-10 xl:py-12">
                <div className="">
                    <div className="max-w-[280px] min-[320px]:max-w-xs xs:max-w-sm sm:max-w-2xl md:max-w-3xl mx-auto text-center mb-4 min-[320px]:mb-6 xs:mb-8 sm:mb-10 md:mb-12">
                        <h2 className="text-sm min-[320px]:text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 min-[320px]:mb-2 xs:mb-3 sm:mb-4 text-forestGreen">
                            Our Story
                        </h2>
                        <div className="w-10 min-[320px]:w-12 xs:w-14 sm:w-16 md:w-18 lg:w-20 h-0.5 min-[320px]:h-0.5 xs:h-0.75 sm:h-1 bg-leafGreen mx-auto rounded-full mb-1 min-[320px]:mb-2 xs:mb-3 sm:mb-4"></div>
                        <p className="text-[10px] min-[320px]:text-xs xs:text-sm sm:text-base md:text-lg text-gray-500 px-1 min-[320px]:px-2 xs:px-3 sm:px-4 md:px-0 leading-tight min-[320px]:leading-normal">
                            The journey that made us the leading learning platform
                        </p>
                    </div>

                    <div className="relative">
                        {/* Timeline - hidden on mobile, shown on tablet and up */}
                        <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 sm:w-1 bg-leafGreen/20"></div>

                        {/* Mobile Timeline (hidden below 320px, shown above) */}
                        <div className="hidden min-[320px]:block md:hidden absolute left-4 xs:left-6 sm:left-8 w-0.5 xs:w-0.75 sm:w-1 bg-leafGreen/20 h-full"></div>

                        {/* Timeline Items */}
                        <div className="space-y-3 min-[320px]:space-y-4 xs:space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 xl:space-y-16">
                            {/* 2015 */}
                            <div className="flex flex-col md:flex-row items-start">
                                {/* Content for screens below 320px - Rectangle structure without side line */}
                                <div className="min-[320px]:hidden bg-white p-2 rounded border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="flex items-start gap-2">
                                        <div className="flex-shrink-0">
                                            <div className="w-5 h-5 rounded bg-forestGreen text-white font-bold text-[10px] flex items-center justify-center shadow-sm">
                                                1
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xs font-bold text-forestGreen mb-1">2015: The Beginning</h3>
                                            <p className="text-[10px] text-gray-600 leading-tight">
                                                Founded with a vision to make education accessible to everyone, Queekies started as a small team
                                                of educators and technologists passionate about transforming learning.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content for mobile/tablet (320px and above) */}
                                <div className="hidden min-[320px]:block md:hidden pl-10 xs:pl-12 sm:pl-14">
                                    <div className="bg-white p-3 xs:p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                        <div className="flex items-center mb-2">
                                            <div className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-forestGreen text-white font-bold text-xs xs:text-sm sm:text-base shadow-md absolute left-0 transform -translate-x-1/2 ml-4 xs:ml-6 sm:ml-8">
                                                1
                                            </div>
                                            <h3 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold ml-2 xs:ml-3 text-forestGreen">2015: The Beginning</h3>
                                        </div>
                                        <p className="text-gray-600 text-xs xs:text-sm leading-relaxed ml-0">
                                            Founded with a vision to make education accessible to everyone, Queekies started as a small team
                                            of educators and technologists passionate about transforming learning.
                                        </p>
                                    </div>
                                </div>

                                {/* Content for desktop (right aligned) */}
                                <div className="hidden md:block md:w-1/2 md:pr-8 lg:pr-10 xl:pr-12 md:text-right">
                                    <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                        <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 text-forestGreen">2015: The Beginning</h3>
                                        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                                            Founded with a vision to make education accessible to everyone, Queekies started as a small team
                                            of educators and technologists passionate about transforming learning.
                                        </p>
                                    </div>
                                </div>

                                {/* Timeline number for desktop */}
                                <div className="hidden md:flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-forestGreen text-white font-bold shadow-md absolute left-1/2 transform -translate-x-1/2">
                                    1
                                </div>
                                <div className="hidden md:block md:w-1/2 md:pl-8 lg:pl-10 xl:pl-12 mt-4 sm:mt-6 md:mt-0"></div>
                            </div>

                            {/* 2018 */}
                            <div className="flex flex-col md:flex-row items-start">
                                {/* Content for screens below 320px - Rectangle structure without side line */}
                                <div className="min-[320px]:hidden bg-white p-2 rounded border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="flex items-start gap-2">
                                        <div className="flex-shrink-0">
                                            <div className="w-5 h-5 rounded bg-forestGreen text-white font-bold text-[10px] flex items-center justify-center shadow-sm">
                                                2
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xs font-bold text-forestGreen mb-1">2018: Platform Expansion</h3>
                                            <p className="text-[10px] text-gray-600 leading-tight">
                                                After serving our first 10,000 students, we expanded our platform to include more subjects
                                                and interactive learning tools, establishing partnerships with leading educators worldwide.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content for mobile/tablet (320px and above) */}
                                <div className="hidden min-[320px]:block md:hidden pl-10 xs:pl-12 sm:pl-14">
                                    <div className="bg-white p-3 xs:p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                        <div className="flex items-center mb-2">
                                            <div className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-forestGreen text-white font-bold text-xs xs:text-sm sm:text-base shadow-md absolute left-0 transform -translate-x-1/2 ml-4 xs:ml-6 sm:ml-8">
                                                2
                                            </div>
                                            <h3 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold ml-2 xs:ml-3 text-forestGreen">2018: Platform Expansion</h3>
                                        </div>
                                        <p className="text-gray-600 text-xs xs:text-sm leading-relaxed ml-0">
                                            After serving our first 10,000 students, we expanded our platform to include more subjects
                                            and interactive learning tools, establishing partnerships with leading educators worldwide.
                                        </p>
                                    </div>
                                </div>

                                {/* Content for desktop (left aligned) */}
                                <div className="hidden md:block md:w-1/2 md:pr-8 lg:pr-10 xl:pr-12 md:text-right"></div>
                                {/* Timeline number for desktop */}
                                <div className="hidden md:flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-forestGreen text-white font-bold shadow-md absolute left-1/2 transform -translate-x-1/2">
                                    2
                                </div>
                                <div className="hidden md:block md:w-1/2 md:pl-8 lg:pl-10 xl:pl-12 mt-4 sm:mt-6 md:mt-0">
                                    <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                        <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 text-forestGreen">2018: Platform Expansion</h3>
                                        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                                            After serving our first 10,000 students, we expanded our platform to include more subjects
                                            and interactive learning tools, establishing partnerships with leading educators worldwide.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 2020 */}
                            <div className="flex flex-col md:flex-row items-start">
                                {/* Content for screens below 320px - Rectangle structure without side line */}
                                <div className="min-[320px]:hidden bg-white p-2 rounded border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="flex items-start gap-2">
                                        <div className="flex-shrink-0">
                                            <div className="w-5 h-5 rounded bg-forestGreen text-white font-bold text-[10px] flex items-center justify-center shadow-sm">
                                                3
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xs font-bold text-forestGreen mb-1">2020: Global Reach</h3>
                                            <p className="text-[10px] text-gray-600 leading-tight">
                                               When the world needed online learning more than ever, Queekies scaled to meet the demand, introducing AI-powered learning paths and personalized education for learners of all ages.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content for mobile/tablet (320px and above) */}
                                <div className="hidden min-[320px]:block md:hidden pl-10 xs:pl-12 sm:pl-14">
                                    <div className="bg-white p-3 xs:p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                        <div className="flex items-center mb-2">
                                            <div className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-forestGreen text-white font-bold text-xs xs:text-sm sm:text-base shadow-md absolute left-0 transform -translate-x-1/2 ml-4 xs:ml-6 sm:ml-8">
                                                3
                                            </div>
                                            <h3 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold ml-2 xs:ml-3 text-forestGreen">2020: Global Reach</h3>
                                        </div>
                                        <p className="text-gray-600 text-xs xs:text-sm leading-relaxed ml-0">
                                            When the world needed online learning more than ever, Queekies scaled to meet the demand, introducing AI-powered learning paths and personalized education for learners of all ages.
                                        </p>
                                    </div>
                                </div>

                                {/* Content for desktop (right aligned) */}
                                <div className="hidden md:block md:w-1/2 md:pr-8 lg:pr-10 xl:pr-12 md:text-right">
                                    <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                        <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 text-forestGreen">2020: Global Reach</h3>
                                        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                                            When the world needed online learning more than ever, Queekies scaled to meet the demand, introducing AI-powered learning paths and personalized education for learners of all ages.
                                        </p>
                                    </div>
                                </div>

                                {/* Timeline number for desktop */}
                                <div className="hidden md:flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-forestGreen text-white font-bold shadow-md absolute left-1/2 transform -translate-x-1/2">
                                    3
                                </div>
                                <div className="hidden md:block md:w-1/2 md:pl-8 lg:pl-10 xl:pl-12 mt-4 sm:mt-6 md:mt-0"></div>
                            </div>

                            {/* Present */}
                            <div className="flex flex-col md:flex-row items-start">
                                {/* Content for screens below 320px - Rectangle structure without side line */}
                                <div className="min-[320px]:hidden bg-white p-2 rounded border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="flex items-start gap-2">
                                        <div className="flex-shrink-0">
                                            <div className="w-5 h-5 rounded bg-forestGreen text-white font-bold text-[10px] flex items-center justify-center shadow-sm">
                                                4
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xs font-bold text-forestGreen mb-1">Today: Leading the Future</h3>
                                            <p className="text-[10px] text-gray-600 leading-tight">
                                                Today, Queekies stands as a leader in educational technology, continuously innovating
                                                to create more immersive, effective, and personalized learning experiences.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content for mobile/tablet (320px and above) */}
                                <div className="hidden min-[320px]:block md:hidden pl-10 xs:pl-12 sm:pl-14">
                                    <div className="bg-white p-3 xs:p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                        <div className="flex items-center mb-2">
                                            <div className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-forestGreen text-white font-bold text-xs xs:text-sm sm:text-base shadow-md absolute left-0 transform -translate-x-1/2 ml-4 xs:ml-6 sm:ml-8">
                                                4
                                            </div>
                                            <h3 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold ml-2 xs:ml-3 text-forestGreen">Today: Leading the Future</h3>
                                        </div>
                                        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed ml-0">
                                            Today, Queekies stands as a leader in educational technology, continuously innovating
                                            to create more immersive, effective, and personalized learning experiences.
                                        </p>
                                    </div>
                                </div>

                                {/* Content for desktop (left aligned) */}
                                <div className="hidden md:block md:w-1/2 md:pr-8 lg:pr-10 xl:pr-12 md:text-right"></div>
                                {/* Timeline number for desktop */}
                                <div className="hidden md:flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-forestGreen text-white font-bold shadow-md absolute left-1/2 transform -translate-x-1/2">
                                    4
                                </div>
                                <div className="hidden md:block md:w-1/2 md:pl-8 lg:pl-10 xl:pl-12 mt-4 sm:mt-6 md:mt-0">
                                    <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                        <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 text-forestGreen">Today: Leading the Future</h3>
                                        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                                            Today, Queekies stands as a leader in educational technology, continuously innovating
                                            to create more immersive, effective, and personalized learning experiences.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Values Section */}
            <section className="py-8 sm:py-10 md:py-12 lg:py-16 mt-20 bg-lightGreen">
                <div className="container mx-auto">
                    <div className="max-w-2xl sm:max-w-3xl mx-auto text-center mb-8 sm:mb-10 md:mb-12">
                        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-forestGreen">
                            Our Core Values
                        </h2>
                        <div className="w-16 sm:w-18 md:w-20 h-0.5 sm:h-1 bg-leafGreen mx-auto rounded-full mb-3 sm:mb-4"></div>
                        <p className="text-xs sm:text-sm md:text-base text-gray-500 px-2 sm:px-4 md:px-0">
                            The principles that guide our mission and vision
                        </p>
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-10">
                        {values.map((value, index) => {
                            const Icon = value.icon;
                            return (
                                <div key={index} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 group">
                                    <div className="p-2 sm:p-3 md:p-4 rounded-full bg-lightGreen inline-block mb-3 sm:mb-4 group-hover:bg-leafGreen transition-all duration-300">
                                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 text-forestGreen group-hover:text-white transition-all duration-300" />
                                    </div>
                                    <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 text-forestGreen">
                                        {value.title}
                                    </h3>
                                    <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed">
                                        {value.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
                <div className="">
                    <div className="max-w-2xl sm:max-w-3xl mx-auto text-center mb-8 sm:mb-10 md:mb-12">
                        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-forestGreen">
                            Meet Our Team
                        </h2>
                        <div className="w-16 sm:w-18 md:w-20 h-0.5 sm:h-1 bg-leafGreen mx-auto rounded-full mb-3 sm:mb-4"></div>
                        <p className="text-xs sm:text-sm md:text-base text-gray-500 px-2 sm:px-4 md:px-0">
                            The passionate educators and technologists behind Queekies
                        </p>
                    </div>
                    {aboutEntries.length > 0 ? (
                        <div className="relative">
                            <Swiper
                                modules={[Pagination]}
                                onSlideChange={syncTeamSwiperState}
                                loop={false}
                                spaceBetween={18}
                                slidesPerView={1}
                                breakpoints={{
                                    480: {
                                        slidesPerView: 1.15,
                                        spaceBetween: 18,
                                    },
                                    640: {
                                        slidesPerView: 1.6,
                                        spaceBetween: 20,
                                    },
                                    768: {
                                        slidesPerView: 2.1,
                                        spaceBetween: 22,
                                    },
                                    1024: {
                                        slidesPerView: 3,
                                        spaceBetween: 24,
                                    },
                                    1280: {
                                        slidesPerView: 4,
                                        spaceBetween: 28,
                                    },
                                }}
                                pagination={{
                                    clickable: true,
                                    bulletClass: 'swiper-pagination-bullet bg-forestGreen opacity-50',
                                    bulletActiveClass: 'swiper-pagination-bullet-active !opacity-100 !bg-forestGreen'
                                }}
                                className="!px-1 [&_.swiper-wrapper]:!items-stretch"
                            >
                                {aboutEntries.map((member) => (
                                    <SwiperSlide key={member.id} className="!h-auto !flex pb-10">
                                        <div className="group h-full w-full bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
                                            <div className="relative mb-3 sm:mb-4 md:mb-5 overflow-hidden rounded-lg">
                                                <div className="absolute -inset-0.5 sm:-inset-1 bg-forestGreen rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-20 blur transition duration-300"></div>
                                                <div className="relative">
                                                    <img
                                                        src={member.img ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${member.img}` : "/assets/placeholder2.png"}
                                                        alt={member.name}
                                                        className="w-full h-44 xs:h-40 sm:h-44 md:h-48 lg:h-56 object-cover rounded-lg"
                                                        onError={(e) => { e.currentTarget.src = '/assets/placeholder2.png'; }}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/30 to-transparent opacity-0 group-hover:opacity-80 transition-all duration-300 flex items-end justify-center p-3 sm:p-4">
                                                        <div className="flex space-x-2 sm:space-x-3">
                                                            {member.x && (
                                                                <a
                                                                    href={member.x}
                                                                    className="p-2 bg-white rounded-full text-forestGreen hover:text-leafGreen transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <FaXTwitter size={12} className="sm:size-3 md:size-3.5" />
                                                                </a>
                                                            )}
                                                            {member.instagram && (
                                                                <a
                                                                    href={member.instagram}
                                                                    className="p-2 bg-white rounded-full text-forestGreen hover:text-leafGreen transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100"
                                                                    style={{ transitionDelay: "100ms" }}
                                                                >
                                                                    <Instagram size={12} className="sm:size-3 md:size-3.5" />
                                                                </a>
                                                            )}
                                                            {member.facebook && (
                                                                <a
                                                                    href={member.facebook}
                                                                    className="p-2 bg-white rounded-full text-forestGreen hover:text-leafGreen transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100"
                                                                    style={{ transitionDelay: "200ms" }}
                                                                >
                                                                    <Facebook size={12} className="sm:size-3 md:size-3.5" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{member.name}</h3>
                                            <p className="text-xs sm:text-sm md:text-base text-forestGreen mb-1.5 sm:mb-2 md:mb-3 lg:mb-4">{member.position}</p>
                                            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-3">{member.description}</p>
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-white/70 py-12 text-center text-sm text-gray-500">
                            Team member information will be available soon.
                        </div>
                    )}
                </div>
            </section>

            {/* Testimonial Section with Swiper */}
            <section className="py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20 bg-forestGreen rounded-xl text-white">
                <div className="container mx-auto">
                    <div className="flex flex-col lg:flex-row items-center">
                        <div className="lg:w-1/2 mb-6 sm:mb-8 md:mb-10 lg:mb-0 lg:pr-8 xl:pr-10 2xl:pr-12 text-center lg:text-left">
                            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">What Our Students Say</h2>
                            <div className="w-16 sm:w-18 md:w-20 h-0.5 sm:h-1 bg-white rounded-full mb-3 sm:mb-4 mx-auto lg:mx-0"></div>
                            <p className="text-xs sm:text-sm md:text-base opacity-90 mb-4 sm:mb-5 md:mb-6 px-2 sm:px-4 md:px-0">
                                Hear from our community of learners about how Queekies has transformed their educational experience.
                            </p>
                        </div>
                        <div className="lg:w-1/2">
                            <div className="relative">
                                {/* Testimonial Card */}
                                <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10 text-gray-800 shadow-lg sm:shadow-xl min-h-40 sm:min-h-44 md:min-h-48 lg:min-h-56 xl:min-h-64">
                                    {/* Quote icon - hidden on mobile, shown on tablet and up */}
                                    <div className="absolute -top-4 -left-4 sm:-top-5 sm:-left-5 md:-top-6 md:-left-6 lg:-top-7 lg:-left-7 xl:-top-8 xl:-left-8 h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-10 lg:w-10 xl:h-14 xl:w-14 bg-yellow-400 rounded-full items-center justify-center hidden sm:flex">
                                        <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 xl:h-7 xl:w-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
                                        </svg>
                                    </div>
                                    <div className="h-20 sm:h-24 md:h-28 lg:h-32 xl:h-36 overflow-hidden">
                                        <p className="text-gray-600 mb-3 sm:mb-4 md:mb-5 lg:mb-6 italic text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed">
                                            "{testimonials[currentTestimonial].quote}"
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16">
                                            <img
                                                src={testimonials[currentTestimonial].image || `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`}
                                                alt="Student testimonial"
                                                className="h-full w-full rounded-full object-cover"
                                            />
                                        </div>
                                        <div className="ml-2.5 sm:ml-3 md:ml-4 lg:ml-5 xl:ml-6">
                                            <h4 className="font-bold text-gray-800 text-xs sm:text-sm md:text-base lg:text-lg">{testimonials[currentTestimonial].name}</h4>
                                            <p className="text-forestGreen text-xs sm:text-sm md:text-base">{testimonials[currentTestimonial].role}</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Navigation Buttons */}
                                <div className="flex justify-between mt-3 sm:mt-4 md:mt-5 lg:mt-6">
                                    <button
                                        onClick={prevTestimonial}
                                        className="p-1.5 sm:p-2 md:p-2.5 lg:p-2.5 bg-white rounded-full text-forestGreen hover:text-leafGreen transition-all duration-300 shadow-sm sm:shadow-md"
                                    >
                                        <ChevronLeft className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7" />
                                    </button>
                                    {/* Pagination Indicators */}
                                    <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 lg:space-x-3">
                                        {testimonials.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentTestimonial(index)}
                                                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 xl:w-4 xl:h-4 rounded-full transition-all duration-300 ${currentTestimonial === index ? 'bg-white' : 'bg-white bg-opacity-50'
                                                    }`}
                                                aria-label={`Go to testimonial ${index + 1}`}
                                            ></button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={nextTestimonial}
                                        className="p-1.5 sm:p-2 md:p-2.5 lg:p-2.5 bg-white rounded-full text-forestGreen hover:text-leafGreen transition-all duration-300 shadow-sm sm:shadow-md"
                                    >
                                        <ChevronRight className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">

                <div className="bg-lightGreen rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10 2xl:p-12 relative overflow-hidden">
                    {/* Decorative Elements - Optimized for all screens */}
                    <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-64 lg:h-64 xl:w-80 xl:h-80 bg-forestGreen rounded-full opacity-5 transform translate-x-1/4 -translate-y-1/4 sm:translate-x-1/3 sm:-translate-y-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-64 lg:h-64 xl:w-80 xl:h-80 bg-forestGreen rounded-full opacity-5 transform -translate-x-1/4 translate-y-1/4 sm:-translate-x-1/3 sm:translate-y-1/3"></div>

                    <div className="relative z-10 max-w-2xl sm:max-w-3xl mx-auto text-center">
                        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-forestGreen">
                            Ready to Start Your Learning Journey?
                        </h2>
                        <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-4 sm:mb-5 md:mb-6 px-2 sm:px-4 md:px-0">
                            Join thousands of learners who have transformed their careers and lives through <span className="font-bold text-forestGreen">
                                Queekies.
                            </span>
                            <br className="hidden sm:block" />
                            Start exploring our courses today.
                        </p>
                        <div className="flex flex-col sm:flex-row space-y-2.5 sm:space-y-0 sm:space-x-3 md:space-x-4 justify-center">
                            <a
                                href="/courses"
                                className="inline-flex items-center justify-center text-white bg-forestGreen hover:bg-secondaryForestGreen font-medium px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg shadow-sm transition-all duration-300 text-xs sm:text-sm md:text-base"
                            >
                                Explore Courses
                            </a>
                            <a
                                href="/contact-us"
                                className="inline-flex items-center justify-center bg-white text-forestGreen font-medium px-4 sm:px-5 md:px-6 lg:px-7 xl:px-8 py-2 sm:py-2.5 md:py-3 lg:py-4 rounded-lg shadow-md hover:shadow-lg border border-forestGreen/10 transition-all duration-300 text-xs sm:text-sm md:text-base lg:text-lg"
                            >
                                Contact Us
                            </a>
                        </div>
                    </div>
                </div>

            </section>
        </div>
    );
};

export default AboutUs;