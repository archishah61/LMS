/* eslint-disable react/prop-types */
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useCreateSummarizePassageQuestionMutation } from "../../services/Content_Management/quizType/summaryPassgaeApi";
import { getAdminToken } from "../../services/CookieService";
import { BookOpen, X, Loader2, FileText, Timer, Tag } from "lucide-react";
import PermissionWrapper from "../../context/PermissionWrapper";
import AIContentGenerator from "../Home/courses/AIContentGenrator";

const SummaryPassageModal = ({ isOpen, onClose, quizId, createdBy }) => {
    const [summary, setSummary] = useState("");
    const [timeLimit, setTimeLimit] = useState("");
    const [marks, setMarks] = useState(""); // State for marks
    const { access_token } = getAdminToken();
    const [createQuestion, { isLoading }] = useCreateSummarizePassageQuestionMutation();

    // Function to populate form with generated summary passage question data
    const handleUseGeneratedSummaryPassageQuestion = (generatedQuestion) => {
        setSummary(generatedQuestion.passage);
        setTimeLimit(generatedQuestion.timeLimit ? generatedQuestion.timeLimit.toString() : "");
        setMarks(generatedQuestion.marks ? generatedQuestion.marks.toString() : ""); // Set marks if available
        toast.success("Summary Passage question data populated from AI!");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!summary || !timeLimit || !marks) {
            toast.error("Please provide summary, time limit, and marks");
            return;
        }

        const payload = {
            quiz_id: quizId,
            summary,
            time_limit: parseInt(timeLimit, 10),
            marks: parseInt(marks, 10), // Include marks in the payload
            created_by: createdBy,
        };

        try {
            const res = await createQuestion({ payload, access_token }).unwrap();
            toast.success(res.message || "Summary added successfully", {
                icon: "📘",
                duration: 3000,
            });
            setSummary("");
            setTimeLimit("");
            setMarks("");
            onClose();
        } catch (err) {
            console.error(err);
            const errorMessage = err?.data?.error ||
                err?.data?.message ||
                err?.error ||
                err?.message ||
                'Failed to save question';
            toast.error(errorMessage);
        }
    };

    if (!isOpen) return null;

    return (
        <PermissionWrapper section="Summarize Passage Question" action="create">
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-lg w-[90%] max-w-lg shadow-xl transform transition-all duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-forestGreen flex items-center gap-2">
                            <BookOpen size={24} className="text-leafGreen" />
                            Add Summary for Passage
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-red-500 transition-colors duration-300"
                            disabled={isLoading}
                        >
                            <X size={24} />
                        </button>
                    </div>
                    {/* AI Content Generator */}
                    <div className="mb-5 pb-5 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm uppercase tracking-wide text-gray-600 font-medium">
                                AI Assistant
                            </h4>
                        </div>
                        <AIContentGenerator
                            contentType="summary-passage"
                            onUseGenerated={handleUseGeneratedSummaryPassageQuestion}
                            buttonText="Generate Questions with AI"
                            modalTitle="Generate Summary Passage Questions with AI"
                            placeholderText="Describe what kind of summary passage questions you want to create..."
                            requiresPDF={true}
                        />
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <FileText size={18} className="text-leafGreen" />
                                Summary
                            </label>
                            <textarea
                                placeholder="Enter the summary of the passage..."
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-leafGreen/20 focus:border-leafGreen focus:outline-none transition-all duration-300 resize-none"
                                rows={6}
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Timer size={18} className="text-leafGreen" />
                                Time Limit (seconds)
                            </label>
                            <input
                                type="number"
                                placeholder="Enter time limit"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-leafGreen/20 focus:border-leafGreen focus:outline-none transition-all duration-300"
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Tag size={18} className="text-leafGreen" />
                                Marks
                            </label>
                            <input
                                type="number"
                                placeholder="Enter marks"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-leafGreen/20 focus:border-leafGreen focus:outline-none transition-all duration-300"
                                value={marks}
                                onChange={(e) => setMarks(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300"
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-leafGreen text-white rounded-lg flex items-center gap-2 hover:bg-forestGreen transition-all duration-300 transform shadow-md"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <BookOpen size={20} />
                                        Save
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </PermissionWrapper>
    );
};

export default SummaryPassageModal;