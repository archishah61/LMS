/* eslint-disable react/prop-types */
import { useState, useRef, useEffect } from "react";
import { useCreateCompleteSentenceQuestionMutation, useUpdateCompleteSentenceQuestionMutation } from "../../services/Content_Management/quizType/completeTheSentenceApi";
import { toast } from "react-hot-toast";
import { getAdminToken } from "../../services/CookieService";
import { FileText, X, Upload, Loader2 } from "lucide-react";
import AIContentGenerator from "../Home/courses/AIContentGenrator";

const CompleteTheSentencesModal = ({ isOpen, onClose, quizId, createdBy, editingQuestion }) => {
    const [question, setQuestion] = useState("");
    const [blanks, setBlanks] = useState([]); // Array of { word: "", hint: "" }
    const textareaRef = useRef(null);

    const [createQuestion, { isLoading: isCreating }] = useCreateCompleteSentenceQuestionMutation();
    const [updateQuestion, { isLoading: isUpdating }] = useUpdateCompleteSentenceQuestionMutation();
    const { access_token } = getAdminToken();

    // Pre-fill form if editing
    useEffect(() => {
        if (editingQuestion && isOpen) {
            setQuestion(editingQuestion.question || "");
            // Support both blanks and correct_word/hint arrays
            if (editingQuestion.blanks) {
                setBlanks(editingQuestion.blanks);
            } else if (editingQuestion.correct_word) {
                // If hints exist, pair them, else just use word
                const hints = editingQuestion.hint || [];
                setBlanks(editingQuestion.correct_word.map((word, i) => ({ word, hint: hints[i] || "" })));
            } else {
                setBlanks([]);
            }
        } else if (isOpen) {
            setQuestion("");
            setBlanks([]);
        }
    }, [editingQuestion, isOpen]);

    const handleInsertBlank = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const newValue = question.slice(0, start) + "_____" + question.slice(end);
        setQuestion(newValue);

        // Find the index where the blank is inserted (how many blanks before the cursor)
        const beforeText = question.slice(0, start);
        const blankIndex = (beforeText.match(/_____/g) || []).length;

        // Insert the new blank at the correct position in the blanks array
        const newBlanks = [
            ...blanks.slice(0, blankIndex),
            { word: "", hint: "" },
            ...blanks.slice(blankIndex)
        ];
        setBlanks(newBlanks);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + 5, start + 5);
        }, 0);
    };

    // Function to populate form with generated complete sentence question data
    const handleUseGeneratedCompleteSentenceQuestion = (generatedQuestion) => {
        setQuestion(generatedQuestion.question)
        setBlanks([...generatedQuestion.blanks])
        toast.success("Complete sentence question data populated from AI!")
    }

    const handleBlankChange = (index, field, value) => {
        const updated = [...blanks];
        updated[index][field] = value;
        setBlanks(updated);
    };

    const handleBlankDelete = (index) => {
        // Remove the blank from the blanks array
        const updatedBlanks = blanks.filter((_, i) => i !== index);
        setBlanks(updatedBlanks);

        // Remove the corresponding '_____' from the question text
        let count = 0;
        let newQuestion = question.replace(/_____/, (match) => {
            if (count === index) {
                count++;
                return '';
            }
            count++;
            return match;
        });
        setQuestion(newQuestion);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const blankCount = (question.match(/_____/g) || []).length;

        if (blankCount !== blanks.length) {
            toast.error("Mismatch between number of blanks and answers provided.");
            return;
        }

        const hasEmptyWord = blanks.some(b => !b.word.trim());
        if (!question || hasEmptyWord) {
            toast.error("Please provide the question and all correct words");
            return;
        }

        try {
            if (editingQuestion) {
                // Update
                const res = await updateQuestion({
                    id: editingQuestion.id,
                    data: {
                        quiz_id: quizId,
                        question,
                        correct_word: blanks.map(b => b.word),
                        hint: blanks.map(b => b.hint),
                        updated_by: createdBy,
                    },
                    access_token,
                }).unwrap();
                toast.success(res.message || "Question updated successfully");
            } else {
                // Create
                const res = await createQuestion({
                    data: {
                        quiz_id: quizId,
                        question,
                        blanks, // send array of { word, hint }
                        created_by: createdBy,
                    },
                    access_token,
                }).unwrap();
                toast.success(res.message || "Complete the sentence created");
            }
            setQuestion("");
            setBlanks([]);
            onClose();
        } catch (err) {
            const errorMessage = err?.data?.message ||
                err?.data?.message ||
                err?.error ||
                err?.message ||
                'An unexpected error occurred';
            toast.error(errorMessage);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg w-[90%] max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-forestGreen flex items-center gap-2">
                        <FileText size={24} className="text-leafGreen" />
                        {editingQuestion ? "Edit Sentence Completion Question" : "Create Sentence Completion Question"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-red-500 transition-colors duration-300"
                        disabled={isCreating || isUpdating}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* AI Content Generator */}
                <div className="mb-5 pb-5 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm uppercase tracking-wide text-gray-600 font-medium">AI Assistant</h4>
                    </div>
                    <AIContentGenerator
                        contentType="complete-sentence"
                        onUseGenerated={handleUseGeneratedCompleteSentenceQuestion}
                        buttonText="Generate Questions with AI"
                        modalTitle="Generate Complete Sentence Questions with AI"
                        placeholderText="Describe what kind of complete sentence questions you want to create. For example: 'Create grammar questions about verb tenses and sentence structure' or 'Generate vocabulary questions about scientific terminology'..."
                        requiresPDF={true}
                    />
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex justify-between items-center">
                            Question
                            <button
                                type="button"
                                onClick={handleInsertBlank}
                                className="text-sm text-leafGreen hover:underline"
                            >
                                + Add Blank
                            </button>
                        </label>
                        <textarea
                            ref={textareaRef}
                            placeholder='e.g., "The sky is _____."'
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            rows={4}
                            className="w-full border border-gray-300 rounded-lg p-3 resize-none focus:ring-leafGreen/20 focus:border-leafGreen focus:outline-none"
                            required
                        />
                    </div>

                    {blanks.map((blank, index) => (
                        <div key={index} className="border-t pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-semibold text-gray-600">Blank #{index + 1}</p>
                                <button
                                    type="button"
                                    onClick={() => handleBlankDelete(index)}
                                    className="text-xs text-red-500 hover:underline ml-2"
                                    disabled={isCreating || isUpdating}
                                >
                                    Delete
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Correct Word</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., blue"
                                        value={blank.word}
                                        onChange={(e) => handleBlankChange(index, "word", e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-leafGreen/20 focus:border-leafGreen focus:outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Hint (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., a color"
                                        value={blank.hint}
                                        onChange={(e) => handleBlankChange(index, "hint", e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-leafGreen/20 focus:border-leafGreen focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                            disabled={isCreating || isUpdating}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-leafGreen text-white rounded-lg flex items-center gap-2 hover:bg-forestGreen transition transform shadow-md"
                            disabled={isCreating || isUpdating}
                        >
                            {(isCreating || isUpdating) ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    {editingQuestion ? "Saving..." : "Saving..."}
                                </>
                            ) : (
                                <>
                                    <Upload size={20} />
                                    {editingQuestion ? "Update Question" : "Save Question"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CompleteTheSentencesModal;
