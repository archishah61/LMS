/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { useGetUserFeaturesQuery } from '../../../services/LangingPage_Management/frontendFeaturesApi';
import PrimaryLoader from "../../../components/ui/PrimaryLoader"

export default function WhyChooseUs() {
    const { data: response, isLoading } = useGetUserFeaturesQuery();
    const features = response?.data || [];

    const getIconUrl = (iconPath) => {
        if (!iconPath) return "";
        if (iconPath.startsWith("http")) return iconPath;
        if (iconPath.startsWith("/assets/")) return iconPath;
        return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${iconPath}`;
    };

    if (isLoading) {
        return (
            <section className="py-12 bg-white">
                <PrimaryLoader />
            </section>
        );
    }

    return (
        <section className="py-12 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-2xl md:text-3xl lg:text-3xl font-bold text-forestGreen mb-2">
                        The Difference You'll Experience
                    </h2>
                    <p className="text-gray-600 max-w-lg mx-auto text-base md:text-lg md:leading-1">
                        Our platform is thoughtfully crafted to help you succeed, which is why learners worldwide choose us.
                    </p>
                </div>

                {/* Features Card */}
                <div
                    className="bg-sand rounded-[1rem] p-8 md:p-10 lg:p-16 relative overflow-hidden"
                    style={{
                        backgroundImage: "url('/assets/background_pattern.png')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                >
                    {/* Grid Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 md:gap-x-12 lg:gap-x-24 xl:gap-x-56 gap-y-8 md:gap-y-12 lg:gap-y-16 relative z-10 mx-auto md:mx-8 xl:mx-20">
                        {features.map((feature, index) => (
                            <div key={index} className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start text-center sm:text-left">
                                <div className={`shrink-0 w-12 h-12 md:w-14 md:h-14 xl:w-16 xl:h-16 rounded-md flex items-center justify-center ${feature.bgColor || 'bg-experience1'} sm:mt-2`}>
                                    <img
                                        src={getIconUrl(feature.icon)}
                                        alt={feature.title}
                                        className="w-6 h-6 md:w-8 md:h-8 xl:w-12 xl:h-12 object-contain"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-900 leading-relaxed text-sm">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}