"use client";

import { useState, useCallback, memo, useEffect } from "react";
import { X, Plus, BookOpen, Play, Clock, FileText } from "lucide-react";

const getRandomData = (type) => {
  const data = {
    course: {
      title: [
        `Course Title ${Math.floor(Math.random() * 100) + 1}`,
        `Sample Course ${Math.floor(Math.random() * 50) + 1}`,
        `Course Name ${Math.floor(Math.random() * 75) + 1}`,
      ][Math.floor(Math.random() * 3)],
      description: [
        `Course description text goes here`,
        `Sample course description content`,
        `Enter your course description`,
      ][Math.floor(Math.random() * 3)],
      duration_hours: [5, 10, 15, 20, 25][
        Math.floor(Math.random() * 5)
      ].toString(),
      min_time_in_minute: [30, 45, 60, 90][
        Math.floor(Math.random() * 4)
      ].toString(),
      content_type: ["video", "audio", "accordian", "general", "slide"][
        Math.floor(Math.random() * 5)
      ],
    },
    module: {
      title: [
        `Module Title ${Math.floor(Math.random() * 20) + 1}`,
        `Sample Module ${Math.floor(Math.random() * 15) + 1}`,
        `Module Name ${Math.floor(Math.random() * 25) + 1}`,
      ][Math.floor(Math.random() * 3)],
      description: [
        `Module description text goes here`,
        `Sample module description content`,
        `Enter your module description`,
      ][Math.floor(Math.random() * 3)],
      duration_hours: [2, 3, 4, 5, 6][Math.floor(Math.random() * 5)].toString(),
      min_time_in_minute: [15, 20, 30, 45][
        Math.floor(Math.random() * 4)
      ].toString(),
      content_type: ["video", "audio", "accordian", "general", "slide"][
        Math.floor(Math.random() * 5)
      ],
    },
    session: {
      title: [
        `Session Title ${Math.floor(Math.random() * 50) + 1}`,
        `Sample Session ${Math.floor(Math.random() * 30) + 1}`,
        `Session Name ${Math.floor(Math.random() * 40) + 1}`,
      ][Math.floor(Math.random() * 3)],
      description: [
        `Session description text goes here`,
        `Sample session description content`,
        `Enter your session description`,
      ][Math.floor(Math.random() * 3)],
      duration_hours: [1, 1.5, 2, 2.5][
        Math.floor(Math.random() * 4)
      ].toString(),
      min_time_in_minute: [10, 15, 20, 30][
        Math.floor(Math.random() * 4)
      ].toString(),
      content_type: ["video", "audio", "accordian", "general", "slide"][
        Math.floor(Math.random() * 5)
      ],
    },
    topic: {
      title: [
        `Topic Title ${Math.floor(Math.random() * 100) + 1}`,
        `Sample Topic ${Math.floor(Math.random() * 75) + 1}`,
        `Topic Name ${Math.floor(Math.random() * 50) + 1}`,
      ][Math.floor(Math.random() * 3)],
      description: [
        `Topic description text goes here`,
        `Sample topic description content`,
        `Enter your topic description`,
      ][Math.floor(Math.random() * 3)],
      duration_hours: [0.5, 1, 1.5, 2][
        Math.floor(Math.random() * 4)
      ].toString(),
      min_time_in_minute: [5, 10, 15, 20][
        Math.floor(Math.random() * 4)
      ].toString(),
      content_type: ["video", "audio", "accordian", "general", "slide"][
        Math.floor(Math.random() * 5)
      ],
    },
  };

  return data[type] || data.topic;
};

const getTypeIcon = (type) => {
  const icons = {
    course: BookOpen,
    module: FileText,
    session: Play,
    topic: Clock,
  };
  return icons[type] || BookOpen;
};

const contentTypeOptions = [
  {
    value: "video",
    label: "📹 Video",
    color: "bg-red-50 text-red-700 border-red-200",
  },
  {
    value: "audio",
    label: "🎧 Audio",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    value: "accordian",
    label: "📋 FAQ/Accordion",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    value: "general",
    label: "📝 General Text",
    color: "bg-green-50 text-green-700 border-green-200",
  },
  {
    value: "slide",
    label: "🎯 Slides",
    color: "bg-orange-50 text-orange-700 border-orange-200",
  },
];

const AddItemModal = memo(
  ({
    isOpen = true,
    onClose = () => { },
    onAdd = () => { },
    type = "topic",
    parentTitle = "Sample Course",
  }) => {
    const [formData, setFormData] = useState({
      title: "",
      description: "",
      duration_hours: "",
      min_time_in_minute: "",
      content_type: "video",
    });

    useEffect(() => {
      if (isOpen) {
        const randomData = getRandomData(type);
        setFormData(randomData);
      }
    }, [isOpen, type]);

    const handleSubmit = useCallback(
      (e) => {
        e.preventDefault();
        onAdd(formData);
        onClose();
      },
      [formData, onAdd, onClose]
    );

    const handleInputChange = useCallback((field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const TypeIcon = getTypeIcon(type);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              Add New {type.charAt(0).toUpperCase() + type.slice(1)}
              {parentTitle && (
                <p className="text-sm text-gray-600">
                  to "{parentTitle}"
                </p>
              )}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Title Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder={`Enter ${type} title...`}
                />
              </div>

              {/* Description Field - Show for all types */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                  rows={3}
                  placeholder="Enter description..."
                />
              </div>

              {/* Content Type Field - Show only for topics */}
              {type === "topic" && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    Content Type
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {contentTypeOptions.map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.content_type === option.value
                          ? option.color + " border-current"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                          }`}
                      >
                        <input
                          type="radio"
                          name="content_type"
                          value={option.value}
                          checked={formData.content_type === option.value}
                          onChange={(e) =>
                            handleInputChange("content_type", e.target.value)
                          }
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* For quiz type */}
              {/* {type === "quiz" && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                    rows={3}
                    placeholder="Enter quiz description..."
                  />
                </div>
              )} */}

              {/* For assignment type */}
              {type === "assignment" && (
                <>
                  {/* <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                      rows={3}
                      placeholder="Enter assignment description..."
                    />
                  </div> */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800">
                      Type
                    </label>
                    <select
                      value={formData.type || "paragraph_writing"}
                      onChange={(e) => handleInputChange("type", e.target.value)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    >
                      <option value="paragraph_writing">Paragraph Writing</option>
                      <option value="matching">Matching</option>
                      <option value="fill_in_the_blank">Fill in the Blank</option>
                    </select>
                  </div>
                </>
              )}

              {/* Duration Field - Show for modules and courses */}
              {(type === "module" || type === "course") && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    Duration (minutes)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.duration_hours}
                      onChange={(e) =>
                        handleInputChange("duration_hours", e.target.value)
                      }
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Enter duration in hours..."
                      min="0"
                      step="0.5"
                    />
                  </div>
                </div>
              )}

              {/* Minimum Time Field - Show for sessions */}
              {type === "session" && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    Minimum Time (minutes)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.min_time_in_minute}
                      onChange={(e) =>
                        handleInputChange("min_time_in_minute", e.target.value)
                      }
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Enter minimum time in minutes..."
                      min="0"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Fixed at bottom */}
          <div className="flex-shrink-0 p-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 flex items-center justify-center space-x-2 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                <span>Add <span className="hidden sm:inline-flex">{type.charAt(0).toUpperCase() + type.slice(1)}</span></span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

AddItemModal.displayName = "AddItemModal";

export default AddItemModal;
