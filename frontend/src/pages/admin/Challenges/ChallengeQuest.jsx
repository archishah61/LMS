import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLoader from "../../../components/admin/AdminLoader";
import toast from "react-hot-toast";
import {
  Award,
  Calendar,
  Edit2,
  Trash2,
  Plus,
  X,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Users,
  AlertTriangle,
  MoreVertical,
  ChevronLeft,
} from 'lucide-react';
import {
  useGetAllQuestsQuery,
  useCreateQuestMutation,
  useUpdateQuestMutation,
  useDeleteQuestMutation,
  useToggleQuestStatusMutation
} from '../../../services/Challenge/challengeQuestAPI';
import {
  useGetAllChallengeCategoriesQuery
} from '../../../services/Masters/challengeCategoryApi';
import { getAdminToken } from '../../../services/CookieService';
import PermissionWrapper from "../../../context/PermissionWrapper";
import { slugify } from '../../../utils/slugify';

// Delete Confirmation Modal Component - Mobile Optimized
function DeleteConfirmationModal({ isOpen, onClose, onConfirm, questName }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm mx-auto shadow-2xl">
        <div className="p-4 sm:p-6">
          {/* Header with Icon */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Trash2 size={18} className="text-red-600 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Delete Quest</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">This action cannot be undone</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-2"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
          <div className="mb-4 sm:mb-6">
            <p className="text-sm sm:text-base text-gray-600 mb-3">Are you sure you want to delete this quest?</p>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-900 text-sm sm:text-base break-words">"{questName}"</p>
            </div>
            <p className="text-xs sm:text-sm text-red-600 mt-3">
              This action cannot be undone and all associated data will be lost.
            </p>
          </div>
          <div className="flex flex-row gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors font-medium text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <Trash2 size={16} className="sm:w-4 sm:h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quest Card Component - Mobile Optimized
function QuestCard({ quest, onEdit, onDelete, onToggleStatus, onManagePhases }) {
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'Beginner':
        return 'bg-leafGreen';
      case 'Intermediate':
        return 'bg-leafGreen';
      case 'Advanced':
        return 'bg-leafGreen';
      default:
        return 'bg-leafGreen';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCardClick = () => {
    onManagePhases?.(quest.id);
  };

  return (
    <motion.div
      whileHover={{
        y: -5,
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      }}
      className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-100 transition-all duration-300 cursor-pointer flex flex-col h-full"
      onClick={handleCardClick}
    >
      {/* Header with Difficulty */}
      <div className={`${getDifficultyColor(quest.difficulty_level)} p-4 relative`}>
        {/* Background Image Overlay */}
        {/* <div className="absolute inset-0 opacity-20">
          <img
            src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${quest.banner_url || "/placeholder.png"}`}
            alt={quest.title}
            className="w-full h-full object-cover"
          />
        </div> */}

        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-1 text-xs font-medium text-white">
              {quest.difficulty_level}
            </div>

            {/* Mobile Menu Button */}
            <div className="sm:hidden relative mobile-menu">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMobileMenu(!showMobileMenu);
                }}
                className="text-white bg-white/20 rounded-full p-1.5 hover:bg-white/30 transition-colors"
              >
                <MoreVertical size={16} />
              </button>

              {showMobileMenu && (
                <div className="absolute top-full mt-2 right-0 min-w-[140px] rounded-xl shadow-lg bg-white border border-gray-100 py-2 z-20">
                  <PermissionWrapper section="Challenge Quest" action="toggle">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMobileMenu(false);
                        onToggleStatus?.(quest.id);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2"
                    >
                      <CheckCircle2 size={14} />
                      {quest.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </PermissionWrapper>
                  <PermissionWrapper section="Challenge Quest" action="edit">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMobileMenu(false);
                        onEdit?.(quest);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                  </PermissionWrapper>
                  <PermissionWrapper section="Challenge Quest" action="delete">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMobileMenu(false);
                        onDelete?.(quest);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center gap-2"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </PermissionWrapper>
                </div>
              )}
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mt-2 line-clamp-2 min-h-[3.5rem]">
            {quest.title}
          </h3>

          <div className="flex items-center space-x-2 mt-2">
            <span className="text-white text-sm">{quest.category_name || 'General'}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1">
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[42px]">
            {quest.description || "No description provided"}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center text-gray-500 text-xs">
              <Award size={14} className="mr-1 flex-shrink-0" />
              <span className="truncate">{quest.reward_points || 0} points</span>
            </div>
            <div className="flex items-center text-gray-500 text-xs">
              <Calendar size={14} className="mr-1 flex-shrink-0" />
              <span className="truncate">{formatDate(quest.startDate)}</span>
            </div>
            <div className="flex items-center text-gray-500 text-xs">
              <Calendar size={14} className="mr-1 flex-shrink-0" />
              <span className="truncate">{formatDate(quest.endDate)}</span>
            </div>
            <div className="flex items-center text-gray-500 text-xs">
              <Clock size={14} className="mr-1 flex-shrink-0" />
              <span className="truncate">{quest.difficulty_level}</span>
            </div>
          </div>

          {/* Rules preview */}
          {quest.rules && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 line-clamp-2">
                <span className="font-medium">Rules:</span> {quest.rules}
              </p>
            </div>
          )}
        </div>

        {/* Status indicator - Hidden on mobile, shown in menu */}
        <div className="hidden sm:flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${quest.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">{quest.is_active ? 'Active' : 'Inactive'}</span>
          </div>
          <PermissionWrapper section="Challenge Quest" action="toggle">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus?.(quest.id);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-leafGreen focus:ring-offset-2 ${quest.is_active ? 'bg-green-600' : 'bg-gray-200'} action-buttons`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${quest.is_active ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </PermissionWrapper>
        </div>

        {/* Action Buttons - Hidden on mobile, shown in menu */}
        <div className="hidden sm:flex space-x-2 action-buttons">
          <PermissionWrapper section="Challenge Quest" action="edit">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(quest);
              }}
              className="flex-1 py-2 px-3 bg-leafGreen hover:bg-leafGreen/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              <Edit2 size={16} className="mr-1" />
              Edit
            </button>
          </PermissionWrapper>
          <PermissionWrapper section="Challenge Quest" action="delete">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(quest);
              }}
              className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              <Trash2 size={16} />
            </button>
          </PermissionWrapper>
        </div>
      </div>
    </motion.div>
  );
}

// Quest Form Component - Mobile Optimized
function QuestForm({
  isOpen,
  onClose,
  onSubmit,
  editQuest,
  categoriesData,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty_level: 'Beginner',
    category_id: '',
    reward_points: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    rules: ''
  });

  useEffect(() => {
    if (editQuest) {
      setFormData({
        id: editQuest.id,
        title: editQuest.title || '',
        description: editQuest.description || '',
        difficulty_level: editQuest.difficulty_level || 'Beginner',
        category_id: editQuest.category_id ? editQuest.category_id.toString() : '',
        reward_points: editQuest.reward_points || 0,
        startDate: editQuest.startDate ? convertUTCToIST(editQuest.startDate).split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: editQuest.endDate ? convertUTCToIST(editQuest.endDate).split('T')[0] : '',
        rules: editQuest.rules || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        difficulty_level: 'Beginner',
        category_id: categoriesData?.[0]?.id.toString() || '',
        reward_points: 100,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        rules: ''
      });
    }
  }, [editQuest, categoriesData, isOpen]);

  function convertUTCToIST(utcDateTimeStr) {
    const utcDate = new Date(utcDateTimeStr);

    // IST offset in milliseconds (UTC +5:30)
    const istOffsetMs = 5.5 * 60 * 60 * 1000;

    const istDate = new Date(utcDate.getTime() + istOffsetMs);

    return istDate.toISOString(); // returns "YYYY-MM-DDTHH:mm:ss.sssZ"
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate dates
    if (formData.startDate && formData.endDate) {
      const currentDate = new Date();
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      // Reset time part to ignore time differences
      currentDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      // Ensure start date is not in the past for new quests
      if (!editQuest && startDate < currentDate) {
        toast.error("Start date cannot be in the past.");
        return;
      }
      // Ensure end date is after start date
      if (endDate < startDate) {
        toast.error("End date must be after the start date.");
        return;
      }
    }
    onSubmit(formData, editQuest?.id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
            {editQuest ? "Edit Quest" : "Add Quest"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} id="challengeQuestForm" className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quest Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                placeholder="Enter quest title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent resize-none text-sm sm:text-base"
                placeholder="Enter quest description"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                >
                  <option value="">Select a category</option>
                  {categoriesData?.filter(cat => cat.is_active).map(category => (
                    <option key={category.id} value={category.id.toString()}>
                      {category.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level *</label>
                <select
                  name="difficulty_level"
                  value={formData.difficulty_level}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reward Points *</label>
                <input
                  type="number"
                  name="reward_points"
                  value={formData.reward_points}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={editQuest ? undefined : new Date().toISOString().split("T")[0]}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={formData.startDate}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rules</label>
              <textarea
                name="rules"
                value={formData.rules}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent resize-none text-sm sm:text-base"
                placeholder="Enter quest rules"
              />
            </div>
          </div>
        </form>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            // onClick={handleSubmit}
            form='challengeQuestForm'
            disabled={isLoading}
            className="px-6 py-2.5 text-sm flex gap-1 whitespace-nowrap font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : (editQuest ? 'Update' : 'Create')}<span className="hidden sm:inline"> Quest</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChallengeQuest() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editQuest, setEditQuest] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, quest: null });
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    difficulty: 'all',
    status: 'all'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const limitOptions = [10, 20, 50, 100, 500];

  // RTK Query hooks
  const { data: questsData, isLoading, refetch } = useGetAllQuestsQuery({ limit: limit, offset: limit !== "all" ? limit * (currentPage - 1) : 0, category: filters.category, difficulty: filters.difficulty, status: filters.status });
  const [createQuest, { isLoading: isCreating }] = useCreateQuestMutation();
  const [updateQuest, { isLoading: isUpdating }] = useUpdateQuestMutation();
  const [deleteQuest, { isLoading: isDeleting }] = useDeleteQuestMutation();
  const [toggleQuestStatus] = useToggleQuestStatusMutation();

  useEffect(() => {
    if (questsData?.data?.length == 0 && currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }, [questsData?.data]);

  // Get access token for category API
  const { access_token } = getAdminToken();
  const tokenString = typeof access_token === 'string' ? access_token : access_token?.access_token || '';

  // Fetch challenge categories
  const { data: categoriesData, isLoading: loadingCategories } = useGetAllChallengeCategoriesQuery({
    access_token: tokenString
  });

  // Filter quests
  const filteredQuests = React.useMemo(() => {
    if (!questsData?.data) return [];
    return questsData.data.filter(quest => {
      const categoryMatch = filters.category === 'all' || quest.category_id == filters.category;
      const difficultyMatch = filters.difficulty === 'all' || quest.difficulty_level === filters.difficulty;
      const statusMatch = filters.status === 'all' ||
        (filters.status === 'active' && quest.is_active) ||
        (filters.status === 'inactive' && !quest.is_active);
      const searchMatch = quest.title.toLowerCase().includes(searchQuery.toLowerCase());
      return categoryMatch && difficultyMatch && statusMatch && searchMatch;
    });
  }, [questsData, filters, searchQuery]);

  const handleEditQuest = (quest) => {
    setEditQuest(quest);
    setIsFormOpen(true);
  };

  const handleDeleteQuest = (quest) => {
    setDeleteConfirmation({ isOpen: true, quest });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.quest) {
      try {
        await deleteQuest(deleteConfirmation.quest.id).unwrap();
        toast.success("Quest deleted successfully!");
        refetch();
        setDeleteConfirmation({ isOpen: false, quest: null });
      } catch (error) {
        toast.error(error?.data?.message || error?.data?.error || "Failed to delete quest");
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleQuestStatus(id).unwrap();
      toast.success("Quest status updated!");
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || error?.data?.error || "Failed to update status");
    }
  };

  const handleAddQuest = () => {
    setEditQuest(null);
    setIsFormOpen(true);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFormSubmit = async (formData, questId) => {
    try {
      const questPayload = {
        title: formData.title,
        description: formData.description,
        difficulty_level: formData.difficulty_level,
        category_id: parseInt(formData.category_id),
        reward_points: parseInt(formData.reward_points),
        startDate: formData.startDate,
        endDate: formData.endDate,
        rules: formData.rules
      };
      if (questId) {
        questPayload.id = questId;
        await updateQuest(questPayload).unwrap();
        toast.success("Quest updated successfully!");
      } else {
        await createQuest(questPayload).unwrap();
        toast.success("Quest created successfully!");
      }
      setIsFormOpen(false);
      setEditQuest(null);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || error?.data?.error || "Something went wrong. Please try again!");
    }
  };

  const handleManagePhases = (id) => {
    const quest = questsData?.data?.find(q => q.id === id);
    if (quest) {
      navigate(`/admin/dashboard/challenges/${slugify(quest.title)}/phase`, {
        state: { id }
      });
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditQuest(null);
  };

  const isAnyFilterApplied = () => {
    return filters.category !== 'all' || filters.difficulty !== 'all' || filters.status !== 'all' || searchQuery !== '';
  };

  const pagination = questsData?.pagination || { totalPages: 1, totalCount: 1 };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-0 sm:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full p-4 sm:px-6">
          {/* Desktop Header */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-forestGreen">
                Challenge Quests
              </h1>
              <p className="text-gray-600 mt-1">
                Manage Challenge Quests
              </p>
            </div>

            <div className="flex items-center gap-3 sm:gap-2 md:gap-3">
              <button
                onClick={() => setShowAllFilters(!showAllFilters)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors sm:px-3"
              >
                <Filter size={18} />
                <span className="font-medium">Filters</span>
                {showAllFilters ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              <PermissionWrapper section="Challenge Quest" action="create">
                <button
                  onClick={handleAddQuest}
                  className="bg-leafGreen text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm sm:px-4"
                >
                  <Plus size={18} />
                  Add Quest
                </button>
              </PermissionWrapper>

              <button
                onClick={() => navigate("/admin/dashboard")}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-300 rounded-lg shadow-sm sm:px-3"
              >
                <ArrowLeft size={18} />
                <span className="font-medium">Back</span>
              </button>
            </div>
          </div>
          <div className="sm:hidden">
            {/* Title Row - Centered with back button on right */}
            <div className="flex items-center justify-between mb-3">
              <div className="w-8"></div> {/* Spacer for balance */}
              <div className="flex-1 text-center">
                <h1 className="text-xl font-bold text-forestGreen">
                  Challenge Quests
                </h1>
                <p className="text-gray-600 text-sm mt-0.5 truncate">
                  Manage Challenge Quests
                </p>
              </div>
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="flex border items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-lg"
              >
                <ArrowLeft size={18} />
              </button>
            </div>

            {/* Action Buttons Row - Smaller size */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAllFilters(!showAllFilters)}
                className="flex items-center gap-1 px-2 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors flex-1 justify-center text-sm"
              >
                <Filter size={16} />
                <span className="font-medium">Filters</span>
              </button>

              <PermissionWrapper section="Challenge Quest" action="create">
                <button
                  onClick={handleAddQuest}
                  className="bg-leafGreen text-white px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-medium shadow-sm flex-1 justify-center text-sm"
                >
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </PermissionWrapper>
            </div>
          </div>

          {/* Filters Section */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${showAllFilters ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
              }`}
          >
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="search"
                      placeholder="Search quests..."
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg 
                  placeholder-gray-400 focus:outline-none focus:ring-2 
                  focus:ring-leafGreen focus:border-transparent transition duration-150 ease-in-out"
                      onChange={(e) => setSearchQuery(e.target.value)}
                      value={searchQuery}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    {categoriesData?.filter(cat => cat.is_active).map(category => (
                      <option key={category.id} value={category.id.toString()}>
                        {category.category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>
              {isAnyFilterApplied() && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setFilters({ category: 'all', difficulty: 'all', status: 'all' });
                      setSearchQuery('');
                    }}
                    className="text-sm text-leafGreen hover:text-leafGreen/80 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6">
        {isLoading ? (
          <AdminLoader fullScreen={false} message="Loading quests..." />
        ) : filteredQuests.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onEdit={handleEditQuest}
                onDelete={handleDeleteQuest}
                onToggleStatus={handleToggleStatus}
                onManagePhases={handleManagePhases}
              />
            ))}
          </div>
        ) : (isAnyFilterApplied() ?
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-100 mb-4">
              <Award size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Quests Found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters to see more results.
            </p>
            <button
              onClick={() => {
                setFilters({ category: 'all', difficulty: 'all', status: 'all' });
                setSearchQuery('');
              }}
              className="bg-leafGreen hover:bg-leafGreen/90 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm mx-auto"
            >
              Clear Filter
            </button>
          </div>
          :
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-100 mb-4">
              <Award size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Quests Found</h3>
            <p className="text-gray-600 mb-6">
              {questsData?.data?.length > 0
                ? "Try adjusting your filters to see more results."
                : "Get started by creating your first quest."}
            </p>
            <PermissionWrapper section="Challenge Quest" action="create">
              <button
                onClick={handleAddQuest}
                className="bg-leafGreen hover:bg-leafGreen/90 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm mx-auto"
              >
                <Plus size={18} />
                Create Quest
              </button>
            </PermissionWrapper>
          </div>
        )}

        {/* Pagination */}
        {pagination?.totalCount > 10 && (
          <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50">
            {/* Mobile Pagination */}
            <div className="md:hidden">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 text-center">
                    Page {currentPage} of {pagination.totalPages}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Quests per page:</label>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setCurrentPage(1); // Reset to first page when limit changes
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    >
                      {limitOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <div className="text-xs text-gray-500 text-center">
                    Showing {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, pagination.totalCount)} of {pagination.totalCount}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    Next
                    <ChevronUp size={16} className="rotate-90" />
                  </button>
                </div>
              </div>
            </div>
            {/* Desktop Pagination */}
            <div className="hidden md:flex md:items-center md:justify-between">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * limit + 1} to{" "}
                {Math.min(currentPage * limit, pagination.totalCount)} of{" "}
                {pagination.totalCount} results
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Quests per page:</label>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setCurrentPage(1); // Reset to first page when limit changes
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    {limitOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Previous
                </button>
                {[...Array(pagination.totalPages)].map((_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${currentPage === page
                        ? "bg-leafGreen text-white"
                        : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <QuestForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        editQuest={editQuest}
        categoriesData={categoriesData}
        isLoading={isCreating || isUpdating}
      />

      <DeleteConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, quest: null })}
        onConfirm={confirmDelete}
        questName={deleteConfirmation.quest?.title || ""}
      />
    </div>
  );
}