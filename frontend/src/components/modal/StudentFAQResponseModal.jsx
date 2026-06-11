import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useGetCourseFAQsByCourseIdQuery } from "../../services/Course_Management/courseFAQApi";
import { useGetFAQOptionsByFAQIdsQuery } from "../../services/Course_Management/courseFAQOptionApi";
import { useCreateStudentFAQResponseMutation } from "../../services/Student_Management/studentFAQResponseApi";
import { useLocation } from "react-router-dom";
import { getStudentToken } from "../../services/CookieService";
import PrimaryLoader from "../ui/PrimaryLoader";

export default function StudentFAQResponseModal() {

    const location = useLocation();
    const { access_token } = getStudentToken()
    const { course_id, user_id } = location.state;

    const { data: faqs, isLoading: faqsLoading } = useGetCourseFAQsByCourseIdQuery({ course_id, access_token });
    const [createResponse] = useCreateStudentFAQResponseMutation();

    const [faqList, setFaqList] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get FAQ IDs to fetch options in bulk
    const faqIds = faqs?.map(faq => faq.id) || [];
    const { data: optionsData, isLoading: optionsLoading } = useGetFAQOptionsByFAQIdsQuery({ faq_ids: faqIds, access_token }, {
        skip: faqIds.length === 0,
    });

    // Store options mapped to their FAQs
    const [optionsMap, setOptionsMap] = useState({});

    useEffect(() => {
        if (faqs) {
            setFaqList(faqs);
        }
    }, [faqs]);

    useEffect(() => {
        if (optionsData) {
            const mappedOptions = {};
            optionsData.forEach(option => {
                if (!mappedOptions[option.faq_id]) {
                    mappedOptions[option.faq_id] = [];
                }
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

        setIsSubmitting(true);

        try {
            await createResponse({
                user_id,
                course_id,
                faq_id: faqList[currentIndex].id,
                selected_option_id: selectedOption,
                created_by: user_id,
                access_token
            }).unwrap();

            toast.success("Response submitted!");

            // Move to next question
            if (currentIndex + 1 < faqList.length) {
                setCurrentIndex(currentIndex + 1);
                setSelectedOption(null);
            } else {
                // If last question, close the modal
                toast.success("All questions answered!");
                onClose();
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

    if (!faqList.length) {
        return <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">No FAQs available.</div>;
    }

    const currentFAQ = faqList[currentIndex];

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Course Questionnaire</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
                </div>

                {/* Display the current FAQ */}
                <div className="mt-4">
                    <h3 className="text-lg font-semibold">{currentFAQ.question}</h3>

                    {/* Display Options */}
                    <div className="mt-2 space-y-2">
                        {optionsMap[currentFAQ.id]?.map(option => (
                            <label key={option.id} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-100">
                                <input
                                    type="radio"
                                    name="faq_option"
                                    value={option.id}
                                    checked={selectedOption === option.id}
                                    onChange={() => setSelectedOption(option.id)}
                                    className="cursor-pointer accent-leafGreen"
                                />
                                {option.option_text}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-end mt-4">
                    <button
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                        {currentIndex + 1 < faqList.length ? "Next" : "Submit"}
                    </button>
                </div>
            </div>
        </div>
    );
}
