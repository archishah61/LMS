/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  useCreateQuizOptionMutation,
  useUpdateQuizOptionMutation,
  useDeleteQuizOptionMutation,
  useGetQuizOptionByIdQuery,
  useDeleteOptionsByQuestionIdMutation,
} from "../../../services/Course_Management/quizOption";
import { getAdminToken } from "../../../services/CookieService";
import toast from "react-hot-toast";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PermissionWrapper, {
  usePermissions,
} from "../../../context/PermissionWrapper";

function QuizOptions() {
  const { access_token } = getAdminToken();

  const { id } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const { questionId } = useLocation().state;
  const { data: optionsData, refetch } = useGetQuizOptionByIdQuery({
    id: questionId,
    access_token,
  });
  const [createQuizOption] = useCreateQuizOptionMutation();
  const [updateQuizOption] = useUpdateQuizOptionMutation();
  const [deleteQuizOption] = useDeleteQuizOptionMutation();
  const [deleteOptionsByQuestionId] = useDeleteOptionsByQuestionIdMutation();

  const [options, setOptions] = useState([]);
  const [optionType, setOptionType] = useState("text"); // "text" or "image"
  const [isOptionTypeChanged, setIsOptionTypeChanged] = useState(false);
  const [deletedOptions, setDeletedOptions] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (optionsData) {
      setOptions(optionsData);
      setOptionType(optionsData[0]?.option_text === "" ? "image" : "text");
      setHasChanges(false); // Reset change tracking on load
    }
  }, [optionsData]);

  const addOption = () => {
    setOptions((prev) => {
      setHasChanges(true);
      return [
        ...prev,
        {
          option_text: "",
          optionImage: null,
          is_correct: false,
          question_id: parseInt(questionId),
        },
      ];
    });
  };

  const removeOption = async (option, index) => {
    setOptions((prevOptions) => {
      setHasChanges(true);
      return prevOptions.filter((_, i) => i !== index);
    });
    setDeletedOptions((prevDeletedOptions) => [
      ...prevDeletedOptions,
      option.id,
    ]);
  };

  const handleOptionTextChange = (index, value) => {
    setOptions((prevOptions) => {
      setHasChanges(true);
      return prevOptions.map((option, i) =>
        i === index ? { ...option, option_text: value } : option
      );
    });
  };

  const handleOptionImageChange = (index, file) => {
    const imageUrl = URL.createObjectURL(file);
    setOptions((prevOptions) => {
      setHasChanges(true);
      return prevOptions.map((option, i) =>
        i === index
          ? { ...option, optionImage: file, preview: imageUrl }
          : option
      );
    });
  };

  const handleCorrectAnswerChange = (index) => {
    setOptions((prevOptions) => {
      setHasChanges(true);
      return prevOptions.map((option, i) =>
        i === index ? { ...option, is_correct: !option.is_correct } : option
      );
    });
  };

  // Watch for optionType change
  useEffect(() => {
    if (isOptionTypeChanged) setHasChanges(true);
  }, [isOptionTypeChanged]);

  // Compare options with optionsData to detect changes (deep compare)
  useEffect(() => {
    if (!optionsData) return;
    const normalize = (arr) =>
      arr.map((opt) => ({
        ...opt,
        optionImage: undefined, // ignore local file objects
        preview: undefined,
      }));
    const a = JSON.stringify(normalize(options));
    const b = JSON.stringify(normalize(optionsData));
    if (a !== b) setHasChanges(true);
    else setHasChanges(false);
  }, [options, optionsData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasCorrectOption = options.some((option) => option.is_correct);
    if (!hasCorrectOption) {
      toast.error("At least one option must be marked as correct.");
      return;
    }

    try {
      if (isOptionTypeChanged) {
        await deleteOptionsByQuestionId(questionId).unwrap();
        setIsOptionTypeChanged(false);
      }
      if (deletedOptions.length > 0) {
        deletedOptions.map(
          async (id) => await deleteQuizOption({ id, access_token }).unwrap()
        );
      }
      const updatePromises = options.map(async (option) => {
        const formData = new FormData();
        formData.append("option_text", option.option_text);
        formData.append("is_correct", option.is_correct);

        // Convert integers to strings explicitly
        formData.append("question_id", String(option.question_id));

        // Append image only if it's a File
        if (option.optionImage && option.optionImage instanceof File) {
          formData.append("optionImage", option.optionImage);
        }

        if (option.id) {
          return updateQuizOption({
            id: option.id,
            optionData: formData,
            access_token,
          }).unwrap();
        } else {
          return createQuizOption({ optionData: formData, access_token }).unwrap();
        }
      });

      await Promise.all(updatePromises);
      toast.success("Options updated successfully!");
      navigate(-1);
    } catch (error) {
      console.error("Error updating options:", error);
      toast.error(error?.data?.error || "Failed to update options.");
    }
  };

  return (
    <div className="p-6 max-w-full mx-10 bg-lightGreen/20 min-h-screen">
      <PermissionWrapper section="Quiz Option" action="view|create|edit|delete">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-leafGreen/20 transform transition-all duration-300 hover:shadow-xl">
            <div className=" bg-lightGreen px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Create Quiz Options
                </h2>
                <p className="text-lightGreen mt-1">
                  Add options and select the correct answer
                </p>
              </div>
              <button
                onClick={() => navigate(-1)} // Go back one step in history
                className="flex px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover: hover:bg-lightGreen/50 transition-all duration-200"
              >
                Back
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Select Option Type:
                </label>
                <select
                  value={optionType}
                  onChange={(e) => {
                    setOptionType(e.target.value);
                    setOptions([]);
                    setIsOptionTypeChanged(true);
                  }}
                  className="w-full px-4 py-2  bg-lightGreen border border-leafGreen/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300 hover:shadow-md"
                >
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                </select>
              </div>

              <div className="space-y-4">
                {options.map((option, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 ${option.is_correct
                      ? " from-green-400 to-emerald-400 border-2 border-emerald-600"
                      : "bg-gray-50 hover: hover:bg-lightGreen/50 border-2 border-transparent"
                      }`}
                  >
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        className="accent-leafGreen"
                        checked={Boolean(option.is_correct)}
                        onChange={() => handleCorrectAnswerChange(index)}
                      />
                    </div>

                    <div className="flex-grow">
                      {optionType === "text" ? (
                        <PermissionWrapper
                          section="Quiz Option"
                          action="edit|view"
                        >
                          <PermissionWrapper
                            section="Quiz Option"
                            action="edit"
                          >
                            <input
                              type="text"
                              value={option.option_text}
                              onChange={(e) =>
                                handleOptionTextChange(index, e.target.value)
                              }
                              placeholder={`Option ${index + 1}`}
                              className={`w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${option.is_correct
                                ? "border-emerald-400 focus:ring-emerald-600 focus:border-emerald-300 text-black "
                                : "border-leafGreen/20 focus:ring-leafGreen focus:border-leafGreen"
                                }`}
                            />
                          </PermissionWrapper>

                          {hasPermission("Quiz Option", "view") &&
                            !hasPermission("Quiz Option", "edit") && (
                              <input
                                type="text"
                                value={option.option_text}
                                placeholder={`Option ${index + 1}`}
                                className={`w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${option.is_correct
                                  ? "border-emerald-400 focus:ring-emerald-600 focus:border-emerald-300 text-black "
                                  : "border-leafGreen/20 focus:ring-leafGreen focus:border-leafGreen"
                                  }`}
                              />
                            )}
                        </PermissionWrapper>
                      ) : (
                        <PermissionWrapper
                          section="Quiz Option"
                          action="edit|view"
                        >
                          <PermissionWrapper
                            section="Quiz Option"
                            action="edit"
                          >
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleOptionImageChange(
                                  index,
                                  e.target.files[0]
                                )
                              }
                              className={`w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${option.is_correct
                                ? "border-emerald-400 focus:ring-emerald-600 focus:border-emerald-300 text-black"
                                : "border-leafGreen/20 focus:ring-leafGreen focus:border-leafGreen"
                                }`}
                            />
                          </PermissionWrapper>

                          {hasPermission("Quiz Option", "view") &&
                            !hasPermission("Quiz Option", "edit") && (
                              <input
                                type="file"
                                accept="image/*"
                                className={`w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${option.is_correct
                                  ? "border-emerald-400 focus:ring-emerald-300 focus:border-emerald-300 text-black"
                                  : "border-leafGreen/20 focus:ring-leafGreen focus:border-leafGreen"
                                  }`}
                              />
                            )}
                        </PermissionWrapper>
                      )}
                    </div>

                    {optionType === "image" && option.preview && (
                      <img
                        src={option.preview}
                        alt="Option Preview"
                        className="w-16 h-16 rounded-lg object-cover border border-leafGreen/20 shadow-md"
                      />
                    )}

                    {option && option.option_img && (
                      <div>
                        <img
                          src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${option.option_img || "/placeholder.png"
                            }`}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      </div>
                    )}
                    <PermissionWrapper section="Quiz Option" action="delete">
                      {options.length > 1 && (
                        <button
                          onClick={() => removeOption(option, index)}
                          className={`p-2 rounded-lg transition-all duration-300 ${option.is_correct
                            ? "text-white hover:bg-emerald-600"
                            : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                            }`}
                          aria-label="Remove option"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </PermissionWrapper>
                  </div>
                ))}
              </div>

              <PermissionWrapper section="Quiz Option" action="create">
                <button
                  onClick={addOption}
                  className="mt-6 w-full flex items-center justify-center space-x-2 px-4 py-3  bg-lightGreen text-white rounded-lg   transition-all duration-300 transform hover:scale-103 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add New Option</span>
                </button>
              </PermissionWrapper>

              <PermissionWrapper
                section="Quiz Option"
                action="edit|create|delete"
              >
                {options.length > 1 && (
                  <button
                    onClick={handleSubmit}
                    className="mt-6 w-full px-4 py-3  from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-103 shadow-md hover:shadow-lg"
                    disabled={!hasChanges}
                    style={{ opacity: hasChanges ? 1 : 0.5, cursor: hasChanges ? 'pointer' : 'not-allowed' }}
                  >
                    Submit
                  </button>
                )}
              </PermissionWrapper>
            </div>
          </div>
        </div>
      </PermissionWrapper>
    </div>
  );
}

export default QuizOptions;
