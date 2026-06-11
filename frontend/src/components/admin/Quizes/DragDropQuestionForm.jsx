/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getAdminToken } from "../../../services/CookieService";
import {
  FileText,
  Plus,
  Save,
  X,
  AlertCircle,
  Loader2,
  Edit2,
  Trash2,
  FileEdit,
  Info,
  CheckCircle,
  Circle,
} from "lucide-react";
import {
  useCreateDragDropQuestionMutation,
  useUpdateDragDropQuestionMutation,
} from "../../../services/Content_Management/quizType/dragDropQuestionApi";
import PermissionWrapper from "../../../context/PermissionWrapper";
import AIContentGenerator from "../../Home/courses/AIContentGenrator";

const DragDropQuestionForm = ({
  isOpen,
  onClose,
  quizId,
  isEditing = false,
  questionData = null,
}) => {
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState([""]);
  const [blanks, setBlanks] = useState([]);
  const [marks, setMarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const promptRef = useRef(null);
  const { access_token } = getAdminToken();

  const [createDragDropQuestion] = useCreateDragDropQuestionMutation();
  const [updateDragDropQuestion] = useUpdateDragDropQuestionMutation();

  // Initialize form with questionData if in edit mode
  useEffect(() => {
    if (isEditing && questionData) {
      setPrompt(questionData.prompt);
      setOptions([...questionData.options]);
      setMarks(questionData.marks || ""); // Set marks if available

      // Transform blanks data to new format with single answer
      const transformedBlanks = questionData.blanks.map((blank) => {
        // Use the first correct answer if it's an array
        const correctAnswer = Array.isArray(blank.correct)
          ? blank.correct[0]
          : blank.correct;

        return {
          ...blank,
          correct: correctAnswer,
        };
      });
      setBlanks(transformedBlanks);
    }
  }, [isEditing, questionData]);

  // Track blank count in the prompt and synchronize with blanks array
  useEffect(() => {
    const blankCount = (prompt.match(/___/g) || []).length;

    // If prompt has more blanks than our blanks array, add new blanks
    if (blankCount > blanks.length) {
      const newBlanks = [...blanks];
      for (let i = blanks.length + 1; i <= blankCount; i++) {
        newBlanks.push({ position: i, correct: "" });
      }
      setBlanks(newBlanks);
    }
    // If prompt has fewer blanks than our blanks array, remove extra blanks
    else if (blankCount < blanks.length) {
      const newBlanks = blanks.slice(0, blankCount);
      // Update positions for remaining blanks
      const updatedBlanks = newBlanks.map((blank, idx) => ({
        ...blank,
        position: idx + 1,
      }));
      setBlanks(updatedBlanks);
    }
  }, [prompt]);

  // Handle adding a blank to the prompt
  const handleAddBlank = () => {
    const textarea = promptRef.current;
    const cursorPosition = textarea.selectionStart;

    // Insert blank placeholder at cursor position
    const newPrompt =
      prompt.substring(0, cursorPosition) +
      "___" +
      prompt.substring(cursorPosition);

    setPrompt(newPrompt);

    // Set focus back to textarea after the added blank
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = cursorPosition + 3;
      textarea.selectionEnd = cursorPosition + 3;
    }, 0);
  };

  // Function to populate form with generated drag drop question data
  const handleUseGeneratedDragDropQuestion = (generatedQuestion) => {
    setPrompt(generatedQuestion.prompt);
    setOptions([...generatedQuestion.options]);
    setMarks(generatedQuestion.marks ? generatedQuestion.marks.toString() : "");

    // Transform blanks data to match the expected format
    const transformedBlanks = generatedQuestion.blanks.map((blank) => ({
      position: blank.position,
      correct: blank.correct,
    }));
    setBlanks(transformedBlanks);

    toast.success("Drag & Drop question data populated from AI!");
  };

  // Set option as answer for a blank (only one option per blank)
  const setOptionForBlank = (blankIndex, optionValue) => {
    const newBlanks = [...blanks];

    // Update the blank with new correct answer
    newBlanks[blankIndex] = {
      ...newBlanks[blankIndex],
      correct: optionValue,
    };

    setBlanks(newBlanks);
  };

  // Get available options for a specific blank (excluding options selected for other blanks)
  const getAvailableOptions = (blankIndex) => {
    const selectedOptions = blanks
      .filter((blank, idx) => idx !== blankIndex && blank.correct)
      .map((blank) => blank.correct);

    return options.filter(
      (option) => option.trim() && !selectedOptions.includes(option)
    );
  };

  // Handle option input changes
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    const oldValue = newOptions[index];
    newOptions[index] = value;
    setOptions(newOptions);

    // Update any blanks that had this option as a correct answer
    if (oldValue && oldValue !== value) {
      const updatedBlanks = blanks.map((blank) => {
        if (blank.correct === oldValue) {
          return {
            ...blank,
            correct: value,
          };
        }
        return blank;
      });

      setBlanks(updatedBlanks);
    }
  };

  // Add new option input field
  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  // Remove an option
  const handleRemoveOption = (index) => {
    const newOptions = [...options];
    const removedOption = newOptions[index];
    newOptions.splice(index, 1);
    setOptions(newOptions);

    // Remove this option from any blanks that had it as a correct answer
    if (removedOption) {
      const updatedBlanks = blanks.map((blank) => {
        if (blank.correct === removedOption) {
          return {
            ...blank,
            correct: "",
          };
        }
        return blank;
      });

      setBlanks(updatedBlanks);
    }
  };

  // Function to find the nth occurrence of a substring in a string
  const findNthOccurrence = (string, substring, n) => {
    let i = -1;

    while (n-- && i++ < string.length) {
      i = string.indexOf(substring, i);
      if (i < 0) break;
    }

    return i;
  };

  // Remove a blank from both the blank section and the question text
  const handleRemoveBlank = (index) => {
    // Find the position of the blank in the prompt text (nth occurrence of ___)
    const blankPosition = findNthOccurrence(prompt, "___", index + 1);

    if (blankPosition !== -1) {
      // Remove the blank from the prompt
      const newPrompt =
        prompt.substring(0, blankPosition) +
        prompt.substring(blankPosition + 3); // 3 is the length of "___"

      setPrompt(newPrompt);
    }

    // Blanks array will be updated automatically by the useEffect hook
  };

  // Handle marks input change
  const handleMarksChange = (e) => {
    const value = e.target.value;
    // Allow only positive integers or empty string
    if (value === "" || /^[1-9]\d*$/.test(value)) {
      setMarks(value);
    }
  };

  // Validate form data
  const validateForm = () => {
    // Basic validation
    if (!prompt.includes("___")) {
      toast.error("Prompt must contain at least one blank (___)");
      return false;
    }

    if (options.some((option) => !option.trim())) {
      toast.error("All options must be filled");
      return false;
    }

    if (blanks.some((blank) => !blank.correct)) {
      toast.error("All blanks must have a correct answer");
      return false;
    }

    const blankCount = (prompt.match(/___/g) || []).length;
    if (blankCount !== blanks.length) {
      toast.error(
        `Prompt has ${blankCount} blanks but you've defined ${blanks.length} answers`
      );
      return false;
    }

    // Check for duplicate options
    const uniqueOptions = new Set(options.map((opt) => opt.trim()));
    if (uniqueOptions.size !== options.length) {
      toast.error("All options must be unique");
      return false;
    }

    // Validate marks if provided
    if (marks !== "" && parseInt(marks) <= 0) {
      toast.error("Marks must be a positive number");
      return false;
    }

    return true;
  };

  // Submit the form
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Transform the data to match the API format
      const formattedBlanks = blanks.map((blank) => ({
        position: blank.position,
        correct: blank.correct, // Single answer per blank
      }));

      const payload = {
        quiz_id: quizId,
        prompt,
        options: options.filter((opt) => opt.trim()),
        blanks: formattedBlanks,
      };

      // Add marks to payload only if provided, otherwise the model hook will set it
      if (marks !== "") {
        payload.marks = parseInt(marks);
      }

      if (isEditing) {
        // Update existing question
        const response = await updateDragDropQuestion({
          id: questionData.id,
          payload,
          access_token,
        }).unwrap();
        toast.success("Drag & drop question updated successfully");
      } else {

        // Create new question
        const response = await createDragDropQuestion({
          payload,
          access_token,
        }).unwrap();
        toast.success("Drag & drop question created successfully");
      }

      // Reset form and close
      onClose();
    } catch (error) {
      console.error(`Failed to ${isEditing ? "update" : "create"} question`, error);
      const errorMessage = error?.data?.errors ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        `Failed to ${isEditing ? "update" : "create"} question`;
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <PermissionWrapper section="Drag Drop Question" action="create|edit">
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm overflow-auto py-8">
        <div className="bg-white rounded-xl w-[95%] max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300">
          {/* Header */}
          <div className="sticky top-0 bg-forestGreen text-white px-6 py-4 rounded-t-xl flex justify-between items-center z-10">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {isEditing ? (
                <>
                  <Edit2 className="text-yellow-300" />
                  Edit Drag & Drop Question
                </>
              ) : (
                <>
                  <FileEdit className="text-yellow-300" />
                  Create Drag & Drop Question
                </>
              )}
            </h2>
            <button
              onClick={onClose}
              className="hover:bg-leafGreen p-2 rounded-full transition-colors duration-200"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            {/* AI Content Generator */}
            <div className="mb-5 pb-5 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm uppercase tracking-wide text-gray-600 font-medium">
                  AI Assistant
                </h4>
              </div>
              <AIContentGenerator
                contentType="drag-drop"
                onUseGenerated={handleUseGeneratedDragDropQuestion}
                buttonText="Generate Questions with AI"
                modalTitle="Generate Drag & Drop Questions with AI"
                placeholderText="Describe what kind of drag & drop questions you want to create. For example: 'Create programming questions about data structures and algorithms' or 'Generate questions about database normalization concepts'..."
                requiresPDF={true}
              />
            </div>

            {/* Quick Help */}
            <div className="mb-5 bg-lightGreen p-3 rounded-lg border border-leafGreen/30 flex items-start gap-2">
              <Info size={18} className="text-leafGreen mt-0.5 flex-shrink-0" />
              <p className="text-sm text-forestGreen">
                {isEditing
                  ? "Update your fill-in-the-blank question. Use '___' as placeholders for blanks. You can select one correct answer for each blank from the available options list below."
                  : "Create a fill-in-the-blank question where students will drag options to correct blanks. Use the 'Insert Blank' button to add placeholders, or type '___' directly. Each blank can have only one correct answer, and each option can only be used once."}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Prompt Section */}
              <div className="mb-5">
                <label className="block text-gray-700 font-medium mb-2">
                  Question Text
                </label>
                <textarea
                  ref={promptRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-purple-400 focus:border-leafGreen/30 transition-all"
                  rows={3}
                  placeholder="Enter your question with ___ for blanks (e.g., 'Fill in the missing parts of the equation: ___ + ___ = 7')"
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleAddBlank}
                    className="px-3 py-1.5 bg-lightGreen text-forestGreen rounded-md hover:bg-lightGreen flex items-center gap-1.5 text-sm font-medium transition-colors"
                  >
                    <Plus size={15} />
                    Insert Blank
                  </button>
                  <div className="text-sm text-gray-500">
                    {(prompt.match(/___/g) || []).length} blanks in question
                  </div>
                </div>
              </div>

              {/* Marks Section */}
              <div className="mb-5">
                <label className="block text-gray-700 font-medium mb-2">
                  Marks (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={marks}
                    onChange={handleMarksChange}
                    className="w-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-leafGreen/30 transition-all"
                    placeholder="Auto"
                  />
                  <div className="text-sm text-gray-500">
                    Leave empty to use the number of blanks (
                    {(prompt.match(/___/g) || []).length}) as marks
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-5">
                <nav className="flex" aria-label="Tabs">
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className={`${!showPreview
                      ? "border-leafGreen/30 text-leafGreen"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      } py-2 px-4 border-b-2 font-medium text-sm`}
                  >
                    Edit Content
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className={`${showPreview
                      ? "border-leafGreen/30 text-leafGreen"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      } py-2 px-4 border-b-2 font-medium text-sm`}
                  >
                    Preview
                  </button>
                </nav>
              </div>

              {/* Edit Content Panel */}
              {!showPreview && (
                <>
                  {/* Options Section - Moved to top for better UX */}
                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm uppercase tracking-wide text-gray-600 font-medium">
                        Draggable Options
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="px-3 py-1.5 bg-leafGreen text-white rounded-md   flex items-center gap-1.5 text-sm font-medium transition-colors"
                      >
                        <Plus size={15} />
                        Add Option
                      </button>
                    </div>

                    <div className="space-y-2">
                      {options.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-200"
                        >
                          <div className="w-6 h-6 flex items-center justify-center bg-lightGreen text-forestGreen rounded-full text-xs font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) =>
                              handleOptionChange(index, e.target.value)
                            }
                            className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-400 focus:border-leafGreen/30"
                            placeholder={`Option ${index + 1}`}
                          />
                          <PermissionWrapper section="Drag Drop Question" action="delete">
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(index)}
                              className={`p-1.5 bg-red-50 text-red-500 rounded-md transition-colors ${options.length <= 1
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-red-100"
                                }`}
                              disabled={options.length <= 1}
                              aria-label="Remove option"
                              title="Remove this option"
                            >
                              <Trash2 size={15} />
                            </button>
                          </PermissionWrapper>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Blanks Section with Single Option Selection */}
                  {blanks.length > 0 && (
                    <div className="mb-5">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm uppercase tracking-wide text-gray-600 font-medium">
                          Correct Answers for Blanks
                        </h4>
                        <div className="text-xs bg-yellow-100 text-yellow-700 p-1.5 rounded">
                          Select one correct answer for each blank
                        </div>
                      </div>

                      {blanks.map((blank, blankIndex) => {
                        const availableOptions = getAvailableOptions(blankIndex);
                        // Always include the currently selected option in available options
                        if (
                          blank.correct &&
                          !availableOptions.includes(blank.correct)
                        ) {
                          availableOptions.push(blank.correct);
                        }

                        return (
                          <div
                            key={blankIndex}
                            className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 flex items-center justify-center bg-lightGreen text-forestGreen rounded-full text-xs font-bold flex-shrink-0">
                                {blank.position}
                              </div>
                              <p className="text-sm font-medium text-gray-700">
                                Blank #{blank.position} - Select correct answer:
                              </p>
                              <PermissionWrapper section="Drag Drop Question" action="delete">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBlank(blankIndex)}
                                  className="ml-auto p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors"
                                  aria-label="Remove blank"
                                  title="Remove this blank"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </PermissionWrapper>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {availableOptions.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  onClick={() =>
                                    setOptionForBlank(blankIndex, option)
                                  }
                                  className={`
                                p-2 border rounded-md cursor-pointer flex items-center gap-2
                                ${blank.correct === option
                                      ? "bg-green-50 border-green-300"
                                      : "bg-white border-gray-200 hover:bg-gray-50"
                                    }
                              `}
                                >
                                  {blank.correct === option ? (
                                    <CheckCircle
                                      size={16}
                                      className="text-green-600"
                                    />
                                  ) : (
                                    <Circle size={16} className="text-gray-400" />
                                  )}
                                  <span
                                    className={`
                                ${blank.correct === option
                                        ? "text-green-800 font-medium"
                                        : "text-gray-700"
                                      }
                              `}
                                  >
                                    {option}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {!availableOptions.length && (
                              <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                                No available options. Create more options or free
                                up options by deselecting them from other blanks.
                              </div>
                            )}

                            {blank.correct && (
                              <div className="mt-3 pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-500">
                                  Selected correct answer:
                                  <span className="ml-1 font-medium text-green-600">
                                    {blank.correct}
                                  </span>
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}


              {/* Preview Panel */}
              {showPreview && prompt && (
                <div className="mb-5 bg-white rounded-lg border border-gray-200 p-5">
                  <h4 className="text-lg font-medium text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    Question Preview
                  </h4>

                  <div className="mb-6">
                    <p className="text-lg text-gray-800 mb-4">
                      {prompt.split("___").map((part, i) => (
                        <React.Fragment key={i}>
                          {part}
                          {i < prompt.split("___").length - 1 && (
                            <span className="inline-block mx-1 px-3 py-1 bg-yellow-100 border-2 border-dashed border-yellow-400 text-yellow-800 rounded">
                              Blank #{i + 1}
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </p>

                    <div className="mt-6">
                      <p className="font-medium text-gray-700 mb-2">
                        Available options:
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {options
                          .filter((opt) => opt.trim())
                          .map((option, index) => (
                            <span
                              key={index}
                              className="bg-lightGreen text-forestGreen px-3 py-1.5 rounded-md text-sm border border-leafGreen/30 cursor-move"
                            >
                              {option}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="font-medium text-gray-700 mb-2">
                      Question details:
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Total marks: </span>
                          {marks ? marks : (prompt.match(/___/g) || []).length}
                          {!marks && (
                            <span className="text-gray-500 text-xs ml-1">
                              (auto-calculated)
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Total blanks: </span>
                          {(prompt.match(/___/g) || []).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {blanks.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="font-medium text-gray-700 mb-2">
                        Blanks and correct answers (not visible to students):
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {blanks.map((blank, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 p-3 rounded-md border border-gray-200"
                          >
                            <p className="font-medium text-gray-700 mb-1">
                              Blank #{blank.position}:
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {blank.correct ? (
                                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-sm">
                                  {blank.correct}
                                </span>
                              ) : (
                                <span className="text-red-500 text-sm">
                                  No answer selected
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl flex justify-between z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                </>
              ) : (
                <>
                  <Save size={18} />
                  {isEditing ? "Update" : "Create"} Question
                  <span className="hidden sm:inline-block"></span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </PermissionWrapper>
  );
};

export default DragDropQuestionForm;
