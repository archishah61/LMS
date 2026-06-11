import { useState } from "react";
import { toast } from "react-hot-toast";
import { getAdminToken } from "../../../services/CookieService";
import {
  useDeleteBestOptionQuestionByIdMutation,
  useUpdateBestOptionQuestionMutation,
} from "../../../services/Content_Management/quizType/bestOptionQuestionApi";
import {
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
  Loader2,
  BookOpen,
  Star,
  FileText,
  List,
  Tag
} from "lucide-react";
import PermissionWrapper from "../../../context/PermissionWrapper";

const DeleteConfirmationModal = ({ isOpen, onCancel, onConfirm, isDeleting }) => {
  if (!isOpen) return null;
  return (
    <PermissionWrapper section="Best Option Question" action="delete">
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full transform transition-all">
          <div className="flex items-center text-red-600 mb-4">
            <AlertTriangle size={24} className="mr-2" />
            <h3 className="text-lg font-semibold">Confirm Deletion</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this question? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-all duration-300"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </PermissionWrapper>
  );
};

const BestOptionQuestionDisplay = ({ bestOptionQuestions = [], quizId, createdBy }) => {
  const [updateQuestion] = useUpdateBestOptionQuestionMutation();
  const [deleteQuestion] = useDeleteBestOptionQuestionByIdMutation();
  const [editId, setEditId] = useState(null);
  const [editedPassage, setEditedPassage] = useState("");
  const [originalPassage, setOriginalPassage] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedMarks, setEditedMarks] = useState(""); // State for edited marks
  const { access_token } = getAdminToken();
  const [editedSelectedWords, setEditedSelectedWords] = useState([]);
  const [originalWordPositions, setOriginalWordPositions] = useState([]);
  const [originalSelectedWords, setOriginalSelectedWords] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);

  const getEditedPassageWithBlanks = () => {
    const tokens = editedPassage.split(/(\s+)/);
    const tokenMap = tokens.map((token, index) => {
      const cleanWord = token.trim().replace(/[^\w'-]/g, "");
      const selected = editedSelectedWords.find(w => w.id === index);
      return {
        original: token,
        index,
        selected: !!selected,
        cleanWord,
        selectionInfo: selected
      };
    });
    const modifiedTokens = tokenMap.map(token => {
      if (!token.selected || !token.cleanWord) {
        return token.original;
      }
      const match = token.original.match(/^([a-zA-Z0-9'-]+)(\W*)$/);
      const wordPart = match?.[1] || token.original;
      const punctPart = match?.[2] || "";
      return "____" + punctPart;
    });
    return modifiedTokens.join("");
  };

  const remapSelectedWords = (newPassage) => {
    if (!originalSelectedWords.length) return [];
    const selectedWordSet = new Set(originalSelectedWords.map(w => w.text.toLowerCase()));
    const tokens = newPassage.split(/(\s+)/);
    const newSelectedWords = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const cleanWord = token.trim().replace(/[^\w'-]/g, "");
      if (!cleanWord) continue;
      if (selectedWordSet.has(cleanWord.toLowerCase())) {
        newSelectedWords.push({
          id: i,
          text: cleanWord
        });
      }
    }
    return newSelectedWords;
  };

  const handleEditClick = (question) => {
    setEditId(question.id);
    setOriginalPassage(question.passage);
    setEditedMarks(question.marks || ""); // Set edited marks
    let passageWithBlanks = question.passage;
    const blankedWords = [...(question.blankedWords || [])];
    const blankIndices = [];
    let blankPos = -1;
    while ((blankPos = passageWithBlanks.indexOf("____", blankPos + 1)) !== -1) {
      blankIndices.push(blankPos);
    }
    let fullPassage = passageWithBlanks;
    const replacements = [];
    const sortedBlankIndices = [...blankIndices].sort((a, b) => b - a);
    for (let i = 0; i < sortedBlankIndices.length; i++) {
      const pos = sortedBlankIndices[i];
      const wordIndex = blankedWords.length - 1 - i;
      const word = blankedWords[wordIndex];
      fullPassage = fullPassage.substring(0, pos) + word + fullPassage.substring(pos + 4);
      replacements.push({
        originalBlankPosition: pos,
        replacedWithWord: word,
        originalIndex: wordIndex
      });
    }
    setEditedPassage(fullPassage);
    replacements.sort((a, b) => a.originalBlankPosition - b.originalBlankPosition);
    const tokens = fullPassage.split(/(\s+)/);
    const charToTokenMap = [];
    let currentPos = 0;
    for (let i = 0; i < tokens.length; i++) {
      const tokenLength = tokens[i].length;
      for (let j = 0; j < tokenLength; j++) {
        charToTokenMap[currentPos + j] = i;
      }
      currentPos += tokenLength;
    }
    const selectedTokenIndices = [];
    for (const replacement of replacements) {
      const originalBlankPos = replacement.originalBlankPosition;
      const word = replacement.replacedWithWord;
      const tokenIndex = charToTokenMap[originalBlankPos];
      if (tokenIndex !== undefined && tokens[tokenIndex].trim().replace(/[^\w'-]/g, "") === word) {
        selectedTokenIndices.push({
          id: tokenIndex,
          text: word,
          originalIndex: replacement.originalIndex
        });
      } else {
        const windowStart = Math.max(0, originalBlankPos - 10);
        const windowEnd = Math.min(charToTokenMap.length - 1, originalBlankPos + word.length + 10);
        for (let pos = windowStart; pos <= windowEnd; pos++) {
          const nearbyTokenIndex = charToTokenMap[pos];
          if (nearbyTokenIndex !== undefined && tokens[nearbyTokenIndex].trim().replace(/[^\w'-]/g, "") === word) {
            selectedTokenIndices.push({
              id: nearbyTokenIndex,
              text: word,
              originalIndex: replacement.originalIndex
            });
            break;
          }
        }
      }
    }
    selectedTokenIndices.sort((a, b) => a.id - b.id);
    const uniqueSelectedTokens = [];
    const selectedIds = new Set();
    for (const token of selectedTokenIndices) {
      if (!selectedIds.has(token.id)) {
        uniqueSelectedTokens.push(token);
        selectedIds.add(token.id);
      }
    }
    setOriginalSelectedWords(uniqueSelectedTokens);
    setEditedSelectedWords(uniqueSelectedTokens);
    setOriginalWordPositions(replacements.map(r => ({
      word: r.replacedWithWord,
      originalPosition: blankIndices.indexOf(r.originalBlankPosition)
    })));
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setEditedPassage("");
    setEditedSelectedWords([]);
    setOriginalSelectedWords([]);
    setOriginalPassage("");
    setOriginalWordPositions([]);
    setCursorPosition(0);
    setEditedMarks(""); // Reset edited marks
  };

  const handleEditedPassageChange = (e) => {
    const newPassage = e.target.value;
    setCursorPosition(e.target.selectionStart);
    setEditedPassage(newPassage);
    if (Math.abs(newPassage.length - editedPassage.length) < 10) {
      const newTokens = newPassage.split(/(\s+)/);
      const updatedWords = editedSelectedWords.map(word => {
        if (word.id < newTokens.length && newTokens[word.id].trim().replace(/[^\w'-]/g, "") === word.text) {
          return word;
        }
        for (let i = 0; i < newTokens.length; i++) {
          const cleanWord = newTokens[i].trim().replace(/[^\w'-]/g, "");
          if (cleanWord && cleanWord === word.text) {
            return { ...word, id: i };
          }
        }
        return null;
      }).filter(Boolean);
      setEditedSelectedWords(updatedWords);
    } else {
      const remappedSelections = remapSelectedWords(newPassage);
      setEditedSelectedWords(remappedSelections);
    }
  };

  const renderHighlightedPassage = () => {
    if (!editedPassage) return null;
    const tokens = editedPassage.split(/(\s+)/);
    return tokens.map((token, index) => {
      const cleanWord = token.trim().replace(/[^\w'-]/g, "");
      if (!cleanWord) return token;
      const isSelected = editedSelectedWords.some(w => w.id === index);
      return (
        <span
          key={index}
          className={`${isSelected ? "bg-lightGreen text-forestGreen font-medium p-0.5 rounded" : ""}`}
        >
          {token}
        </span>
      );
    });
  };

  const handleUpdate = async (id) => {
    if (!editedPassage.trim() || !editedMarks) {
      toast.error("Passage and marks cannot be empty");
      return;
    }
    if (editedSelectedWords.length === 0) {
      toast.error("Please select at least one word to blank out");
      return;
    }
    setIsUpdating(true);
    try {
      const orderedSelectedWords = [...editedSelectedWords].sort((a, b) => a.id - b.id);
      const blankedWords = orderedSelectedWords.map(({ text }) => text);
      const res = await updateQuestion({
        id,
        data: {
          passage: getEditedPassageWithBlanks(),
          blanked_words: blankedWords,
          marks: parseInt(editedMarks, 10), // Include edited marks in the payload
          updated_by: getAdminToken()?.id,
        },
        access_token,
      }).unwrap();
      toast.success(res.message || "Updated successfully", {
        icon: "✅",
        duration: 3000,
      });
      handleCancelEdit();
    } catch (err) {
      const errorMessage = err?.data?.error || err?.data?.message || err?.error || err?.message || 'Failed to update question';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleWordSelection = (wordObj) => {
    setEditedSelectedWords((prev) => {
      const isAlreadySelected = prev.some(w => w.id === wordObj.id);
      if (isAlreadySelected) {
        return prev.filter(w => w.id !== wordObj.id);
      } else {
        return [...prev, wordObj];
      }
    });
  };

  const openDeleteModal = (id) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteQuestion({ id: itemToDelete, access_token }).unwrap();
      toast.success(res.message || "Deleted successfully", {
        icon: "🗑️",
        duration: 3000,
      });
      closeDeleteModal();
    } catch (err) {
      toast.error(err?.data?.error || "Delete failed", {
        icon: "⚠️",
        duration: 3000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatPassage = (passage) => {
    return <span className="whitespace-pre-wrap">{passage}</span>;
  };

  return (
    <PermissionWrapper section="Best Option Question" action="view|edit|delete">
      <div className="mx-auto space-y-6 mt-7 bg-white p-6 rounded-lg shadow-md">
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onCancel={closeDeleteModal}
          onConfirm={confirmDelete}
          isDeleting={isDeleting}
        />
        <div className="flex justify-between items-center border-b border-leafGreen/20 pb-4">
          <h2 className="text-xl font-bold text-forestGreen flex items-center gap-2">
            <Star size={24} className="text-leafGreen" />
            Best Option Questions
          </h2>
        </div>
        {!bestOptionQuestions.length ? (
          <div className="text-center py-8 border border-dashed border-leafGreen/30 rounded-lg bg-lightGreen">
            <FileText size={48} className="mx-auto text-leafGreen/50 mb-3" />
            <p className="text-gray-600">No questions found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {bestOptionQuestions.map((question, index) => (
              <div
                key={question.id}
                className="border border-leafGreen/20 rounded-lg p-5 space-y-4 bg-white shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex justify-between">
                  <h3 className="font-semibold text-lg text-forestGreen flex items-center gap-1.5">
                    <FileText size={18} className="text-leafGreen" />
                    Question {index + 1}
                  </h3>
                </div>
                {editId === question.id ? (
                  <div className="space-y-3">
                    <div className="space-y-4">
                      <textarea
                        className="w-full border border-leafGreen/30 rounded-lg p-3 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all duration-300 resize-none"
                        rows={6}
                        value={editedPassage}
                        onChange={handleEditedPassageChange}
                      />
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between mb-2">
                          <p className="text-sm text-gray-600">Preview with highlighted selections:</p>
                          <p className="text-xs text-forestGreen font-medium">
                            {editedSelectedWords.length} words selected
                          </p>
                        </div>
                        <div className="whitespace-pre-wrap text-gray-800">
                          {renderHighlightedPassage()}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Click words to select/deselect them:</p>
                        <div className="flex flex-wrap gap-2">
                          {editedPassage.split(/(\s+)/).map((token, index) => {
                            const cleanedWord = token.trim().replace(/[^\w'-]/g, "");
                            if (!cleanedWord) return null;
                            const wordObj = { id: index, text: cleanedWord };
                            const isSelected = editedSelectedWords.some(w => w.id === wordObj.id);
                            return (
                              <button
                                key={index}
                                onClick={() => toggleWordSelection(wordObj)}
                                className={`px-4 py-1.5 rounded-md ${isSelected ? "bg-leafGreen text-white" : "bg-gray-100 hover:bg-lightGreen"}`}
                              >
                                {cleanedWord}
                              </button>
                            );
                          }).filter(Boolean)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Tag size={18} className="text-leafGreen" />
                          Marks
                        </label>
                        <input
                          type="number"
                          value={editedMarks}
                          onChange={(e) => setEditedMarks(e.target.value)}
                          className="w-full border border-leafGreen/30 rounded-lg p-3 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all duration-300"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(question.id)}
                        disabled={isUpdating}
                        className="px-3 py-1.5  bg-lightGreen text-white rounded-lg flex items-center gap-1.5   transition-all duration-300 text-sm"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1.5 hover:bg-gray-300 transition-all duration-300 text-sm"
                        disabled={isUpdating}
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen size={16} className="text-leafGreen" />
                        <p className="font-semibold text-forestGreen">Passage:</p>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {formatPassage(question.passage)}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-forestGreen flex items-center gap-1.5 mb-3">
                        <Star size={18} className="text-leafGreen" />
                        Blanked Words
                      </h4>
                      <div className="bg-lightGreen p-3 rounded-lg border border-leafGreen/20">
                        <div className="flex flex-wrap gap-2">
                          {question.blankedWords && question.blankedWords.map((word, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-lightGreen text-forestGreen rounded-lg text-sm border border-leafGreen/30 flex items-center"
                            >
                              <span className="font-semibold mr-1">{idx + 1}.</span> {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-forestGreen flex items-center gap-1.5 mb-3">
                        <List size={18} className="text-leafGreen" />
                        Distractor Options
                      </h4>
                      <div className="bg-lightGreen p-3 rounded-lg border border-leafGreen/20">
                        <ul className="space-y-3">
                          {question.blankedWords && question.blankedWords.map((word, idx) => {
                            const options = question.distractorOptions?.[word] || [];
                            return (
                              <li key={idx} className="bg-white p-3 rounded-lg border border-leafGreen/10">
                                <div className="font-medium text-forestGreen mb-2 flex items-center">
                                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-lightGreen text-forestGreen font-semibold text-xs mr-2">
                                    {idx + 1}
                                  </span>
                                  {word}:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {options.map((option, optIdx) => (
                                    <span
                                      key={optIdx}
                                      className="bg-gray-50 px-3 py-1 rounded-md border border-gray-200 text-sm text-gray-700"
                                    >
                                      {option}
                                    </span>
                                  ))}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-forestGreen flex items-center gap-1.5 mb-3">
                        <Tag size={18} className="text-leafGreen" />
                        Marks
                      </h4>
                      <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                        <p className="text-green-700">{question.marks}</p>
                      </div>
                    </div>
                  </>
                )}
                <PermissionWrapper section="Best Option Question" action="edit|delete">
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    <PermissionWrapper section="Best Option Question" action="edit">
                      <button
                        onClick={() => handleEditClick(question)}
                        className="px-3 py-1.5 bg-amber-500 text-white rounded-lg flex items-center gap-1.5 hover:bg-amber-600 transition-all duration-300 text-sm"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                    </PermissionWrapper>
                    <PermissionWrapper section="Best Option Question" action="delete">
                      <button
                        onClick={() => openDeleteModal(question.id)}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg flex items-center gap-1.5 hover:bg-red-600 transition-all duration-300 text-sm"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </PermissionWrapper>
                  </div>
                </PermissionWrapper>
              </div>
            ))}
          </div>
        )}
      </div>
    </PermissionWrapper>
  );
};

export default BestOptionQuestionDisplay;