/* eslint-disable react/prop-types */
import { useState } from "react";
import { useCreateCourseFAQMutation } from "../../services/Course_Management/courseFAQApi";
import { useCreateFAQOptionsMutation } from "../../services/Course_Management/courseFAQOptionApi";
import toast from "react-hot-toast";
import { List, Loader2, MessageSquare, Plus, Trash2, X } from "lucide-react";

export default function CourseFAQModal({ course_id, access_token, onClose }) {
  const [faqs, setFaqs] = useState([{ question: "", options: [""] }]);
  const [createFAQ, { isLoading: isCreatingFAQ }] = useCreateCourseFAQMutation();
  const [createFAQOptions, { isLoading: isCreatingOptions }] = useCreateFAQOptionsMutation();

  const handleFAQChange = (index, value) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index].question = value;
    setFaqs(updatedFaqs);
  };

  const handleOptionChange = (faqIndex, optionIndex, value) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[faqIndex].options[optionIndex] = value;
    setFaqs(updatedFaqs);
  };

  const addFAQField = () => {
    setFaqs([...faqs, { question: "", options: [""] }]);
  };

  const removeFAQField = (index) => {
    if (faqs.length > 1) {
      setFaqs(faqs.filter((_, i) => i !== index));
    }
  };

  const addOptionField = (faqIndex) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[faqIndex].options.push("");
    setFaqs(updatedFaqs);
  };

  const removeOptionField = (faqIndex, optionIndex) => {
    const updatedFaqs = [...faqs];
    if (updatedFaqs[faqIndex].options.length > 1) {
      updatedFaqs[faqIndex].options.splice(optionIndex, 1);
      setFaqs(updatedFaqs);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const createdFAQs = await Promise.all(
        faqs
          .filter((faq) => faq.question.trim() !== "")
          .map((faq) => createFAQ({ question: faq.question, course_id, access_token }).unwrap())
      );

      await Promise.all(
        createdFAQs.map(async (createdFAQ, index) => {
          const options = faqs[index].options.filter((option) => option.trim() !== "");
          if (options.length > 0) {
            // Fix: Access the FAQ ID correctly from the array
            const faqId = createdFAQ.faq[0].id;

            const response = await createFAQOptions({
              faq_id: faqId,
              options,
              access_token,
            }).unwrap();
          }
        })
      );

      toast.success("FAQs and Options added successfully!");
      setFaqs([{ question: "", options: [""] }]);

      onClose();
    } catch (error) {
      const errorMessage = error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'An unexpected error occurred';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Course FAQ Management
          </h2>
          <div className="flex items-center gap-2">
            {/* <AIContentGenerator
                                contentType="faq"
                                onUseGenerated={handleUseGeneratedFAQ}
                            /> */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-2 sm:py-3">
          <form onSubmit={handleSubmit} id="createFAQForm" className="space-y-3">
            {faqs.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <div className="flex flex-col items-center justify-center">
                  <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-3" />
                  <p className="text-base sm:text-lg font-medium text-gray-600 mb-2">No FAQs yet</p>
                  <p className="text-xs sm:text-sm text-gray-500 max-w-sm px-2">
                    Start by adding your first frequently asked question to help students.
                  </p>
                </div>
              </div>
            ) : (
              faqs.map((faq, faqIndex) => (
                <div
                  key={faqIndex}
                  className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* FAQ Header */}
                  <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 bg-primary text-white rounded-lg text-xs sm:text-sm font-bold flex-shrink-0 mt-1">
                      {faqIndex + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => handleFAQChange(faqIndex, e.target.value)}
                          className="flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all bg-white text-sm sm:text-base"
                          placeholder="What would you like to ask?"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeFAQField(faqIndex)}
                          className="flex-shrink-0 h-9 sm:h-11 w-full sm:w-11 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all border border-red-200 sm:order-2 order-1"
                          title="Remove FAQ"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-0" />
                          <span className="text-xs sm:hidden">Remove FAQ</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Answer Options Section */}
                  <div className="ml-0 sm:ml-12 space-y-3 sm:space-y-4">
                    {/* Section Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                      <div className="flex items-center gap-2">
                        <List className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                        <span className="text-xs sm:text-sm font-semibold text-gray-700">Answer Options</span>
                      </div>

                      {/* Add Option Button */}
                      <button
                        type="button"
                        onClick={() => addOptionField(faqIndex)}
                        className="flex items-center gap-2 text-leafGreen hover:text-leafGreen/90 text-xs sm:text-sm font-semibold py-1.5 sm:py-2 px-2 sm:px-3 hover:bg-leafGreen/5 rounded-lg transition-all duration-200 w-fit"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        Add Option
                      </button>
                    </div>

                    {/* Options List */}
                    <div className="space-y-2 sm:space-y-3">
                      {/* New Options */}
                      {faq.options.map((option, optionIndex) => (
                        <div key={`new-${optionIndex}`} className="flex items-center gap-2 sm:gap-3 group">
                          <span className="text-xs sm:text-sm font-medium text-gray-400 w-4 sm:w-6 flex-shrink-0">
                            {optionIndex + 1}.
                          </span>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(faqIndex, optionIndex, e.target.value)}
                            className="flex-1 p-2 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-leafGreen bg-white transition-all border-dashed text-sm sm:text-base"
                            placeholder="Enter new option..."
                            required
                          />
                          <button
                            type="button"
                            onClick={() => removeOptionField(faqIndex, optionIndex)}
                            className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                            title="Remove new option"
                          >
                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
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
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 border-t bg-white sticky bottom-0">
          {/* Add New FAQ button */}
          <button
            type="button"
            onClick={addFAQField}
            className="px-4 sm:px-6 py-2.5 text-sm font-medium text-white bg-leafGreen hover:bg-primary rounded-lg transition-all duration-200 flex items-center gap-2 justify-center order-2 sm:order-1"
          >
            <Plus className="h-4 w-4" />
            Add New FAQ
          </button>

          {/* Cancel and Save buttons */}
          <div className="flex gap-2 sm:gap-3 order-1 sm:order-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="createFAQForm"
              disabled={isCreatingFAQ || isCreatingOptions}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 text-sm font-medium text-white bg-leafGreen hover:bg-primary rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingFAQ || isCreatingOptions ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Saving Changes...</span>
                  <span className="inline sm:hidden">Saving...</span>
                </div>
              ) : (
                <div>
                  <span className="hidden sm:inline">Save FAQ & Options</span>
                  <span className="inline sm:hidden">Save</span>
                </div>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}