import { useState } from "react";
import { toast } from "react-hot-toast";
import { getAdminToken } from "../../services/CookieService";
import { useCreateBestOptionQuestionMutation } from "../../services/Content_Management/quizType/bestOptionQuestionApi";
import { Loader2, X, BookOpen, Save, Tag } from "lucide-react";
import PermissionWrapper from "../../context/PermissionWrapper";
import AIContentGenerator from "../Home/courses/AIContentGenrator";

const BestOptionQuestionModal = ({ isOpen, onClose, quizId, createdBy }) => {
    const { access_token } = getAdminToken();
    const [createQuestion] = useCreateBestOptionQuestionMutation();
    const [passage, setPassage] = useState("");
    const [selectedWords, setSelectedWords] = useState([]);
    const [marks, setMarks] = useState(""); // State for marks
    const [isSaving, setIsSaving] = useState(false);

    // This function creates the passage with blanks by only blanking out specific selected instances
    const getPassageWithBlanks = () => {
        // Split passage into tokens (words and spaces)
        const tokens = passage.split(/(\s+)/);
        // Create a map of tokens to track which ones have been selected
        const tokenMap = tokens.map((token, index) => {
            const cleanWord = token.trim().replace(/[^\w'-]/g, "");
            // Find if this exact token at this index is selected
            const selected = selectedWords.find(w => w.id === index);
            return {
                original: token,
                index,
                selected: !!selected,
                cleanWord
            };
        });
        // Generate the passage with blanks, maintaining original punctuation
        const modifiedTokens = tokenMap.map(token => {
            if (!token.selected || !token.cleanWord) {
                return token.original; // Keep unselected tokens or punctuation as is
            }
            // For selected tokens, extract punctuation
            const match = token.original.match(/^([a-zA-Z0-9'-]+)(\W*)$/);
            const wordPart = match?.[1] || token.original;
            const punctPart = match?.[2] || "";
            // Replace word with blank, preserving punctuation
            return "____" + punctPart;
        });
        return modifiedTokens.join("");
    };

    // Enhanced version to track positions of words in passage
    const handleSave = async () => {
        if (!quizId || !createdBy || passage.trim() === "" || selectedWords.length === 0 || !marks) {
            toast.error("Please ensure the passage is entered, words are selected, and marks are provided.");
            return;
        }
        setIsSaving(true);
        try {
            // Track the order of words as they appear in the passage
            const tokens = passage.split(/(\s+)/);
            const orderedSelectedWords = [...selectedWords].sort((a, b) => a.id - b.id);
            const res = await createQuestion({
                data: {
                    passage: getPassageWithBlanks(),
                    marks: parseInt(marks, 10), // Include marks in the payload
                    selected_words: orderedSelectedWords.map(({ text, id }) => ({
                        word: text,
                        position: id, // Store position for future reference
                        quiz_id: quizId,
                        created_by: createdBy,
                        updated_by: createdBy,
                    })),
                },
                access_token,
            }).unwrap();
            toast.success(res.message || "Question saved successfully", {
                icon: "✅",
                duration: 3000
            });
            setPassage("");
            setSelectedWords([]);
            setMarks(""); // Reset marks
            onClose();
        } catch (err) {
            console.error(err);
            const errorMessage = err?.data?.error ||
                err?.data?.message ||
                err?.error ||
                err?.message ||
                'Failed to save question';
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleWordSelection = (wordObj) => {
        setSelectedWords((prev) =>
            prev.some(w => w.id === wordObj.id)
                ? prev.filter(w => w.id !== wordObj.id)
                : [...prev, wordObj]
        );
    };

    const handlePassageChange = (e) => {
        setPassage(e.target.value);
        // Clear selected words when passage changes
        setSelectedWords([]);
    };

    // Function to populate form with generated best option question data
    const handleUseGeneratedBestOptionQuestion = (generatedQuestion) => {
        setPassage(generatedQuestion.passage);
        setSelectedWords([...generatedQuestion.selectedWords]);
        setMarks(generatedQuestion.marks || ""); // Set marks if available
        toast.success("Best Option question data populated from AI!");
    };

    if (!isOpen) return null;

    return (
        <PermissionWrapper section="Best Option Question" action="create">
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white rounded-lg w-[90%] max-w-2xl shadow-xl transform transition-all duration-300 max-h-[90vh] flex flex-col">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-purple-800 flex items-center gap-2">
                                <BookOpen size={24} className="text-purple-600" />
                                Create Best Option Question
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-red-500 transition-colors duration-300"
                                disabled={isSaving}
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                    {/* AI Content Generator */}
                    <div className="mb-5 pb-5 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm uppercase tracking-wide text-gray-600 font-medium">
                                AI Assistant
                            </h4>
                        </div>
                        <AIContentGenerator
                            contentType="best-option"
                            onUseGenerated={handleUseGeneratedBestOptionQuestion}
                            buttonText="Generate Questions with AI"
                            modalTitle="Generate Best Option Questions with AI"
                            placeholderText="Describe what kind of best option fill-in-the-blank questions you want to create..."
                            requiresPDF={true}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-hide p-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <textarea
                            value={passage}
                            onChange={handlePassageChange}
                            placeholder="Enter the passage here..."
                            className="w-full p-4 border border-gray-300 rounded-md mb-6 h-40 resize-none"
                        />
                        <div className="mb-6">
                            <p className="text-sm text-gray-600 mb-2">Select words to blank out:</p>
                            <div className="flex flex-wrap gap-2">
                                {passage
                                    .split(/(\s+)/) // Split by spaces but keep spaces
                                    .map((token, index) => {
                                        // Only consider non-empty word tokens
                                        const cleanedWord = token.trim().replace(/[^\w'-]/g, "");
                                        if (!cleanedWord) return null;
                                        const wordObj = { id: index, text: cleanedWord };
                                        const isSelected = selectedWords.some(w => w.id === wordObj.id);
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => handleWordSelection(wordObj)}
                                                className={`px-4 py-2 rounded-md ${isSelected
                                                    ? "bg-blue-500 text-white"
                                                    : "bg-gray-200 hover:bg-blue-200"
                                                    }`}
                                            >
                                                {cleanedWord}
                                            </button>
                                        );
                                    })
                                    .filter(Boolean) // Remove null elements
                                }
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Tag size={18} className="text-purple-600" />
                                Marks
                            </label>
                            <input
                                type="number"
                                value={marks}
                                onChange={(e) => setMarks(e.target.value)}
                                placeholder="Enter marks"
                                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all duration-300"
                                required
                            />
                        </div>
                    </div>
                    <div className="p-6 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <button
                                onClick={handleSave}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 shadow-md ${isSaving || selectedWords.length === 0 || !marks
                                    ? "bg-gray-400 cursor-not-allowed opacity-50"
                                    : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                                    }`}
                                disabled={isSaving || selectedWords.length === 0 || !marks}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Save to Quiz
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </PermissionWrapper>
    );
};

export default BestOptionQuestionModal;