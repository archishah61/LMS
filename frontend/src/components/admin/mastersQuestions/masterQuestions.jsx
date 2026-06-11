"use client";
import { useEffect, useState, useCallback } from "react";
import AdminLoader from "../AdminLoader";
import {
  X,
  Eye,
  Loader2,
  Edit,
  Trash2,
  Plus,
  GripVertical,
  ArrowLeft,
  FileText,
  Save,
  AlertCircle,
  Upload,
  ImageIcon,
  ChevronDown,
  Camera,
  Search,
  HelpCircle,
  CheckCircle,
  MoreVertical,
  Filter,
} from "lucide-react";
import { useSelector } from "react-redux";
import { getAdminToken } from "../../../services/CookieService";
import {
  useCreateQuestionWithOptionsMutation,
  useGetAllQuestionsWithOptionsQuery,
  useUpdateQuestionWithOptionsMutation,
  useDeleteQuestionWithOptionsMutation,
  useUpdateQuestionSequenceMutation,
  useToggleQuestionStatusMutation,
} from "../../../services/Masters/predefinedQuestionAPI";
import toast from "react-hot-toast";
// Dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";
import PermissionWrapper from "../../../context/PermissionWrapper";
// Using import.meta.env for Vite environment variables
const BACKEND_MEDIA_URL =
  import.meta.env.VITE_BACKEND_MEDIA_URL ||
  "/placeholder.svg?height=100&width=100&query=";
// Help Content Configuration
const helpContent = {
  overview: {
    title: "Master Questions Bank Help",
    content: `
      <div class="space-y-4">
        <h3 class="font-semibold text-gray-900 text-lg">Overview</h3>
        <p class="text-gray-700">The Master Questions Bank allows you to create and manage predefined questions that can be reused across multiple quizzes and courses.</p>
       
        <div className="bg-lightGreen/20 p-4 rounded-lg border border-leafGreen/20">
          <h4 className="font-medium text-forestGreen mb-2">Key Features:</h4>
          <ul className="list-disc pl-5 space-y-1 text-forestGreen">
            <li>Create multiple question types (MCQ, Image Based, True/False)</li>
            <li>Drag and drop to reorder questions</li>
            <li>Bulk question management</li>
            <li>Image support for questions and options</li>
            <li>Search and filter functionality</li>
          </ul>
        </div>
        <h4 class="font-medium text-gray-900 mt-4">Question Types:</h4>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded bg-leafGreen/20 text-forestGreen text-xs">MCQ</span>
            <span className="text-gray-700">Multiple Choice Questions with text options</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded bg-leafGreen/20 text-forestGreen text-xs">Image Based</span>
            <span className="text-gray-700">Questions with image options or image-based questions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs">True/False</span>
            <span className="text-gray-700">Simple true or false questions</span>
          </div>
        </div>
      </div>
    `
  },
  questionTypes: {
    title: "Question Types Guide",
    content: `
      <div class="space-y-4">
        <h3 class="font-semibold text-gray-900 text-lg">Question Types Explained</h3>
       
        <div className="space-y-3">
          <div className="border-l-4 border-leafGreen pl-4 py-2">
            <h4 className="font-medium text-gray-900">Multiple Choice (MCQ)</h4>
            <p className="text-gray-700 text-sm mt-1">Traditional multiple choice questions with text-based options.</p>
            <ul className="list-disc pl-5 mt-2 text-sm text-gray-600">
              <li>Question text is required</li>
              <li>All options must have text</li>
              <li>Images are not allowed</li>
              <li>Exactly one correct answer</li>
            </ul>
          </div>
          <div className="border-l-4 border-forestGreen pl-4 py-2">
            <h4 className="font-medium text-gray-900">Image Based</h4>
            <p className="text-gray-700 text-sm mt-1">Questions that use images for questions or options.</p>
            <ul className="list-disc pl-5 mt-2 text-sm text-gray-600">
              <li>Question text is optional if question image is provided</li>
              <li>At least one image (question or option) is required</li>
              <li>Option text is optional when using option images</li>
              <li>Perfect for visual learning and identification</li>
            </ul>
          </div>
          <div className="border-l-4 border-gray-500 pl-4 py-2">
            <h4 className="font-medium text-gray-900">True/False</h4>
            <p className="text-gray-700 text-sm mt-1">Simple true or false questions with predefined options.</p>
            <ul className="list-disc pl-5 mt-2 text-sm text-gray-600">
              <li>Question text is required</li>
              <li>Options are automatically set to "True" and "False"</li>
              <li>Images are not allowed</li>
              <li>Cannot add or remove options</li>
            </ul>
          </div>
        </div>
      </div>
    `
  },
  creatingQuestions: {
    title: "Creating Questions Guide",
    content: `
      <div class="space-y-4">
        <h3 class="font-semibold text-gray-900 text-lg">How to Create Questions</h3>
       
        <div className="space-y-3">
          <div className="bg-lightGreen/20 p-3 rounded-lg border border-leafGreen/20">
            <h4 className="font-medium text-forestGreen">Step 1: Basic Information</h4>
            <p className="text-forestGreen text-sm mt-1">Fill in the question text, select question type, and set marks.</p>
          </div>
          <div className="bg-lightGreen/10 p-3 rounded-lg border border-leafGreen/10">
            <h4 className="font-medium text-forestGreen">Step 2: Configure Options</h4>
            <p className="text-forestGreen text-sm mt-1">Add options and mark the correct answer. For image-based questions, you can upload images.</p>
          </div>
          <div className="bg-lightGreen/5 p-3 rounded-lg border border-leafGreen/5">
            <h4 className="font-medium text-forestGreen">Step 3: Validation Rules</h4>
            <ul className="list-disc pl-5 mt-2 text-sm text-forestGreen">
              <li><strong>MCQ:</strong> All options must have text, no images allowed</li>
              <li><strong>Image Based:</strong> At least one image required</li>
              <li><strong>True/False:</strong> Fixed options, no modifications allowed</li>
              <li><strong>All types:</strong> Must have exactly one correct answer</li>
            </ul>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900">Pro Tips</h4>
            <ul className="list-disc pl-5 mt-2 text-sm text-green-800">
              <li>Use clear and unambiguous question text</li>
              <li>Ensure options are distinct and not overlapping</li>
              <li>Set appropriate marks based on question difficulty</li>
              <li>Use images for visual learning when appropriate</li>
            </ul>
          </div>
        </div>
      </div>
    `
  },
  managingQuestions: {
    title: "Managing Questions Guide",
    content: `
      <div class="space-y-4">
        <h3 class="font-semibold text-gray-900 text-lg">Question Management Features</h3>
       
        <div className="grid gap-3">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-leafGreen/20 rounded-full flex items-center justify-center">
              <Eye className="w-4 h-4 text-forestGreen" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">View Questions</h4>
              <p className="text-gray-700 text-sm mt-1">Click the eye icon to view question details without editing.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-leafGreen/30 rounded-full flex items-center justify-center">
              <Edit className="w-4 h-4 text-forestGreen" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Edit Questions</h4>
              <p className="text-gray-700 text-sm mt-1">Click the edit icon to modify existing questions.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Delete Questions</h4>
              <p className="text-gray-700 text-sm mt-1">Click the trash icon to remove questions (action requires confirmation).</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-leafGreen/40 rounded-full flex items-center justify-center">
              <GripVertical className="w-4 h-4 text-forestGreen" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Reorder Questions</h4>
              <p className="text-gray-700 text-sm mt-1">Drag and drop questions using the handle to change their sequence.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Search className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Search & Filter</h4>
              <p className="text-gray-700 text-sm mt-1">Use the search bar to quickly find questions by text content.</p>
            </div>
          </div>
        </div>
      </div>
    `
  }
};
// Help Modal Component
const HelpModal = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl bg-white rounded-lg flex flex-col">
        <div className="bg-leafGreen px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-leafGreen text-white rounded-lg transition-colors font-medium shadow-md"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// Help Icon Component
const HelpIcon = ({ onClick, className = "", size = "default" }) => {
  const sizeClasses = {
    small: "w-4 h-4",
    default: "w-5 h-5",
    large: "w-6 h-6"
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-1 text-gray-400 hover:text-leafGreen transition-colors rounded-full hover:bg-lightGreen/20 ${className}`}
      title="Get help"
    >
      <HelpCircle className={sizeClasses[size]} />
    </button>
  );
};
// Sortable Question Row Component
// Sortable Question Row Component
const SortableQuestionRow = ({
  question,
  index,
  handleView,
  handleEdit,
  handleDelete,
  deletingQuestionId,
  handleToggleQuestionActive,
  BACKEND_MEDIA_URL,
  onShowHelp,
  isMobile = false,
  mobileMenuOpen,
  setMobileMenuOpen
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Enhanced touch handlers for mobile
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    // Start drag operation
    listeners?.onTouchStart?.(e);
  }, [listeners]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    // Let dnd-kit handle the movement
    listeners?.onTouchMove?.(e);
  }, [listeners]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    listeners?.onTouchEnd?.(e);
  }, [listeners]);

  // Enhanced mouse handlers for desktop
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    listeners?.onMouseDown?.(e);
  }, [listeners]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      listeners?.onKeyDown?.(e);
    }
  }, [listeners]);

  // Common drag handle props
  const dragHandleProps = {
    ...attributes,
    ...listeners,
    style: {
      touchAction: 'none',
      cursor: isDragging ? 'grabbing' : 'grab'
    },
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleMouseDown,
    onKeyDown: handleKeyDown,
  };

  if (isMobile) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-white border border-gray-200 rounded-lg shadow-sm mb-3 ${isDragging
          ? "shadow-lg border-2 border-leafGreen/50 rotate-2"
          : "hover:shadow-md"
          } transition-all duration-200`}
      >
        <div className="p-4 space-y-3">
          {/* Header Row */}
          <div className="flex justify-between items-start">
            {/* Left side: Drag handle and basic info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                {...dragHandleProps}
                className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200 ${isDragging
                  ? "bg-lightGreen/20 ring-2 ring-leafGreen/50"
                  : "hover:bg-lightGreen/10 active:bg-lightGreen/20"
                  }`}
              >
                <GripVertical
                  className={`w-4 h-4 transition-colors duration-200 ${isDragging
                    ? "text-forestGreen"
                    : "text-gray-400 hover:text-forestGreen"
                    }`}
                />
              </div>
              <div
                className="flex-1 min-w-0"
                onClick={(e) => {
                  // Prevent drag handle from triggering view when dragging
                  if (!isDragging) {
                    handleView(question);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 text-base">
                    Q{question.sequence_no}
                  </h4>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${question.question_type === "mcq"
                      ? "bg-lightGreen/20 text-forestGreen"
                      : question.question_type === "image"
                        ? "bg-leafGreen/20 text-forestGreen"
                        : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {question.question_type.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {question.question_text}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>{question.marks} marks</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full ${question.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                      }`}
                  >
                    {question.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
            {/* Right side: Mobile menu */}
            <div className="relative flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileMenuOpen(mobileMenuOpen === question.id ? null : question.id);
                }}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 transition-colors"
                disabled={isDragging}
              >
                <MoreVertical size={16} />
              </button>
              {mobileMenuOpen === question.id && (
                <div className="absolute right-0 top-10 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-40">
                  <PermissionWrapper section="Predefined Questions" action="view">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleView(question);
                        setMobileMenuOpen(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </PermissionWrapper>
                  <PermissionWrapper section="Predefined Questions" action="edit">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(question);
                        setMobileMenuOpen(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  </PermissionWrapper>
                  <PermissionWrapper section="Predefined Questions" action="delete">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(question.id);
                        setMobileMenuOpen(null);
                      }}
                      disabled={deletingQuestionId === question.id}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                    >
                      {deletingQuestionId === question.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete
                    </button>
                  </PermissionWrapper>
                  <div className="border-t border-gray-100 my-1"></div>
                  <PermissionWrapper section="Predefined Questions" action="edit">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleQuestionActive(question.id, question.is_active);
                        setMobileMenuOpen(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 justify-between"
                    >
                      <span>{question.is_active ? "Deactivate" : "Activate"}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={question.is_active}
                          onChange={() => { }}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                        <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                      </label>
                    </button>
                  </PermissionWrapper>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop View
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 rounded-lg shadow-sm mb-4 ${isDragging
        ? "shadow-xl border-2 border-leafGreen rotate-1 z-50"
        : "hover:shadow-md"
        } transition-all duration-200`}
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-4 flex-1">
            <div
              {...dragHandleProps}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${isDragging
                ? "bg-lightGreen/20 ring-2 ring-leafGreen/50"
                : "hover:bg-lightGreen/10 active:bg-lightGreen/20"
                }`}
            >
              <GripVertical
                className={`w-5 h-5 transition-colors duration-200 ${isDragging
                  ? "text-forestGreen"
                  : "text-gray-400 hover:text-forestGreen"
                  }`}
              />
            </div>
            <div
              className="flex-1"
              onClick={(e) => {
                // Prevent drag handle from triggering view when dragging
                if (!isDragging) {
                  handleView(question);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <h4 className="font-semibold text-gray-900 text-lg">
                  Question {question.sequence_no}
                </h4>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${question.question_type === "mcq"
                    ? "bg-lightGreen/20 text-forestGreen"
                    : question.question_type === "image"
                      ? "bg-leafGreen/20 text-forestGreen"
                      : "bg-gray-100 text-gray-800"
                    }`}
                >
                  {question.question_type.toUpperCase()}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {question.marks} marks
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${question.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                    }`}
                >
                  {question.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-gray-700 mb-4 text-base leading-relaxed line-clamp-2">
                {question.question_text}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <span className="font-medium text-gray-700">
                    {question.options.length}
                  </span>{" "}
                  options
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium text-green-600">
                    {
                      question.options.filter((opt) => Boolean(opt.is_correct))
                        .length
                    }
                  </span>{" "}
                  correct
                </span>
              </div>
              {/* Options Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {question.options.slice(0, 4).map((option, optIndex) => (
                  <div
                    key={optIndex}
                    className={`text-sm p-3 rounded-lg border transition-colors ${Boolean(option.is_correct)
                      ? "bg-green-50 border-green-500 text-green-800"
                      : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                  >
                    <div className="flex items-center">
                      <span className="font-medium mr-2 text-xs bg-white rounded px-2 py-1">
                        {String.fromCharCode(65 + optIndex)}
                      </span>
                      <span className="truncate flex-1">
                        {option.option_text}
                      </span>
                      {Boolean(option.is_correct) && (
                        <span className="ml-2 text-green-600 font-bold">✓</span>
                      )}
                    </div>
                  </div>
                ))}
                {question.options.length > 4 && (
                  <div className="text-sm p-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 flex items-center justify-center">
                    <span className="font-medium">
                      +{question.options.length - 4} more options
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Action Buttons and Toggle */}
          <div className="flex gap-2 ml-4 items-center">
            <PermissionWrapper section="Predefined Questions" action="view">
              <button
                onClick={() => handleView(question)}
                disabled={isDragging}
                className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-leafGreen transition-colors disabled:opacity-50"
              >
                <Eye className="h-4 w-4" />
              </button>
            </PermissionWrapper>
            <PermissionWrapper section="Predefined Questions" action="edit">
              <button
                onClick={() => handleEdit(question)}
                disabled={isDragging}
                className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-leafGreen transition-colors disabled:opacity-50"
              >
                <Edit className="h-4 w-4" />
              </button>
            </PermissionWrapper>
            <PermissionWrapper section="Predefined Questions" action="delete">
              <button
                onClick={() => handleDelete(question.id)}
                disabled={deletingQuestionId === question.id || isDragging}
                className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-red-50 hover:border-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deletingQuestionId === question.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </PermissionWrapper>
            <PermissionWrapper section="Predefined Questions" action="edit">
              <label
                className="relative inline-flex items-center cursor-pointer"
                onClick={(e) => e.stopPropagation()}
                title={question.is_active ? "Deactivate" : "Activate"}
              >
                <input
                  type="checkbox"
                  checked={question.is_active}
                  onChange={() =>
                    handleToggleQuestionActive(question.id, question.is_active)
                  }
                  disabled={isDragging}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors disabled:opacity-50"></div>
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
              </label>
            </PermissionWrapper>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MasterQuestionsNew() {
  const { id } = useSelector((state) => state.user);
  const { access_token } = getAdminToken();
  const navigate = useNavigate();
  // API Hooks
  const [createQuestionWithOptions, { isLoading: isCreating }] =
    useCreateQuestionWithOptionsMutation();
  const [updateQuestionWithOptions, { isLoading: isUpdating }] =
    useUpdateQuestionWithOptionsMutation();
  const [deleteQuestionWithOptions] = useDeleteQuestionWithOptionsMutation();
  const [updateQuestionSequence] = useUpdateQuestionSequenceMutation();
  const [toggleQuestionStatus] = useToggleQuestionStatusMutation();
  // Pagination and Search States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  // Filter States
  const [filter, setFilter] = useState({
    questionType: "",
    status: "",
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // Help Modal State
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [currentHelpContent, setCurrentHelpContent] = useState("overview");
  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(null);
  // Queries
  const {
    data: questionsData,
    isLoading: isLoadingQuestions,
    refetch,
  } = useGetAllQuestionsWithOptionsQuery({
    search: searchTerm,
    page: currentPage,
    limit: itemsPerPage,
    questionType: filter?.questionType,
    status: filter?.status
  });

  const questions = questionsData?.data?.questions || [];
  const totalQuestions = questionsData?.data?.total || 0;
  const totalPages = Math.ceil(totalQuestions / itemsPerPage);
  const [reorderedQuestions, setReorderedQuestions] = useState([]);
  const [deletingQuestionId, setDeletingQuestionId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  // Form state
  const initialFormData = {
    question_text: "",
    question_type: "mcq",
    marks: "",
    is_active: true,
    options: [
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
    ],
  };
  const [formData, setFormData] = useState(initialFormData);
  const [questionImage, setQuestionImage] = useState(null);
  const [optionImages, setOptionImages] = useState({});
  const [questionImagePreview, setQuestionImagePreview] = useState(null);
  const [optionImagePreviews, setOptionImagePreviews] = useState({});
  // Dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced distance for better mobile experience
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    // Add TouchSensor for better mobile support
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Help modal handler
  const handleShowHelp = (helpSection = "overview") => {
    setCurrentHelpContent(helpSection);
    setShowHelpModal(true);
  };
  useEffect(() => {
    if (questions) {
      const questionsWithSequence = questions.map((q, idx) => ({
        ...q,
        sequence_no: q.sequence_no || idx + 1,
      }));
      setReorderedQuestions(questionsWithSequence);
    }
  }, [questions]);
  useEffect(() => {
    if (!id) {
      return;
    }
  }, [id]);

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      // Handle true_false question type
      if (name === "question_type" && value === "true_false") {
        newFormData.options = [
          { option_text: "True", is_correct: true },
          { option_text: "False", is_correct: false },
        ];
        // Clear images if changing to true_false
        setQuestionImage(null);
        setQuestionImagePreview(null);
        setOptionImages({});
        setOptionImagePreviews({});
      } else if (
        name === "question_type" &&
        prev.question_type === "true_false" &&
        value !== "true_false"
      ) {
        // If changing from true_false to another type, reset options to default empty
        newFormData.options = [
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
        ];
      } else if (name === "question_type" && value === "mcq") {
        // Clear images if changing to mcq
        setQuestionImage(null);
        setQuestionImagePreview(null);
        setOptionImages({});
        setOptionImagePreviews({});
      }
      return newFormData;
    });
    setHasUnsavedChanges(true);
  };
  const handleQuestionImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQuestionImage(file);
      const preview = URL.createObjectURL(file);
      setQuestionImagePreview(preview);
      setHasUnsavedChanges(true);
    }
  };
  const handleOptionChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      ),
    }));
    setHasUnsavedChanges(true);
  };
  const handleCorrectAnswerChange = (index) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((option, i) => ({
        ...option,
        is_correct: i === index,
      })),
    }));
    setHasUnsavedChanges(true);
  };
  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, { option_text: "", is_correct: false }],
    }));
    setHasUnsavedChanges(true);
  };
  const removeOption = (index) => {
    if (formData.options.length > 2) {
      setFormData((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }));
      setHasUnsavedChanges(true);
    }
  };
  const resetForm = () => {
    setFormData(initialFormData);
    setQuestionImage(null);
    setOptionImages({});
    setQuestionImagePreview(null);
    setOptionImagePreviews({});
    setSelectedQuestion(null);
    setShowModal(false);
    setModalMode("create");
    setHasUnsavedChanges(false);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation Logic
    const errors = [];
    if (!formData.marks || formData.marks < 1) {
      errors.push("Marks must be a positive number");
    }
    const hasCorrectAnswer = formData.options.some((opt) => opt.is_correct);
    if (!hasCorrectAnswer) {
      errors.push("Please select a correct answer");
    }
    if (formData.question_type === "mcq") {
      if (!formData.question_text.trim()) {
        errors.push("Question text is required for Multiple Choice questions.");
      }
      const hasEmptyOptions = formData.options.some(
        (opt) => !opt.option_text.trim()
      );
      if (hasEmptyOptions) {
        errors.push(
          "All options must have text for Multiple Choice questions."
        );
      }
      if (
        questionImage ||
        Object.keys(optionImages).length > 0 ||
        (selectedQuestion?.question_img && modalMode === "edit") ||
        Object.values(selectedQuestion?.options || {}).some(
          (opt) => opt.option_img
        )
      ) {
        errors.push("Images are not allowed for Multiple Choice questions.");
      }
    } else if (formData.question_type === "true_false") {
      if (!formData.question_text.trim()) {
        errors.push("Question text is required for True/False questions.");
      }
      if (
        questionImage ||
        Object.keys(optionImages).length > 0 ||
        (selectedQuestion?.question_img && modalMode === "edit") ||
        Object.values(selectedQuestion?.options || {}).some(
          (opt) => opt.option_img
        )
      ) {
        errors.push("Images are not allowed for True/False questions.");
      }
    } else if (formData.question_type === "image") {
      const hasQuestionImage =
        questionImage ||
        (selectedQuestion?.question_img && modalMode === "edit");
      const hasOptionImage =
        Object.keys(optionImages).length > 0 ||
        Object.values(selectedQuestion?.options || {}).some(
          (opt) => opt.option_img
        );
      if (!hasQuestionImage && !hasOptionImage) {
        errors.push(
          "For Image Based questions, at least one image (question or option) is required."
        );
      }
      if (!hasQuestionImage && !formData.question_text.trim()) {
        errors.push(
          "If no question image is provided, question text is required for Image Based questions."
        );
      }
    }
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }
    const payload = new FormData();
    payload.append("question_text", formData.question_text);
    payload.append("question_type", formData.question_type);
    payload.append("marks", formData.marks);
    const optionsWithImages = formData.options.map((option, index) => {
      const newOption = { ...option };
      if (optionImages[index]) {
        // The backend handles the file upload and path generation.
      } else if (
        selectedQuestion &&
        selectedQuestion.options[index]?.option_img
      ) {
        newOption.option_img = selectedQuestion.options[index].option_img;
      } else {
        delete newOption.option_img;
      }
      return newOption;
    });
    payload.append("options", JSON.stringify(optionsWithImages));
    if (questionImage) {
      payload.append("predefineQuestionImage", questionImage);
    } else if (selectedQuestion?.question_img && modalMode === "edit") {
      payload.append("question_img", selectedQuestion.question_img);
    } else {
      payload.append("question_img", "");
    }
    Object.entries(optionImages).forEach(([index, file]) => {
      payload.append(`predefineOptionImages[${index}]`, file);
    });
    try {
      if (modalMode === "edit") {
        await updateQuestionWithOptions({
          id: selectedQuestion.id,
          formData: payload,
          access_token,
        }).unwrap();
        toast.success("Question updated successfully");
      } else {
        await createQuestionWithOptions({
          formData: payload,
          access_token,
        }).unwrap();
        toast.success("Question created successfully");
      }
      resetForm();
      refetch();
    } catch (error) {
      console.error("Error saving question:", error);
      const errorMessage =
        error?.data?.errors?.[0] ||
        error?.data?.message ||
        error?.data?.error ||
        "Failed to save question";
      toast.error(errorMessage);
    }
  };
  const handleView = (question) => {
    setSelectedQuestion(question);
    setFormData({
      question_text: question.question_text,
      question_type: question.question_type,
      marks: question.marks.toString(),
      is_active: question.is_active,
      options: question.options,
    });
    setModalMode("view");
    setShowModal(true);
  };
  const handleEdit = (question) => {
    setSelectedQuestion(question);
    setFormData({
      question_text: question.question_text,
      question_type: question.question_type,
      marks: question.marks.toString(),
      is_active: question.is_active,
      options: question.options,
    });
    setQuestionImagePreview(
      question.question_img
        ? `${BACKEND_MEDIA_URL}${question.question_img}`
        : null
    );
    const initialOptionPreviews = {};
    question.options.forEach((opt, idx) => {
      if (opt.option_img) {
        initialOptionPreviews[idx] = `${BACKEND_MEDIA_URL}${opt.option_img}`;
      }
    });
    setOptionImagePreviews(initialOptionPreviews);
    setModalMode("edit");
    setShowModal(true);
  };
  const handleDelete = (questionId) => {
    const question = reorderedQuestions.find((q) => q.id === questionId);
    setQuestionToDelete({ question, id: questionId });
    setShowDeleteDialog(true);
  };
  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return;
    setDeletingQuestionId(questionToDelete.id);
    try {
      await deleteQuestionWithOptions({
        id: questionToDelete.id,
        access_token,
      }).unwrap();
      toast.success("Question deleted successfully");
      refetch();
    } catch (error) {
      toast.error(error?.data?.error || "Failed to delete question");
    } finally {
      setDeletingQuestionId(null);
      setShowDeleteDialog(false);
      setQuestionToDelete(null);
    }
  };
  const handleAddQuestion = () => {
    resetForm();
    setModalMode("create");
    setShowModal(true);
  };
  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;

      if (!over) {
        return;
      }

      if (active.id !== over.id) {
        setReorderedQuestions((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);

          if (oldIndex === -1 || newIndex === -1) {
            return items;
          }

          const newArray = arrayMove(items, oldIndex, newIndex);

          // Update sequence numbers locally immediately for better UX
          const updatedSequence = newArray.map((question, index) => ({
            id: question.id,
            sequence_no: index + 1,
          }));

          // Send update to backend
          updateQuestionSequence({
            data: { updatedSequence },
            access_token,
          })
            .unwrap()
            .then(() => {
              toast.success("Question sequence updated successfully!");
            })
            .catch((error) => {
              console.error("Error updating sequence:", error);
              toast.error(error?.data?.error || "Failed to update question sequence");
              // Revert on error
              refetch();
            });

          return newArray;
        });
      }
    },
    [updateQuestionSequence, access_token, refetch]
  );

  const handleToggleQuestionActive = async (questionId, currentStatus) => {
    const originalQuestions = [...reorderedQuestions];
    setReorderedQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, is_active: !currentStatus } : q
      )
    );
    try {
      await toggleQuestionStatus({ id: questionId, access_token }).unwrap();
      toast.success(
        `Question status updated to ${!currentStatus ? "Active" : "Inactive"}`
      );
      refetch();
    } catch (error) {
      console.error("Error toggling question status:", error);
      toast.error(error?.data?.error || "Failed to update question status");
      setReorderedQuestions(originalQuestions);
    }
  };
  // Filter handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const clearFilters = () => {
    setFilter({
      questionType: "",
      status: "",
    });
    setSearchTerm("");
  };
  const hasActiveFilters = filter.questionType || filter.status || searchTerm;
  // Apply filters to questions
  const filteredQuestions = reorderedQuestions
  // .filter((question) => {
  //   const matchesSearch = question.question_text
  //     .toLowerCase()
  //     .includes(searchTerm.toLowerCase());
  //   const matchesQuestionType = !filter.questionType ||
  //     question.question_type === filter.questionType;
  //   const matchesStatus = !filter.status ||
  //     (filter.status === "active" && question.is_active) ||
  //     (filter.status === "inactive" && !question.is_active);

  //   return matchesSearch && matchesQuestionType && matchesStatus;
  // });
  // Custom Select Component
  const CustomSelect = ({
    value,
    onChange,
    options,
    placeholder,
    disabled = false,
    showHelp = false,
    onHelpClick,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find((opt) => opt.value === value);
    return (
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm sm:text-base font-medium text-gray-700">
            Question Type *
          </label>
          {showHelp && (
            <HelpIcon
              onClick={onHelpClick}
              size="small"
            />
          )}
        </div>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`text-sm sm:text-base w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen flex items-center justify-between ${disabled ? "opacity-50 cursor-not-allowed bg-gray-100" : ""
            }`}
          disabled={disabled}
        >
          <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""
              }`}
          />
        </button>
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="w-full text-sm sm:text-base px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };
  // Render question list
  const renderQuestionsList = () => {
    if (
      filteredQuestions.length === 0 &&
      !isLoadingQuestions &&
      !hasActiveFilters
    ) {
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white">
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="rounded-full bg-gray-100 p-6 mb-4">
              <FileText className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No questions yet
            </h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              Get started by adding your first predefined question with options
              to build your question bank.
            </p>
            <button
              onClick={handleAddQuestion}
              className="inline-flex items-center px-4 py-2 bg-leafGreen text-white font-medium rounded-md shadow-sm transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Question
            </button>
          </div>
        </div>
      );
    }
    if (
      filteredQuestions.length === 0 &&
      !isLoadingQuestions &&
      hasActiveFilters
    ) {
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white">
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="rounded-full bg-gray-100 p-6 mb-4">
              <FileText className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No matching questions found
            </h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              Try adjusting your filters or search term to see more questions.
            </p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      );
    }
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredQuestions.map((question) => question.id)}
          strategy={verticalListSortingStrategy}
        >
          {/* Desktop View */}
          <div className="hidden sm:block space-y-4">
            {filteredQuestions.map((question, index) => (
              <SortableQuestionRow
                key={question.id}
                question={question}
                index={index}
                handleView={handleView}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                deletingQuestionId={deletingQuestionId}
                handleToggleQuestionActive={handleToggleQuestionActive}
                BACKEND_MEDIA_URL={BACKEND_MEDIA_URL}
              />
            ))}
          </div>
          {/* Mobile View */}
          <div className="sm:hidden space-y-3">
            {filteredQuestions.map((question, index) => (
              <SortableQuestionRow
                key={question.id}
                question={question}
                index={index}
                handleView={handleView}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                deletingQuestionId={deletingQuestionId}
                handleToggleQuestionActive={handleToggleQuestionActive}
                BACKEND_MEDIA_URL={BACKEND_MEDIA_URL}
                isMobile={true}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  };
  if (isLoadingQuestions) {
    return <AdminLoader message="Loading questions..." />;
  }
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title={helpContent[currentHelpContent]?.title || "Help"}
        content={helpContent[currentHelpContent]?.content || ""}
      />

      {/* Header Section - Fixed */}
      <div className="fixed top-0 left-0 sm:left-12 lg:left-20 right-0 bg-white border-b border-gray-200 flex-shrink-0 z-10 shadow-sm">
        <div className="w-full p-4">
          {/* Mobile View Header */}
          <div className="sm:hidden">
            {/* Top Row - Title and Back Button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1"></div>
              <div className="flex justify-center">
                <h1 className="text-xl font-bold text-forestGreen text-center">
                  Master Questions
                </h1>
              </div>
              <div className="flex-1 flex justify-end">
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="flex items-center gap-1 p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                >
                  <ArrowLeft size={14} />
                </button>
              </div>
            </div>
            {/* Bottom Row - Two Buttons in Columns with margin top */}
            <div className="flex items-center gap-2 mt-2">
              {/* Search Input - Full width */}
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen text-sm"
                />
              </div>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center p-[9px] text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
              >
                <Filter size={18} />
              </button>
              {/* Create Question Button - Small plus on right */}
              <PermissionWrapper section="Predefined Questions" action="create">
                <button
                  onClick={handleAddQuestion}
                  className="bg-leafGreen   text-white rounded-lg flex items-center justify-center transition-colors font-medium shadow-sm h-9 w-9"
                >
                  <Plus size={16} />
                </button>
              </PermissionWrapper>
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden sm:block">
            <div className="flex items-center justify-between">
              <div className="flex-1 mx-2">
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <h1 className="text-xl text-center md:text-start md:text-2xl font-bold text-forestGreen">
                    Master Questions <span className="hidden sm:inline">Bank</span>
                  </h1>
                  <HelpIcon
                    onClick={() => handleShowHelp("overview")}
                    className="text-gray-500 hover:text-leafGreen"
                  />
                </div>
                <p className="text-sm text-center sm:text-left md:text-base text-gray-600 mt-1">
                  Manage predefined questions
                </p>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                >
                  <Filter size={18} />
                  <span className="font-medium">Filters</span>
                  {isFilterOpen ? (
                    <ChevronDown size={16} className="transform rotate-180" />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
                <PermissionWrapper section="Predefined Questions" action="create">
                  <button
                    onClick={handleAddQuestion}
                    className="bg-leafGreen   text-white sm:px-4 p-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
                  >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Add <span className="hidden lg:inline">Question</span></span>
                  </button>
                </PermissionWrapper>
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="flex items-center border gap-2 sm:px-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span className="hidden sm:inline">Back</span>
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Filter Section */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterOpen ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"}`}
          >
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-4`}>
                {/* Search Bar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Questions
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen"
                    />
                  </div>
                </div>
                {/* Question Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type
                  </label>
                  <select
                    name="questionType"
                    value={filter.questionType}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen bg-white"
                  >
                    <option value="">All Types</option>
                    <option value="mcq">Multiple Choice</option>
                    <option value="image">Image Based</option>
                    <option value="true_false">True/False</option>
                  </select>
                </div>
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={filter.status}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen bg-white"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-3">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-leafGreen hover:text-forestGreen font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Dynamic margin based on filter state */}
      <div
        className={`flex-1 w-full p-4 sm:px-6 transition-all duration-300 ${isFilterOpen
          ? 'sm:mt-[200px]' // More space when filters are open
          : 'sm:mt-[100px]' // Less space when only header is visible
          } ${isFilterOpen ? 'mt-[420px]' : 'mt-28'}`} // Mobile margins
      >
        {/* Unsaved Changes Warning */}
        {/* {hasUnsavedChanges && (
          <div className="mb-6 p-4 border border-yellow-200 bg-yellow-50 rounded-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Unsaved Changes</h4>
                <p className="text-yellow-700 text-sm mt-1">
                  You have unsaved changes. Make sure to save your questions
                  before leaving this page.
                </p>
              </div>
            </div>
          </div>
        )} */}

        {/* Questions Section */}
        <div>
          {/* Questions List */}
          {renderQuestionsList()}

          {/* Pagination */}
          {totalQuestions > 0 && (
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.max(1, prev - 1))
                }
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-gray-700 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Main Modal - Optimized for Mobile */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 z-50 sm:p-0">
            <div className="w-full max-h-[80vh] sm:max-w-4xl md:max-h-[90vh] sm:h-full overflow-hidden shadow-2xl bg-white rounded-xl flex flex-col sm:rounded-lg">
              {/* Header - Compact for Mobile */}
              <div className={`bg-white border-b border-gray-200 px-3 sm:px-6 py-2 sm:py-4 sticky top-0 z-10 ${modalMode !== "view" ? "sm:border-b-0" : ""}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                      {modalMode === "create"
                        ? "Create Question"
                        : modalMode === "edit"
                          ? "Edit Question"
                          : "View Question"}
                    </h2>
                    <HelpIcon
                      onClick={() => handleShowHelp("creatingQuestions")}
                      size="small"
                      className="hidden sm:block"
                    />
                  </div>
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors duration-200"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                <p className={`text-gray-600 mt-1 text-xs sm:text-base ${modalMode !== "view" ? "sm:hidden" : ""}`}>
                  {modalMode === "view"
                    ? "Question details and options"
                    : "Fill in question details"}
                </p>
              </div>

              {/* Content - Compact for Mobile */}
              <div className={`flex-1 overflow-y-auto  ${modalMode === "view" ? "sm:pb-0" : ""}`}>
                {modalMode === "view" ? (
                  // View Mode - Compact Mobile
                  <div className="space-y-2 sm:space-y-6">
                    {formData.question_text && (
                      <div className="bg-white rounded-lg w-full">
                        <div className="p-2 sm:p-6">
                          <label className="text-sm font-semibold text-gray-900 mb-1 block">
                            Question Text
                          </label>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {formData.question_text || "N/A"}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-6">
                      <div className="bg-white rounded-lg w-full">
                        <div className="p-2 sm:p-6">
                          <label className="text-sm font-semibold text-gray-900 mb-1 block">
                            Question Type
                          </label>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${formData.question_type === "mcq"
                              ? "bg-lightGreen/20 text-forestGreen"
                              : formData.question_type === "image"
                                ? "bg-lightGreen/20 text-forestGreen"
                                : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {formData.question_type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg w-full">
                        <div className="p-2 sm:p-6">
                          <label className="text-sm font-semibold text-gray-900 mb-1 block">
                            Marks
                          </label>
                          <span className="text-base font-bold text-gray-900">
                            {formData.marks}
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedQuestion?.question_img && (
                      <div className="bg-gray-50 rounded-lg w-full">
                        <div className="p-2 sm:p-6">
                          <label className="text-sm font-semibold text-gray-900 mb-1 block">
                            Question Image
                          </label>
                          <div className="w-full h-32 sm:h-64 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-white">
                            <img
                              src={`${BACKEND_MEDIA_URL}${selectedQuestion.question_img || '/placeholder.png'}`}
                              alt="Question"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="bg-white rounded-lg w-full">
                      <div className="p-2 sm:p-6">
                        <label className="text-sm font-semibold text-gray-900 mb-2 block">
                          Answer Options
                        </label>
                        <div className="space-y-2 sm:space-y-4">
                          {formData.options.map((option, index) => (
                            <div
                              key={index}
                              className={`border rounded-lg w-full ${option.is_correct
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200 bg-white"
                                }`}
                            >
                              <div className="p-2 sm:p-4">
                                <div className="flex items-center justify-between">
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-white border border-gray-200">
                                    {String.fromCharCode(65 + index)}
                                  </span>
                                  {Boolean(option.is_correct) && (
                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500 text-white">
                                      ✓ Correct
                                    </span>
                                  )}
                                </div>
                                {option.option_text && (
                                  <p className="text-gray-700 text-sm mt-1">
                                    {option.option_text || "N/A"}
                                  </p>
                                )}
                                {option.option_img && (
                                  <div className="mt-2">
                                    <div className="w-full h-32 sm:h-64 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-white">
                                      <img
                                        src={`${BACKEND_MEDIA_URL}${option.option_img || '/placeholder.png'}`}
                                        alt={`Option ${index + 1}`}
                                        className="max-w-full max-h-full object-contain"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Create/Edit Mode - Compact Mobile
                  <form
                    onSubmit={handleSubmit}
                    id="predefinedQuestionForm"
                    className="space-y-2 sm:space-y-6"
                  >
                    <div className="bg-white rounded-lg">
                      <div className="px-3 sm:px-6 border-gray-200 flex items-center justify-between">
                        {/* <h3 className="text-sm sm:text-lg font-medium text-gray-900">
                          Question Details
                        </h3> */}
                        {/* <HelpIcon
                          onClick={() => handleShowHelp("questionTypes")}
                          size="small"
                          className="hidden sm:block"
                        /> */}
                      </div>
                      <div className="p-2 sm:p-6 space-y-2 sm:space-y-4">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <label
                              htmlFor="question_text"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Question Text{" "}
                              {formData.question_type === "image"
                                ? "(Optional)"
                                : "*"}
                            </label>
                            {/* <HelpIcon
                              onClick={() => handleShowHelp("creatingQuestions")}
                              size="small"
                              className="hidden sm:block"
                            /> */}
                          </div>
                          <textarea
                            id="question_text"
                            name="question_text"
                            value={formData.question_text}
                            onChange={handleInputChange}
                            placeholder="Enter your question here..."
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen min-h-[60px] sm:min-h-[100px]"
                            rows={2}
                            required={formData.question_type !== "image"}
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
                          <div>
                            <CustomSelect
                              value={formData.question_type}
                              onChange={(value) =>
                                handleInputChange({
                                  target: { name: "question_type", value },
                                })
                              }
                              options={[
                                {
                                  value: "mcq",
                                  label: "Multiple Choice (MCQ)",
                                },
                                { value: "image", label: "Image Based" },
                                { value: "true_false", label: "True/False" },
                              ]}
                              placeholder="Select question type"
                              showHelp={true}
                              onHelpClick={() => handleShowHelp("questionTypes")}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <label
                                htmlFor="marks"
                                className="block text-sm sm:text-base font-medium text-gray-700 mb-2"
                              >
                                Marks *
                              </label>
                              {/* <HelpIcon
                                onClick={() => handleShowHelp("creatingQuestions")}
                                size="small"
                                className="hidden sm:block"
                              /> */}
                            </div>
                            <input
                              id="marks"
                              name="marks"
                              type="number"
                              value={formData.marks}
                              onChange={handleInputChange}
                              placeholder="Enter marks"
                              className="w-full px-2 py-1.5 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen"
                              min="1"
                              required
                            />
                          </div>
                        </div>
                        {formData.question_type === "image" && (
                          <div>
                            <label
                              htmlFor="questionImage"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Question Image (Optional)
                            </label>
                            <div className="relative group">
                              {questionImagePreview ||
                                (selectedQuestion?.question_img &&
                                  modalMode === "edit") ? (
                                <div className="relative w-full h-32 sm:h-64 border border-gray-300 rounded-lg overflow-hidden hover:border-gray-400 transition-colors flex items-center justify-center bg-white">
                                  <img
                                    src={
                                      questionImagePreview ||
                                      `${BACKEND_MEDIA_URL
                                      }${selectedQuestion?.question_img || "/placeholder.png"}`
                                    }
                                    alt="Question preview"
                                    className="max-w-full max-h-full object-contain"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                      <input
                                        id="questionImage"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleQuestionImageChange}
                                        className="hidden"
                                      />
                                      <label
                                        htmlFor="questionImage"
                                        className="cursor-pointer bg-black bg-opacity-70 text-white p-2 rounded-full shadow-lg hover:bg-opacity-80 transition-all duration-200 flex items-center justify-center"
                                      >
                                        <Camera className="h-5 w-5" />
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full h-20 sm:h-32 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-center hover:border-gray-400 transition-colors">
                                  <input
                                    id="questionImage"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleQuestionImageChange}
                                    className="hidden"
                                  />
                                  <label
                                    htmlFor="questionImage"
                                    className="cursor-pointer"
                                  >
                                    <Upload className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                                    <p className="text-xs text-gray-600">
                                      Click to upload
                                    </p>
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg">
                      <div className="px-3 sm:px-6 py-2 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm sm:text-lg font-medium text-gray-900">
                            Answer Options *
                          </h3>
                          {formData.question_type !== "true_false" && <button
                            type="button"
                            onClick={addOption}
                            disabled={formData.question_type === "true_false"}
                            className="inline-flex items-center p-1.5 text-xs border border-gray-300 rounded-md shadow-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-leafGreen transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3" />
                            <span className="hidden sm:inline ml-1">Add Option</span>
                          </button>}
                        </div>
                      </div>
                      <div className="p-2 sm:p-6">
                        <div className="space-y-2 sm:space-y-4">
                          {formData.options.map((option, index) => (
                            <div
                              key={index}
                              className={`border rounded-lg transition-all p-2 w-full ${Boolean(option.is_correct)
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200 bg-white"
                                }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center space-x-1">
                                    <input
                                      type="radio"
                                      id={`option-${index}`}
                                      name="correctAnswer"
                                      checked={Boolean(option.is_correct)}
                                      onChange={() =>
                                        handleCorrectAnswerChange(index)
                                      }
                                      className="w-3 h-3 accent-leafGreen border-gray-300 focus:ring-green-500"
                                    />
                                    <label
                                      htmlFor={`option-${index}`}
                                      className="flex items-center font-medium text-gray-900 text-xs sm:text-base"
                                    >
                                      {String.fromCharCode(65 + index)}
                                      {Boolean(option.is_correct) && (
                                        <span className="ml-1 text-green-500">✓</span>
                                      )}
                                    </label>
                                  </div>
                                </div>
                                {formData.options.length > 2 &&
                                  formData.question_type !== "true_false" && (
                                    <button
                                      type="button"
                                      onClick={() => removeOption(index)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-0.5 rounded transition-colors duration-200"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                              </div>
                              <input
                                type="text"
                                value={option.option_text}
                                onChange={(e) =>
                                  handleOptionChange(
                                    index,
                                    "option_text",
                                    e.target.value
                                  )
                                }
                                placeholder={`Option ${String.fromCharCode(
                                  65 + index
                                )}...`}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen"
                                required={formData.question_type === "mcq"}
                                disabled={
                                  formData.question_type === "true_false"
                                }
                              />
                              {formData.question_type !== "mcq" &&
                                formData.question_type !== "true_false" && (
                                  <div className="mt-2">
                                    <label className="block text-xs text-gray-600 mb-1">
                                      Option Image (Optional)
                                    </label>
                                    <div className="relative group">
                                      {optionImagePreviews[index] ||
                                        (option.option_img &&
                                          modalMode === "edit") ? (
                                        <div className="relative w-full h-24 sm:h-64 border border-gray-300 rounded-lg overflow-hidden hover:border-gray-400 transition-colors flex items-center justify-center bg-white">
                                          <img
                                            src={
                                              optionImagePreviews[index] ||
                                              `${BACKEND_MEDIA_URL
                                              }${option.option_img || "/placeholder.png"}`
                                            }
                                            alt={`Option ${index + 1} preview`}
                                            className="max-w-full max-h-full object-contain"
                                          />
                                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                              <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                  const file =
                                                    e.target.files[0];
                                                  if (file) {
                                                    setOptionImages((prev) => ({
                                                      ...prev,
                                                      [index]: file,
                                                    }));
                                                    const preview =
                                                      URL.createObjectURL(file);
                                                    setOptionImagePreviews(
                                                      (prev) => ({
                                                        ...prev,
                                                        [index]: preview,
                                                      })
                                                    );
                                                  }
                                                }}
                                                className="hidden"
                                                id={`option-image-${index}`}
                                              />
                                              <label
                                                htmlFor={`option-image-${index}`}
                                                className="cursor-pointer bg-black bg-opacity-70 text-white p-2 rounded-full shadow-lg hover:bg-opacity-80 transition-all duration-200 flex items-center justify-center"
                                              >
                                                <Camera className="h-4 w-4" />
                                              </label>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="w-full h-16 sm:h-32 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-center hover:border-gray-400 transition-colors">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                              const file = e.target.files[0];
                                              if (file) {
                                                setOptionImages((prev) => ({
                                                  ...prev,
                                                  [index]: file,
                                                }));
                                                const preview =
                                                  URL.createObjectURL(file);
                                                setOptionImagePreviews(
                                                  (prev) => ({
                                                    ...prev,
                                                    [index]: preview,
                                                  })
                                                );
                                              }
                                            }}
                                            className="hidden"
                                            id={`option-image-${index}`}
                                          />
                                          <label
                                            htmlFor={`option-image-${index}`}
                                            className="cursor-pointer"
                                          >
                                            <ImageIcon className="h-4 w-4 mx-auto text-gray-400" />
                                            <p className="text-xs text-gray-600 mt-1">
                                              Upload image
                                            </p>
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* Footer - Compact for Mobile */}
              {modalMode === "view" && (
                <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
                  <button
                    onClick={resetForm}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                  >
                    Close
                  </button>
                  <PermissionWrapper section="Predefined Questions" action="edit">
                    <button
                      onClick={() => handleEdit(selectedQuestion)}
                      className="px-6 py-2.5 text-sm flex gap-1 whitespace-nowrap font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                  </PermissionWrapper>
                </div>
              )}
              {modalMode !== "view" && (
                <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="predefinedQuestionForm"
                    disabled={isCreating || isUpdating}
                    className="px-6 py-2.5 text-sm flex gap-1 whitespace-nowrap font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {(isCreating || isUpdating) && (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    )}
                    <Save size={16} />
                    {modalMode === "edit" ? "Update" : "Create"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Delete Confirmation Dialog - Optimized for Mobile */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 z-50 sm:p-4">
            <div className="w-full max-w-xs sm:max-w-md shadow-2xl bg-white rounded-xl sm:rounded-lg mx-2">
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  Delete Question
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
                  Are you sure you want to delete this question? This action
                  cannot be undone and will permanently remove the question from
                  your bank.
                </p>
                <div className="flex justify-end gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowDeleteDialog(false)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-leafGreen transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteQuestion}
                    disabled={deletingQuestionId}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium rounded-md shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {deletingQuestionId ? (
                      <>
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .prose {
          color: #374151;
        }
        .prose h3, .prose h4 {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #111827;
        }
        .prose ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .prose li {
          margin-bottom: 0.25rem;
        }
        .prose strong {
          font-weight: 600;
        }
        .prose p {
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}