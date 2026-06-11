"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  X,
  List,
  Eye,
  Loader2,
  GripVertical,
  Filter,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  Menu,
} from "lucide-react";
import {
  useCreateModuleMutation,
  useGetModulesBySessionIdQuery,
  useUpdateModuleMutation,
  useUpdateModuleStatusMutation,
} from "../../../services/Course_Management/moduleApi";
import { setModuleInfo } from "../../../features/Course_Management/moduleSlice";
import { getAdminToken } from "../../../services/CookieService";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
import { useUpdateModuleSequenceMutation } from "../../../services/Course_Management/moduleApi";
import PermissionWrapper from "../../../context/PermissionWrapper";
import AIContentGenerator from "../../Home/courses/AIContentGenrator";
import { slugify } from "../../../utils/slugify";
import ImportContentPopup from "../importContent/importContentPopUp";
import AdminLoader from "../AdminLoader";

const SortableModuleRow = ({
  module,
  index,
  handleStatusToggle,
  navigate,
  courseId,
  sessionId,
  courseIdSlug,
  sessionIdSlug,
  handleEditModule,
  handleModuleClick,
  handleViewModule,
  isMobile = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: isDragging ? "white" : "inherit",
    boxShadow: isDragging ? "0 4px 12px rgba(0, 0, 0, 0.1)" : "none",
    border: isDragging ? "2px solid rgba(22, 101, 52, 0.5)" : "none",
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  const handleCardClick = () => {
    handleModuleClick(module);
  };

  // Enhanced touch handlers
  const handleTouchStart = (e) => {
    e.preventDefault();
    listeners.onTouchStart(e);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    // Let dnd-kit handle the movement
  };

  const handleDragHandleClick = (e) => {
    e.stopPropagation();
  };

  const handleActionClick = (e, action) => {
    e.stopPropagation();
    if (action === 'edit') {
      handleEditModule(module);
    } else if (action === 'view') {
      handleViewModule(module);
    }
  };

  const handleStatusChange = (e) => {
    e.stopPropagation();
    handleStatusToggle(module.id, module.status || "active");
  };

  // Mobile Card View
  if (isMobile) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`p-4 bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-300 cursor-pointer ${isDragging ? "bg-white shadow-lg border-2 border-forestGreen/50" : "hover:shadow-md hover:bg-gray-50"
          }`}
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 mr-2">
            <h3 className="text-base font-semibold text-forestGreen">
              {module.title.charAt(0).toUpperCase() + module.title.slice(1)}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Duration: {Math.floor(module.duration_minutes / 60)}h {module.duration_minutes % 60}m
            </p>
          </div>
          <div
            {...attributes}
            {...listeners}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={listeners.onTouchEnd}
            onClick={handleDragHandleClick}
            style={{ touchAction: 'none' }}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 cursor-grab flex-shrink-0 ${isDragging ? "bg-lightGreen/30 ring-2 ring-forestGreen/50 cursor-grabbing" : "hover:bg-lightGreen/20"
              }`}
          >
            <GripVertical
              className={`w-4 h-4 transition-colors duration-200 ${isDragging ? "text-forestGreen" : "text-gray-400 hover:text-forestGreen"
                }`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4" onClick={(e) => e.stopPropagation()}>
          <PermissionWrapper section="Module" action="toggle">
            <div className="relative flex-1 mr-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${module.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                  {module.status === "active" ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={handleStatusChange}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${module.status !== "inactive" ? 'bg-green-500' : 'bg-gray-300'
                    } disabled:opacity-50`}
                >
                  <span
                    className={`absolute top-1/2 left-1 w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 -translate-y-1/2 ${module.status !== "inactive" ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>
            </div>
          </PermissionWrapper>

          <div className="flex items-center gap-2 flex-shrink-0">
            <PermissionWrapper section="Module" action="edit">
              <button
                onClick={(e) => handleActionClick(e, 'edit')}
                className="text-orange-600 hover:text-orange-700 transition-colors duration-300 p-1.5"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </PermissionWrapper>

            <PermissionWrapper section="Module" action="view">
              <button
                onClick={(e) => handleActionClick(e, 'view')}
                className="text-leafGreen hover:text-forestGreen transition-colors duration-300 p-1.5"
              >
                <Eye className="w-4 h-4" />
              </button>
            </PermissionWrapper>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Table Row
  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer hidden md:table-row ${isDragging
        ? "bg-white shadow-lg border-2 border-forestGreen/50"
        : "hover:bg-lightGreen/20"
        } transition-colors duration-300`}
      onClick={handleCardClick}
    >
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500" onClick={(e) => e.stopPropagation()}>
        <div
          {...attributes}
          {...listeners}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={listeners.onTouchEnd}
          style={{ touchAction: 'none' }}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 cursor-grab ${isDragging ? "bg-lightGreen ring-2 ring-forestGreen/50 cursor-grabbing" : "hover:bg-lightGreen/50"
            }`}
        >
          <GripVertical
            className={`w-5 h-5 transition-colors duration-200 ${isDragging ? "text-forestGreen" : "text-gray-400 hover:text-forestGreen"
              }`}
          />
        </div>
      </td>
      <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-forestGreen block truncate">
          {module.title.charAt(0).toUpperCase() + module.title.slice(1)}
        </span>
      </td>
      <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Clock size={16} className="text-gray-400" />
          <span>
            {Math.floor(module.duration_minutes / 60)} hr{" "}
            {module.duration_minutes % 60} mins
          </span>
        </div>
      </td>
      <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-3">
          <PermissionWrapper section="Module" action="edit">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditModule(module);
              }}
              className="text-orange-600 hover:text-orange-700 transition-colors duration-300"
              title="Edit Module"
            >
              <Edit2 size={18} />
            </button>
          </PermissionWrapper>

          <PermissionWrapper section="Module" action="toggle">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusToggle(module.id, module.status || "active");
              }}
              className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${module.status !== "inactive" ? "bg-green-500" : "bg-gray-300"
                } disabled:opacity-50`}
              title={module.status === "inactive" ? "Activate" : "Deactivate"}
            >
              <span
                className={`absolute top-1/2 left-[3px] w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-300 -translate-y-1/2 ${module.status !== "inactive"
                  ? "translate-x-[20px]"
                  : "translate-x-0"
                  }`}
              />
            </button>
          </PermissionWrapper>
          <PermissionWrapper section="Module" action="view">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewModule(module);
              }}
              className="text-forestGreen hover:text-leafGreen transition-colors duration-300"
              title="View Module"
            >
              <Eye size={18} />
            </button>
          </PermissionWrapper>
        </div>
      </td>
    </tr>
  );
}

export default function Module() {
  const { cid, courseId, sid, sessionId, sessionDuration } = useLocation().state;
  const { courseIdSlug, sessionIdSlug } = useParams();
  const { role } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { access_token } = getAdminToken();
  const { id } = useSelector((state) => state.user);
  const { sessions } = useSelector((state) => state.session);
  const [sessionTitle, setSessionTitle] = useState("");
  const [modules, setModules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [viewModule, setViewModule] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    title: "",
    duration_minutes: "",
    status: "active",
    created_by: Number.parseInt(id),
    updated_by: Number.parseInt(id),
    session_id: sessionId,
    course_id: courseId,
    created_by_type: role,
    updated_by_type: role,
  });
  const [isMobile, setIsMobile] = useState(false);
  const [showImportPopup, setShowImportPopup] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: moduleData, isSuccess: isSuccessGetModules, isLoading, refetch: refetchModules } =
    useGetModulesBySessionIdQuery({
      id: sessionId,
      searchTerm,
      dateFrom,
      dateTo,
      statusFilter,
      access_token,
    });
  const [createModule, { isLoading: isLoadingCreateModule }] =
    useCreateModuleMutation();
  const [updateModuleSequence] = useUpdateModuleSequenceMutation();
  const [updateModuleStatus] = useUpdateModuleStatusMutation();
  const [updateModule] = useUpdateModuleMutation();

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (moduleData && isSuccessGetModules) {
      const sortedModules = [...moduleData.modules].sort(
        (a, b) => a.sequence_no - b.sequence_no
      );
      setModules(sortedModules);
      dispatch(setModuleInfo({ modules: sortedModules }));
    }
  }, [moduleData, isSuccessGetModules, dispatch]);

  useEffect(() => {
    fetchSessionTitle();
  }, []);

  const fetchSessionTitle = async () => {
    const foundSession = sessions.find(
      (session) => session.public_hash === sessionId
    );
    const title = foundSession?.title;
    setSessionTitle(title);
  };

  const handleViewModule = (module) => {
    setViewModule(module);
    setShowViewModal(true);
  };

  const handleAddModule = () => {
    setEditingModule(null);
    setFormData({
      title: "",
      duration_minutes: "",
      status: "active",
      created_by: Number.parseInt(id),
      updated_by: Number.parseInt(id),
      session_id: sessionId,
      course_id: courseId,
      created_by_type: role,
      updated_by_type: role,
    });
    setShowForm(true);
    setShowDropdown(false);
  };

  const handleEditModule = (module) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      duration_minutes: module.duration_minutes.toString(),
      status: module.status || "active",
      created_by: Number.parseInt(id),
      updated_by: Number.parseInt(id),
      session_id: sessionId,
      course_id: courseId,
      created_by_type: role,
      updated_by_type: role,
    });
    setShowForm(true);
  };

  const handleEditFromView = () => {
    setShowViewModal(false);
    handleEditModule(viewModule);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingModule) {
        await updateModule({
          id: editingModule.public_hash,
          formData: formData,
          access_token: access_token,
        }).unwrap();
        toast.success("Module updated successfully!");
      } else {
        await createModule({
          module: formData,
          access_token,
        }).unwrap();
        toast.success("Module added successfully");
      }
      resetForm();
      setShowForm(false);
    } catch (error) {
      if (Array.isArray(error?.data?.error)) {
        error.data.error.forEach((errMsg) => {
          toast.error(errMsg);
        });
      } else {
        toast.error(
          error.data?.error ||
          `Failed to ${editingModule ? "update" : "create"
          } module. Please try again.`
        );
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      duration_minutes: "",
      status: "active",
      created_by: Number.parseInt(id),
      updated_by: Number.parseInt(id),
      session_id: sessionId,
      course_id: courseId,
      created_by_type: role,
      updated_by_type: role,
    });
  };

  const isAnyFilterApplied = () => {
    return dateFrom !== "" || dateTo !== "" || statusFilter !== "all" || searchTerm !== "";
  };

  const filteredModules = modules
  // .filter((module) => {
  //   const moduleDate = new Date(module.created_at);
  //   const fromDate = dateFrom ? new Date(dateFrom) : null;
  //   const toDate = dateTo ? new Date(dateTo) : null;
  //   const isWithinDateRange =
  //     (!fromDate || moduleDate >= fromDate) &&
  //     (!toDate || moduleDate <= new Date(toDate.setHours(23, 59, 59, 999)));
  //   const matchesSearch = module.title
  //     .toLowerCase()
  //     .includes(searchTerm.toLowerCase());
  //   const matchesStatus =
  //     statusFilter === "all" || module.status === statusFilter;
  //   return isWithinDateRange && matchesSearch && matchesStatus;
  // });

  const totalPages = Math.ceil(filteredModules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedModules = filteredModules.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      setModules((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        updateSequenceOnServer(newItems);
        return newItems;
      });
    }
    setActiveId(null);
  };

  const updateSequenceOnServer = async (reorderedModules) => {
    try {
      const updatedSequence = reorderedModules.map((module) => module.id);
      await updateModuleSequence({
        sequence: updatedSequence,
        access_token,
      }).unwrap();
    } catch (error) {
      toast.error(error?.data?.error || "Failed to update module sequence");
    }
  };

  const handleStatusToggle = async (moduleId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await updateModuleStatus({
        moduleId,
        status: newStatus,
        access_token,
      }).unwrap();
      setModules(
        modules.map((module) =>
          module.id === moduleId ? { ...module, status: newStatus } : module
        )
      );
      toast.success(
        `Module ${newStatus === "active" ? "activated" : "deactivated"
        } successfully`
      );
    } catch (error) {
      toast.error(error?.data?.error || "Failed to update module status");
    }
  };

  const handleUseGeneratedModule = (module) => {
    setEditingModule(null);
    setFormData({
      title: module.title,
      duration_minutes: module.duration_minutes.toString(),
      status: module.status || "active",
      created_by: Number.parseInt(id),
      updated_by: Number.parseInt(id),
      session_id: sessionId,
      course_id: courseId,
      created_by_type: role,
      updated_by_type: role,
    });
    setShowForm(true);
    toast.success("Module data populated!");
  };

  const handleModuleClick = (module) => {
    navigate(
      `/admin/dashboard/course/${courseIdSlug}/session/${sessionIdSlug}/module/${slugify(
        module.title
      )}/topics`,
      {
        state: {
          courseId: cid,
          sessionId: sid,
          mId: module.id,
          moduleId: module.public_hash,
        },
      }
    );
  };

  // if (!moduleData && isSuccessGetModules === undefined) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forestGreen mx-auto mb-4"></div>
  //         <p className="text-gray-600">Loading modules...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="w-full max-w-full px-4 py-4 sm:px-6">
          {/* ──────────────────────────────
              MOBILE LAYOUT (< md)
              ────────────────────────────── */}
          <div className="lg:hidden space-y-4">
            <div className="relative flex items-center justify-between">
              <div></div>

              {/* Center: Title + Subtitle */}
              <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none max-w-[60%] sm:max-w-[70%]">
                <h1 className="text-xl font-bold text-forestGreen">
                  Modules
                </h1>
                <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">
                  {sessionTitle}
                </p>
              </div>

              {/* Dropdown for < md */}
              <div className="lg:hidden relative flex items-center justify-between">
                <PermissionWrapper section="Module" action="create">
                  <AIContentGenerator
                    contentType="module"
                    onUseGenerated={handleUseGeneratedModule}
                    details={{ sessionDuration }}
                    mobile
                  />
                </PermissionWrapper>

                <PermissionWrapper section="Module" action="create">
                  <button
                    onClick={() => setShowDropdown((prev) => !prev)}
                    className="bg-leafGreen   ml-3 text-white p-2.5 rounded-lg flex items-center transition-colors font-medium shadow-sm min-w-[30px]"
                  >
                    <Plus size={18} />
                  </button>
                </PermissionWrapper>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-1 translate-y-1 z-10 w-48 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg">
                    <PermissionWrapper section="Module" action="create">
                      <button
                        onClick={handleAddModule}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                      >
                        <Plus size={18} />
                        Add Module
                      </button>
                    </PermissionWrapper>

                    <PermissionWrapper section="Import Content" action="create">
                      <button
                        onClick={() => setShowImportPopup(true)}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                      >
                        <Plus size={18} />
                        Import Module
                      </button>
                    </PermissionWrapper>
                  </div>
                )}

                {/* Back Arrow */}
                <button
                  onClick={() => navigate(-1)}
                  className="flex border rounded-md ml-3 items-center gap-2 text-gray-600 hover:text-gray-900 p-1"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>
            </div>

            {/* Filter toggle – centered, full-width capped */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors w-full max-w-md shadow-sm"
              >
                <Filter size={17} />
                <span className="font-medium text-sm">Filters</span>
                {showFilters ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex md:items-center md:justify-between">
            <div className="grid">
              <h1 className="text-2xl font-bold text-forestGreen">Modules</h1>
              <p className="text-gray-600 mt-1 truncate">
                Session: {sessionTitle}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
              >
                <Filter size={18} />
                <span className="font-medium">Filters</span>
                {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              <PermissionWrapper section="Module" action="create">
                <AIContentGenerator
                  contentType="module"
                  onUseGenerated={handleUseGeneratedModule}
                  details={{ sessionDuration }}
                />
              </PermissionWrapper>

              <PermissionWrapper section="Module" action="create">
                <button
                  onClick={handleAddModule}
                  className="bg-leafGreen text-white px-4 xl:px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm whitespace-nowrap"
                >
                  <Plus size={18} />
                  Add Module
                </button>
              </PermissionWrapper>

              <PermissionWrapper section="Import Content" action="create">
                <button
                  onClick={() => setShowImportPopup(true)}
                  className="bg-leafGreen text-white px-4 xl:px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm whitespace-nowrap"
                >
                  <Plus size={18} />
                  Import Module
                </button>
              </PermissionWrapper>

              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors shadow-sm"
              >
                <ArrowLeft size={18} />
                <span className="font-medium">Back</span>
              </button>
            </div>
          </div>

          {/* ──────────────────────────────
              FILTERS PANEL (shared)
              ────────────────────────────── */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilters ? "max-h-[500px] opacity-100 mt-5" : "max-h-0 opacity-0 mt-0"
              }`}
          >
            <div className="p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Modules</label>
                  <div className="relative">
                    <Search className="absolute top-3 left-3 text-gray-400" size={16} />
                    <input
                      type="search"
                      placeholder="Search modules..."
                      className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      onChange={(e) => setSearchTerm(e.target.value)}
                      value={searchTerm}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {isAnyFilterApplied() && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                      setStatusFilter("all");
                      setSearchTerm("");
                    }}
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

      {/* Main Content */}
      <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Form Section */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl mx-auto shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingModule ? "Edit Module" : "New Module"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingModule(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3">
                <form onSubmit={handleSubmit} id="moduleForm" className="space-y-4 sm:space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Module Title
                    </label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter module title"
                    />
                  </div>

                  <div>
                    <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      id="duration_minutes"
                      name="duration_minutes"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={handleChange}
                      required
                      min="1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter duration in minutes"
                    />
                  </div>
                </form>
              </div>

              <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingModule(null);
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoadingCreateModule}
                  form="moduleForm"
                  className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen   rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingCreateModule ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {editingModule ? "Updating..." : "Creating..."}
                    </div>
                  ) : editingModule ? (
                    "Update Module"
                  ) : (
                    "Create Module"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modules List */}
        {isLoading ?
          <AdminLoader message="Loading modules..." />
          :
          <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-lightGreen">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                      Order
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <tbody className="bg-white divide-y divide-gray-100">
                    <SortableContext
                      items={paginatedModules.map((module) => module.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {paginatedModules.map((module, index) => (
                        <SortableModuleRow
                          key={module.id}
                          module={module}
                          index={index}
                          handleStatusToggle={handleStatusToggle}
                          navigate={navigate}
                          courseId={courseId}
                          sessionId={sessionId}
                          courseIdSlug={courseIdSlug}
                          sessionIdSlug={sessionIdSlug}
                          handleEditModule={handleEditModule}
                          handleModuleClick={handleModuleClick}
                          handleViewModule={handleViewModule}
                          isMobile={false}
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                </DndContext>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
              <div className="sm:p-2">

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={paginatedModules.map((module) => module.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {paginatedModules.map((module, index) => (
                      <SortableModuleRow
                        key={module.id}
                        module={module}
                        index={index}
                        handleStatusToggle={handleStatusToggle}
                        navigate={navigate}
                        courseId={courseId}
                        sessionId={sessionId}
                        courseIdSlug={courseIdSlug}
                        sessionIdSlug={sessionIdSlug}
                        handleEditModule={handleEditModule}
                        handleModuleClick={handleModuleClick}
                        handleViewModule={handleViewModule}
                        isMobile={true}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            {/* Empty State */}
            {filteredModules.length === 0 && (
              <div className="px-6 py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <List size={24} className="text-gray-400" />
                </div>
                <div className="text-gray-500 text-lg font-medium mb-2">
                  No modules found
                </div>
                <p className="text-gray-400">
                  Try adjusting your filters or add a new module.
                </p>
              </div>
            )}

            {/* Pagination */}
            {filteredModules.length > 0 && totalPages > 1 && (
              <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="hidden md:block text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredModules.length)} of {filteredModules.length} results
                  </div>
                  <div className="md:hidden text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      // Only show first, last, and pages near current
                      if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
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
                      } else if (page === 2 || page === totalPages - 1) {
                        return <span key={page} className="px-2 text-gray-400">...</span>;
                      }
                      return null;
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        }
      </div>

      {/* View Modal */}
      {showViewModal && viewModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl mx-auto shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">
                Module Details
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2 gap-6"}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module Title
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-gray-900 font-medium">
                      {viewModule.title}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-500" />
                      <span className="text-gray-900">
                        {Math.floor(viewModule.duration_minutes / 60)} hr{" "}
                        {viewModule.duration_minutes % 60} mins
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2 gap-6"}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${viewModule.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {viewModule.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sequence
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-gray-900">#{viewModule.sequence_no}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Created Date
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-gray-900">
                    {new Date(viewModule.created_at).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              >
                Close
              </button>
              <PermissionWrapper section="Module" action="edit">
                <button
                  type="button"
                  onClick={handleEditFromView}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen   rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Edit Module
                </button>
              </PermissionWrapper>
            </div>
          </div>
        </div>
      )}

      <ImportContentPopup
        open={showImportPopup}
        onClose={() => {
          setShowImportPopup(false);
          setShowDropdown(false);
        }}
        from="module"
        Id={sid}
        refetchModules={refetchModules}
      />
    </div>
  );
}