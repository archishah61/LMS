import { UserPlus, BookOpen, GraduationCap } from "lucide-react";

const steps = [
    {
        icon: <UserPlus className="w-6 h-6 text-indigo-600" />,
        title: "Sign Up",
        description: "Create your account in less than a minute and get immediate access to our platform.",
    },
    {
        icon: <BookOpen className="w-6 h-6 text-indigo-600" />,
        title: "Choose a Course",
        description: "Browse our extensive catalog and select the course that matches your goals and interests.",
    },
    {
        icon: <GraduationCap className="w-6 h-6 text-indigo-600" />,
        title: "Start Learning",
        description: "Dive into high-quality video lessons, hands-on projects, and interactive quizzes at your own pace.",
    },
];

export default function HowItWorks() {

    return (
        <section className={`py-12 md:py-16 bg-white px-4 sm:px-6 lg:px-8`}>
            <div className="max-w-7xl mx-auto">
                {/* Section Heading */}
                <div className="text-center mb-12 md:mb-16">
                    <span className="text-xs bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1 rounded-full mb-4 inline-block">
                        GET STARTED EASILY
                    </span>
                    <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4`}>
                        How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Works</span>
                    </h2>
                    <p className={`text-gray-600 max-w-2xl mx-auto text-base md:text-lg`}>
                        Getting started with our platform is simple. Follow these easy steps to begin your learning journey.
                    </p>
                </div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {steps.map((step, index) => (
                        <div key={index} className="relative">
                            <div className={`bg-gray-50 hover:from-indigo-50 hover:to-purple-50 rounded-xl p-6 md:p-8 text-center h-full transition-all duration-300 hover:shadow-lg hover:bg-gradient-to-br transform hover:-translate-y-1`}>

                                {/* Step Number */}
                                <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xl md:text-2xl font-bold mb-4 md:mb-6">
                                    {index + 1}
                                </div>

                                {/* Step Icon */}
                                <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4 md:mb-6">
                                    <div className="w-5 h-5 md:w-6 md:h-6">
                                        {step.icon}
                                    </div>
                                </div>

                                {/* Step Title & Description */}
                                <h3 className={`text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3`}>{step.title}</h3>
                                <p className={`text-gray-600 text-sm md:text-base`}>{step.description}</p>
                            </div>

                            {/* Arrows (Only for Steps Before Last One) */}
                            {index < steps.length - 1 && (
                                <div className="hidden md:flex justify-center absolute top-1/2 right-[-16px] md:right-[-20px] transform -translate-y-1/2">
                                    <svg className={`w-10 h-10 md:w-12 md:h-12 text-indigo-200`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}