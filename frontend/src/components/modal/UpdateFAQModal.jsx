/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
    useGetCourseFAQsByCourseIdQuery,
    useUpdateCourseFAQMutation,
    useDeleteCourseFAQMutation,
    useCreateCourseFAQMutation
} from "../../services/Course_Management/courseFAQApi";

import {
    useGetFAQOptionsByFAQIdsQuery,
    useUpdateFAQOptionMutation,
    useDeleteFAQOptionMutation,
    useCreateFAQOptionsMutation
} from "../../services/Course_Management/courseFAQOptionApi";

import AIContentGenerator from "../Home/courses/AIContentGenrator";
import { List, Loader2, MessageSquare, Plus, Trash2, X } from "lucide-react";

export default function UpdateFAQModal({ course_id, onClose, access_token }) {
    const { data: faqs, refetch } = useGetCourseFAQsByCourseIdQuery({ course_id, access_token });
    const [updateFAQ] = useUpdateCourseFAQMutation();
    const [deleteFAQ] = useDeleteCourseFAQMutation();
    const [createFAQ] = useCreateCourseFAQMutation();
    const [updateOption] = useUpdateFAQOptionMutation();
    const [deleteOption] = useDeleteFAQOptionMutation();
    const [createFAQOptions] = useCreateFAQOptionsMutation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [faqList, setFaqList] = useState([]);

    useEffect(() => {
        if (faqs) {
            setFaqList(
                faqs.map(faq => ({
                    ...faq,
                    newOptions: [],
                    existingOptions: []
                }))
            );
        }
    }, [faqs]);

    const faqIds = faqList.map(faq => faq.id).filter(id => id);
    const { data: fetchedOptions } = useGetFAQOptionsByFAQIdsQuery({ faq_ids: faqIds, access_token }, {
        skip: faqIds.length === 0,
    });

    useEffect(() => {
        if (fetchedOptions) {
            setFaqList(prevFaqs =>
                prevFaqs.map(faq => ({
                    ...faq,
                    existingOptions: fetchedOptions.filter(opt => opt.faq_id === faq.id),
                }))
            );
        }
    }, [fetchedOptions]);

    const handleFAQChange = (faqIndex, value) => {
        const updatedFAQs = [...faqList];
        updatedFAQs[faqIndex].question = value;
        setFaqList(updatedFAQs);
    };

    const handleFAQStatusChange = (faqIndex, value) => {
        const updatedFAQs = [...faqList];
        updatedFAQs[faqIndex].is_active = value;
        setFaqList(updatedFAQs);
    };

    const handleExistingOptionChange = (faqIndex, optionIndex, value) => {
        setFaqList(prevFaqs => {
            const updatedFAQs = [...prevFaqs];
            updatedFAQs[faqIndex] = {
                ...updatedFAQs[faqIndex],
                existingOptions: updatedFAQs[faqIndex].existingOptions.map((opt, idx) =>
                    idx === optionIndex ? { ...opt, option_text: value } : opt
                ),
            };
            return updatedFAQs;
        });
    };

    const handleNewOptionChange = (faqIndex, optionIndex, value) => {
        const updatedFAQs = [...faqList];
        updatedFAQs[faqIndex].newOptions[optionIndex] = value;
        setFaqList(updatedFAQs);
    };

    const addFAQ = () => {
        setFaqList([...faqList, { question: "", newOptions: [""], existingOptions: [] }]);
    };

    const removeFAQ = async (faqIndex, faqId) => {
        if (faqId) {
            try {
                await deleteFAQ({ id: faqId, access_token }).unwrap();
                toast.success("FAQ deleted successfully");
            } catch (error) {
                toast.error("Failed to delete FAQ");
                return;
            }
        }
        setFaqList(faqList.filter((_, i) => i !== faqIndex));
    };

    const addNewOption = (faqIndex) => {
        const updatedFAQs = [...faqList];
        updatedFAQs[faqIndex].newOptions.push("");
        setFaqList(updatedFAQs);
    };

    const removeNewOption = (faqIndex, optionIndex) => {
        const updatedFAQs = [...faqList];
        updatedFAQs[faqIndex].newOptions.splice(optionIndex, 1);
        setFaqList(updatedFAQs);
    };

    const removeExistingOption = async (faqIndex, optionIndex, optionId) => {
        if (optionId) {
            try {
                await deleteOption({ id: optionId, access_token }).unwrap();
            } catch (error) {
                toast.error("Failed to delete option");
                return;
            }
        }
        const updatedFAQs = [...faqList];
        updatedFAQs[faqIndex].existingOptions.splice(optionIndex, 1);
        setFaqList(updatedFAQs);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        let validationError = false;

        faqList.map((faq) => {
            if (faq.existingOptions?.length === 0 && faq.newOptions?.length === 0) {
                validationError = true;
            }
        });

        if (validationError) {
            toast.error("Atleast one option is required in each FAQs");
            setIsSubmitting(false);
            return;
        }

        try {
            await Promise.all(
                faqList.map(async (faq) => {
                    if (faq.id) {
                        await updateFAQ({ id: faq.id, question: faq.question, is_active: faq.is_active, access_token }).unwrap();
                    } else {
                        const newFAQ = await createFAQ({ question: faq.question, course_id, access_token }).unwrap();
                        faq.id = newFAQ.faq[0].id;
                    }

                    await Promise.all(
                        faq.existingOptions.map(async (option) => {
                            await updateOption({ id: option.id, option_text: option.option_text, access_token }).unwrap();
                        })
                    );

                    const filteredNewOptions = faq.newOptions.filter(opt => opt.trim() !== "");
                    if (filteredNewOptions.length > 0) {
                        await createFAQOptions({ faq_id: faq.id, options: filteredNewOptions, access_token }).unwrap();
                    }
                })
            );

            toast.success("FAQs updated successfully!");
            refetch();
            onClose();
        } catch (error) {
            const errorMessage = error?.data?.error ||
                error?.data?.message ||
                error?.error ||
                error?.message ||
                'An unexpected error occurred';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUseGeneratedFAQ = (faq) => {
        const newFAQ = {
            question: faq.question,
            newOptions: faq.options || [""],
            existingOptions: []
        };

        setFaqList([...faqList, newFAQ]);
        toast.success("FAQ added to the list!");
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Manage FAQs
                    </h2>
                    <div className="flex items-center gap-2">
                        <AIContentGenerator
                            contentType="faq"
                            onUseGenerated={handleUseGeneratedFAQ}
                        />
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-2 sm:py-3">
                    <form onSubmit={handleSubmit} id="editFAQForm" className="space-y-3">
                        {faqList.length === 0 ? (
                            <div className="text-center py-8 sm:py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                <div className="flex flex-col items-center justify-center">
                                    <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-3" />
                                    <p className="text-base sm:text-lg font-medium text-gray-600 mb-2">No FAQs yet</p>
                                    <p className="text-xs sm:text-sm text-gray-500 max-w-sm px-4">
                                        Start by adding your first frequently asked question to help students.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            faqList.map((faq, faqIndex) => (
                                <div
                                    key={faqIndex}
                                    className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    {/* FAQ Header */}
                                    <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                                        <div className="flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 bg-lightGreen/20 text-forestGreen rounded-lg text-xs sm:text-sm font-bold flex-shrink-0 mt-1">
                                            {faqIndex + 1}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:gap-3 gap-2">
                                                <input
                                                    type="text"
                                                    value={faq.question}
                                                    onChange={(e) => handleFAQChange(faqIndex, e.target.value)}
                                                    className="flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all bg-white text-sm sm:text-base"
                                                    placeholder="What would you like to ask?"
                                                    required
                                                />

                                                <div className="flex items-center">
                                                    {faq?.id ?
                                                        (<label
                                                            className="relative inline-flex items-center cursor-pointer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            title={faq?.is_active ? "Deactivate" : "Activate"}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={faq?.is_active}
                                                                onChange={() => handleFAQStatusChange(faqIndex, !faq?.is_active)}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                                            <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                                        </label>)
                                                        :
                                                        (<button
                                                            type="button"
                                                            onClick={() => removeFAQ(faqIndex, faq.id)}
                                                            className="flex-shrink-0 h-10 sm:h-11 w-full sm:w-11 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all border border-red-200 text-sm sm:text-base"
                                                            title="Remove FAQ"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2 sm:mr-0" />
                                                            <span className="sm:hidden">Remove FAQ</span>
                                                        </button>)
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Answer Options Section */}
                                    <div className="ml-0 sm:ml-12 space-y-3 sm:space-y-4">
                                        {/* Section Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <List className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm font-semibold text-gray-700">Answer Options</span>
                                            </div>
                                            {/* Add Option Button */}
                                            <button
                                                type="button"
                                                onClick={() => addNewOption(faqIndex)}
                                                className="flex items-center gap-2 text-forestGreen hover:text-forestGreen text-sm font-semibold py-2 px-3 hover:bg-lightGreen rounded-lg transition-all duration-200 w-full sm:w-auto justify-center sm:justify-start"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add Option
                                            </button>
                                        </div>

                                        {/* Options List */}
                                        <div className="space-y-2 sm:space-y-3">
                                            {/* Existing Options */}
                                            {faq.existingOptions.map((option, optionIndex) => (
                                                <div key={option.id} className="flex items-center gap-2 sm:gap-3 group">
                                                    <span className="text-xs sm:text-sm font-medium text-gray-400 w-5 sm:w-6 flex-shrink-0">
                                                        {optionIndex + 1}.
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={option.option_text}
                                                        onChange={(e) => handleExistingOptionChange(faqIndex, optionIndex, e.target.value)}
                                                        className="flex-1 py-2 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-leafGreen bg-white transition-all text-sm sm:text-base"
                                                        placeholder="Enter option text..."
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExistingOption(faqIndex, optionIndex, option.id)}
                                                        className="flex-shrink-0 h-8 sm:h-9 w-8 sm:w-9 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                                        title="Remove option"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}

                                            {/* New Options */}
                                            {faq.newOptions.map((option, optionIndex) => (
                                                <div key={`new-${optionIndex}`} className="flex items-center gap-2 sm:gap-3 group">
                                                    <span className="text-xs sm:text-sm font-medium text-gray-400 w-5 sm:w-6 flex-shrink-0">
                                                        {faq.existingOptions.length + optionIndex + 1}.
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={option}
                                                        onChange={(e) => handleNewOptionChange(faqIndex, optionIndex, e.target.value)}
                                                        className="flex-1 p-2 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-leafGreen bg-white transition-all border-dashed text-sm sm:text-base"
                                                        placeholder="Enter new option..."
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNewOption(faqIndex, optionIndex)}
                                                        className="flex-shrink-0 h-8 sm:h-9 w-8 sm:w-9 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Remove new option"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </form>
                </div>

                {/* Footer Buttons */}
                <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 border-t bg-white sticky bottom-0">
                    {/* Add New FAQ button */}
                    <button
                        type="button"
                        onClick={addFAQ}
                        className="px-4 sm:px-6 py-2.5 text-sm font-medium text-white bg-leafGreen/80 hover:bg-leafGreen  rounded-lg transition-all duration-200 flex items-center gap-2 justify-center"
                    >
                        <Plus className="h-4 w-4" />
                        Add New FAQ
                    </button>

                    {/* Cancel and Save buttons */}
                    <div className="flex gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="editFAQForm"
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 text-sm font-medium text-white  bg-leafGreen   rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    <span className="hidden sm:inline">Saving Changes...</span>
                                    <span className="sm:hidden">Saving...</span>
                                </div>
                            ) : (
                                <>
                                    <span className="hidden sm:inline">Save Changes</span>
                                    <span className="sm:hidden">Save</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}