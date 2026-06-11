import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useGetCourseFAQsByCourseIdQuery } from "../../services/Course_Management/courseFAQApi";
import { useGetFAQOptionsByFAQIdsQuery } from "../../services/Course_Management/courseFAQOptionApi";
import { useCreateStudentFAQResponseMutation } from "../../services/Student_Management/studentFAQResponseApi";
import { getStudentToken } from "../../services/CookieService";
import PrimaryLoader from "../../components/ui/PrimaryLoader";

export default function FAQResponsePage() {
    const location = useLocation();
    const navigate = useNavigate();

    const { access_token } = getStudentToken()

    // ✅ Get the necessary data from location.state
    const { course_id, user_id } = location.state || {};

    // ✅ Handle missing data
    useEffect(() => {
        window.scrollTo(0, 0);

        if (!course_id || !user_id || !access_token) {
            toast.error("Invalid access to FAQ response page.");
            navigate("/"); // Redirect back to home if data is missing
        }
    }, [course_id, user_id, access_token, navigate]);

    const { data: faqs, isLoading: faqsLoading } = useGetCourseFAQsByCourseIdQuery({ course_id, access_token });

    const response = useGetCourseFAQsByCourseIdQuery({ course_id, access_token });
    const [createResponse] = useCreateStudentFAQResponseMutation();

    const [faqList, setFaqList] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle navigation when FAQs are loaded but empty
    useEffect(() => {
        if (faqs && faqs.length === 0 && !faqsLoading) {
            // toast("No FAQs available for this course.");
            navigate("/student-dashboard");
        } else if (faqs && faqs.length > 0) {
            setFaqList(faqs);
        }
    }, [faqs, faqsLoading, navigate]);

    // Fetch all FAQ IDs to get options in bulk
    const faqIds = faqs?.map(faq => faq.id) || [];
    const { data: optionsData, isLoading: optionsLoading } = useGetFAQOptionsByFAQIdsQuery({ faq_ids: faqIds, access_token }, {
        skip: faqIds.length === 0,
    });

    const [optionsMap, setOptionsMap] = useState({});

    useEffect(() => {
        if (optionsData) {
            const mappedOptions = {};
            optionsData.forEach(option => {
                if (!mappedOptions[option.faq_id]) mappedOptions[option.faq_id] = [];
                mappedOptions[option.faq_id].push(option);
            });
            setOptionsMap(mappedOptions);
        }
    }, [optionsData]);

    const handleNext = async () => {
        if (!selectedOption) {
            toast.error("Please select an option before proceeding.");
            return;
        }

        const currentFAQId = faqList[currentIndex].id;

        setIsSubmitting(true);

        try {
            await createResponse({
                user_id,
                course_id,
                faq_id: currentFAQId,
                selected_option_id: selectedOption,
                created_by: user_id,
                access_token
            }).unwrap();

            // Only show "All questions answered!" toast when all questions are done
            if (currentIndex + 1 >= faqList.length) {
                toast.success("All questions answered!");
            }

            if (currentIndex + 1 < faqList.length) {
                setCurrentIndex(prevIndex => prevIndex + 1);
                setSelectedOption(null);
            } else {
                navigate(`/student-dashboard`);
            }

        } catch (error) {
            const errorMessage = error?.data?.error ||
                error?.data?.message ||
                error?.error ||
                error?.message ||
                'Failed to delete role';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (faqsLoading || optionsLoading) {
        return <PrimaryLoader />;
    }

    // Safety check - if no FAQs in the list, show loading until the useEffect redirects
    if (!faqList.length) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    Redirecting...
                </div>
            </div>
        );
    }

    const currentFAQ = faqList[currentIndex];
    const progress = ((currentIndex + 1) / faqList.length) * 100;

    const handleSkip = () => {
        if (currentIndex + 1 < faqList.length) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
        } else {
            navigate(`/student-dashboard`);
        }
    };

    const handleSkipAll = () => {
        toast("You skipped all questions.");
        navigate(`/student-dashboard`);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-sand p-4 lg:p-6">
            <div className="bg-white p-6 lg:p-8 rounded-md border border-gray-200 w-full max-w-md lg:max-w-lg">
                {/* Logo and title */}
                <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-lightGreen p-2 rounded-md">
                        <svg
                            className="w-5 h-5 text-leafGreen"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-forestGreen">
                        Course Question
                    </h2>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
                    <div
                        className="h-1.5 rounded-full bg-leafGreen transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {/* Progress text */}
                <div className="text-sm text-gray-500 mb-4 font-medium text-center lg:text-left">
                    Question {currentIndex + 1} of {faqList.length}
                </div>

                {/* Question */}
                {currentFAQ ? (
                    <h3 className="text-lg font-semibold text-forestGreen mb-6 leading-relaxed text-center lg:text-left">
                        {currentFAQ.question}
                    </h3>
                ) : (
                    <h3 className="text-lg font-semibold text-gray-700 mb-6">No more questions.</h3>
                )}

                {/* Options */}
                <div className="mt-4 space-y-3">
                    {optionsMap[currentFAQ.id]?.map(option => (
                        <label
                            key={option.id}
                            className={`flex items-center gap-3 p-4 border rounded-md cursor-pointer transition-colors duration-200 ${selectedOption === option.id
                                ? 'border-leafGreen bg-lightGreen'
                                : 'border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <div className={`flex-shrink-0 relative flex items-center justify-center w-5 h-5 rounded-full border ${selectedOption === option.id
                                ? 'border-leafGreen bg-leafGreen'
                                : 'border-gray-300 bg-white'
                                }`}>
                                {selectedOption === option.id && (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                                <input
                                    type="radio"
                                    name="faq_option"
                                    value={option.id}
                                    checked={selectedOption === option.id}
                                    onChange={() => setSelectedOption(option.id)}
                                    className="sr-only"
                                />
                            </div>
                            <span className={`text-sm lg:text-base ${selectedOption === option.id ? 'text-forestGreen font-medium' : 'text-gray-600'} leading-relaxed`}>
                                {option.option_text}
                            </span>
                        </label>
                    ))}
                </div>

                {/* Buttons */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mt-8 gap-4">
                    {/* Skip buttons */}
                    <div className="flex gap-3 justify-center lg:justify-start">
                        <button
                            onClick={handleSkip}
                            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Skip
                        </button>
                        <button
                            onClick={handleSkipAll}
                            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                        >
                            Skip All
                        </button>
                    </div>

                    {/* Next button */}
                    <button
                        onClick={handleNext}
                        disabled={isSubmitting || !selectedOption}
                        className="px-6 py-2.5 rounded-md bg-leafGreen text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full lg:w-auto"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Submitting...</span>
                            </div>
                        ) : (
                            currentIndex + 1 < faqList.length ? "Next Question" : "Submit Answers"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}