/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import AdminLoader from "../AdminLoader";
import { Plus, X, Loader2, Trash2 } from "lucide-react";
import {
  useCreatePreDefinedOptionMutation,
  useGetPreDefinedOptionsByQuestionIdQuery,
  useUpdatePreDefinedOptionMutation,
  useDeletePreDefinedOptionMutation,
  useDeletePreDefinedOptionsByQuestionIdMutation,
} from "../../../services/Masters/predefinedOptionAPI";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import PermissionWrapper from "../../../context/PermissionWrapper";

const MasterOptions = ({ questionId, onClose }) => {
  const { id } = useSelector((state) => state.user);

  const [createPreDefinedOption] = useCreatePreDefinedOptionMutation();
  const [updatePreDefinedOption] = useUpdatePreDefinedOptionMutation();
  const [deletePreDefinedOption] = useDeletePreDefinedOptionMutation();
  const [deletePreDefinedOptionsByQuestionId] =
    useDeletePreDefinedOptionsByQuestionIdMutation();

  const {
    data: optionsData,
    isLoading: isLoadingOptions,
    refetch,
  } = useGetPreDefinedOptionsByQuestionIdQuery(questionId);

  const [options, setOptions] = useState([]);
  const [optionType, setOptionType] = useState("text"); // "text" or "image"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOptionTypeChanged, setIsOptionTypeChanged] = useState(false);
  const [deletedOptions, setDeletedOptions] = useState([]);

  useEffect(() => {
    if (optionsData) {
      setOptions(optionsData);
      setOptionType(optionsData[0]?.option_text === "" ? "image" : "text");
    }
  }, [optionsData]);

  const addOption = () => {
    setOptions([
      ...options,
      {
        option_text: "",
        optionImage: null,
        is_correct: false,
        created_by: parseInt(id),
        updated_by: parseInt(id),
        pre_defined_question_id: questionId,
      },
    ]);
  };

  const removeOption = async (option, index) => {
    setOptions((prevOptions) => prevOptions.filter((_, i) => i !== index));
    setDeletedOptions((prevDeletedOptions) => [
      ...prevDeletedOptions,
      option.id,
    ]);
  };

  const handleOptionTextChange = (index, value) => {
    setOptions((prevOptions) =>
      prevOptions.map((option, i) =>
        i === index ? { ...option, option_text: value } : option
      )
    );
  };

  const handleOptionImageChange = (index, file) => {
    const imageUrl = URL.createObjectURL(file);
    setOptions((prevOptions) =>
      prevOptions.map((option, i) =>
        i === index
          ? { ...option, optionImage: file, preview: imageUrl }
          : option
      )
    );
  };

  const handleCorrectAnswerChange = (index) => {
    setOptions((prevOptions) =>
      prevOptions.map((option, i) => ({
        ...option,
        is_correct: i === index,
      }))
    );
  };

  const handleSubmit = async () => {
    const hasCorrectOption = options.some((option) => option.is_correct);

    if (!hasCorrectOption) {
      toast.error("At least one option must be marked as correct.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isOptionTypeChanged) {
        await deletePreDefinedOptionsByQuestionId(questionId);
        setIsOptionTypeChanged(false);
      }
      if (deletedOptions.length > 0) {
        deletedOptions.map(async (id) => await deletePreDefinedOption(id));
      }

      const updatePromises = options.map(async (option) => {
        const formData = new FormData();
        formData.append("option_text", option.option_text);
        formData.append("option_type", option.option_type);
        formData.append("is_correct", option.is_correct);
        formData.append("created_by", String(option.created_by));
        formData.append("updated_by", String(option.updated_by));
        formData.append("pre_defined_question_id", String(questionId));

        if (option.optionImage && option.optionImage instanceof File) {
          formData.append("preDefinedOptionImg", option.optionImage);
        }

        if (option.id) {
          return updatePreDefinedOption({
            id: option.id,
            formData,
          }).unwrap();
        } else {
          return createPreDefinedOption(formData).unwrap();
        }
      });

      await Promise.all(updatePromises);
      toast.success("Options updated successfully!");
      onClose();
    } catch (error) {
      console.error("Failed to update options.", error);
      const errorMessage = error?.data?.errors[0] ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'Failed to update options.. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-leafGreen/20 transform transition-all duration-300 hover:shadow-xl w-full max-w-3xl">
        <div className="bg-forestGreen px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Create Pre-defined Options
            </h2>
            <p className="text-blue-50 mt-1">
              Add options and select the correct answer
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-lightGreen transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <PermissionWrapper section="Predefined Options" action="create">
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
                className="w-full px-4 py-2 bg-lightGreen/10 border border-leafGreen/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300 hover:shadow-md"
              >
                <option value="text">Text</option>
                <option value="image">Image</option>
              </select>
            </div>
          </PermissionWrapper>

          {isLoadingOptions ? (
            <AdminLoader message="Loading options..." />
          ) : (
            <>
              <div className="space-y-4">
                {options.map((option, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 ${option.is_correct
                      ? "bg-lightGreen/20 border-2 border-forestGreen"
                      : "bg-gray-50 hover:bg-lightGreen/10 border-2 border-transparent"
                      }`}
                  >
                    <PermissionWrapper
                      section="Predefined Options"
                      action="edit"
                    >
                      <div className="flex-shrink-0">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={option.is_correct}
                          onChange={() => handleCorrectAnswerChange(index)}
                          className="w-5 h-5 accent-leafGreen border-gray-300 focus:ring-leafGreen cursor-pointer"
                        />
                      </div>
                    </PermissionWrapper>

                    <div className="flex-grow">
                      {optionType === "text" ? (
                        <input
                          type="text"
                          value={option.option_text}
                          onChange={(e) =>
                            handleOptionTextChange(index, e.target.value)
                          }
                          placeholder={`Option ${index + 1}`}
                          className={`w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${option.is_correct
                            ? "border-forestGreen focus:ring-forestGreen focus:border-forestGreen text-black"
                            : "border-leafGreen/20 focus:ring-leafGreen focus:border-leafGreen"
                            }`}
                        />
                      ) : (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleOptionImageChange(index, e.target.files[0])
                          }
                          className={`w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${option.is_correct
                            ? "border-forestGreen focus:ring-forestGreen focus:border-forestGreen text-black"
                            : "border-leafGreen/20 focus:ring-leafGreen focus:border-leafGreen"
                            }`}
                        />
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
                          src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${option.option_img || '/placeholder.png'
                            }`}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      </div>
                    )}

                    <PermissionWrapper
                      section="Predefined Options"
                      action="delete"
                    >
                      {options.length > 1 && (
                        <button
                          onClick={() => removeOption(option, index)}
                          className={`p-2 rounded-lg transition-all duration-300 ${option.is_correct
                            ? "text-white  "
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

              <PermissionWrapper section="Predefined Options" action="create">
                <button
                  onClick={addOption}
                  className="mt-6 w-full flex items-center justify-center space-x-2 px-4 py-3 bg-leafGreen text-white rounded-lg   transition-all duration-300 transform hover:scale-103 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add New Option</span>
                </button>
              </PermissionWrapper>
              {options.length > 1 && (
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-lightGreen/10 transition-all duration-200"
                  >
                    Cancel
                  </button>

                  <PermissionWrapper
                    section="Predefined Options"
                    action="edit|create"
                  >
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-leafGreen text-white rounded-lg   transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin w-5 h-5 mx-auto" />
                      ) : (
                        "Save Options"
                      )}
                    </button>
                  </PermissionWrapper>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterOptions;
