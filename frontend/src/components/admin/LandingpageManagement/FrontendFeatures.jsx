import React, { useState, useEffect } from "react";
import AdminLoader from "../AdminLoader";
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Loader2, GripVertical, ArrowLeft, Filter, ChevronUp, ChevronDown, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAdminToken } from "../../../services/CookieService";
import {
    useGetAdminFeaturesQuery,
    useCreateFeatureMutation,
    useUpdateFeatureMutation,
    useDeleteFeatureMutation,
    useToggleFeatureActiveMutation,
    useUpdateFeatureSequenceMutation
} from "../../../services/LangingPage_Management/frontendFeaturesApi";
import toast from "react-hot-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import PermissionWrapper from "../../../context/PermissionWrapper";

const FrontendFeatures = () => {
    const { access_token } = getAdminToken() || {};
    const navigate = useNavigate();
    const [showAllFilters, setShowAllFilters] = useState(false);
    const [filterActive, setFilterActive] = useState(""); // "" | "true" | "false"
    const { data, isLoading, refetch } = useGetAdminFeaturesQuery(
        { access_token, is_active: filterActive },
        { skip: !access_token, refetchOnMountOrArgChange: true }
    );

    const [createFeature, { isLoading: isCreating }] = useCreateFeatureMutation();
    const [updateFeature, { isLoading: isUpdating }] = useUpdateFeatureMutation();
    const [deleteFeature, { isLoading: isDeleting }] = useDeleteFeatureMutation();
    const [toggleActive, { isLoading: isToggling }] = useToggleFeatureActiveMutation();
    const [updateSequence, { isLoading: isUpdatingSequence }] = useUpdateFeatureSequenceMutation();

    const [features, setFeatures] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentFeature, setCurrentFeature] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [featureToDelete, setFeatureToDelete] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        bgColor: "bg-experience1",
        is_active: true,
        featureIcon: null,
    });
    const [imagePreview, setImagePreview] = useState(null);

    const bgColors = [
        { label: "Experience 1", value: "bg-experience1" },
        { label: "Experience 2", value: "bg-experience2" },
        { label: "Experience 3", value: "bg-experience3" },
        { label: "Experience 4", value: "bg-experience4" },
    ];

    useEffect(() => {
        if (data?.data) {
            const sorted = [...data.data].sort((a, b) => a.sequence_no - b.sequence_no);
            setFeatures(sorted);
        }
    }, [data]);

    const openModal = (feature = null) => {
        if (feature) {
            setCurrentFeature(feature);
            setFormData({
                title: feature.title,
                description: feature.description,
                bgColor: feature.bgColor || "bg-experience1",
                is_active: feature.is_active,
                featureIcon: null,
            });
            setImagePreview(feature.icon ? (feature.icon.startsWith("/assets/") ? feature.icon : `${import.meta.env.VITE_BACKEND_MEDIA_URL}${feature.icon}`) : null);
            setEditMode(true);
        } else {
            setCurrentFeature(null);
            setFormData({
                title: "",
                description: "",
                bgColor: "bg-experience1",
                is_active: true,
                featureIcon: null,
            });
            setImagePreview(null);
            setEditMode(false);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentFeature(null);
        setEditMode(false);
        setImagePreview(null);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, featureIcon: file }));
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.description) {
            toast.error("Please fill all required text fields");
            return;
        }

        if (!editMode && !formData.featureIcon) {
            toast.error("Feature icon is required");
            return;
        }

        const dataToSend = new FormData();
        dataToSend.append("title", formData.title);
        dataToSend.append("description", formData.description);
        dataToSend.append("bgColor", formData.bgColor);
        dataToSend.append("is_active", formData.is_active);

        if (formData.featureIcon) {
            dataToSend.append("featureIcon", formData.featureIcon);
        }

        try {
            if (editMode && currentFeature) {
                const res = await updateFeature({
                    id: currentFeature.id,
                    data: dataToSend,
                    access_token,
                }).unwrap();
                if (res.success || res.message) {
                    toast.success("Feature updated successfully.");
                }
            } else {
                const res = await createFeature({
                    data: dataToSend,
                    access_token,
                }).unwrap();
                if (res.success || res.message) {
                    toast.success("Feature created successfully.");
                }
            }
            closeModal();
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || err.message || "Operation failed.");
        }
    };

    const handleDeleteClick = (id) => {
        setFeatureToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!featureToDelete) return;
        try {
            const res = await deleteFeature({ id: featureToDelete, access_token }).unwrap();
            if (res.success || res.message) {
                toast.success("Feature deleted successfully.");
                refetch();
            }
        } catch (err) {
            toast.error(err?.data?.message || err.message || "Delete failed.");
        } finally {
            setIsDeleteModalOpen(false);
            setFeatureToDelete(null);
        }
    };

    const handleToggle = async (id) => {
        try {
            const res = await toggleActive({ id, access_token }).unwrap();
            if (res.success || res.message) {
                toast.success("Feature status changed successfully.");
                refetch();
            }
        } catch (err) {
            toast.error(err?.data?.message || err.message || "Status toggle failed.");
        }
    };

    const onDragEnd = async (result) => {
        if (!result.destination || filterActive !== "") return;

        const sourceIndex = result.source.index;
        const destIndex = result.destination.index;

        if (sourceIndex === destIndex) return;

        const items = Array.from(features);
        const [reorderedItem] = items.splice(sourceIndex, 1);
        items.splice(destIndex, 0, reorderedItem);

        const updatedFeatures = items.map((item, index) => ({
            ...item,
            sequence_no: index + 1
        }));

        setFeatures(updatedFeatures);

        try {
            const sequences = updatedFeatures.map(s => ({ id: s.id, sequence_no: s.sequence_no }));
            const res = await updateSequence({ sequences, access_token }).unwrap();
            if (res.success || res.message) {
                toast.success("Sequence updated successfully.");
            }
        } catch (err) {
            toast.error(err?.data?.message || err.message || "Failed to update sequence.");
            refetch();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
                <div className="w-full px-4 sm:px-6 py-4">
                    <div className="md:hidden flex items-center justify-between mb-3">
                        <div className="flex-1 text-center">
                            <h1 className="text-xl font-bold  text-forestGreen">
                                Why Choose Us Features
                            </h1>
                        </div>
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 border text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    </div>

                    <div className="hidden md:flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold  text-forestGreen">
                                Why Choose Us Features
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Manage the dynamic features displayed in the "Why Choose Us" section
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowAllFilters(!showAllFilters)}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                            >
                                <Filter size={18} />
                                <span className="font-medium">Filters</span>
                                {showAllFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <PermissionWrapper section="Landing Page Features" action="create">
                                <button
                                    onClick={() => openModal()}
                                    className="flex items-center gap-2 px-4 py-2 bg-leafGreen   text-white rounded-lg shadow-sm transition-colors"
                                >
                                    <Plus size={18} />
                                    <span className="font-medium">Add Feature</span>
                                </button>
                            </PermissionWrapper>
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-300 rounded-lg shadow-sm"
                            >
                                <ArrowLeft size={18} />
                                <span className="font-medium">Back</span>
                            </button>
                        </div>
                    </div>

                    <div className="md:hidden flex items-center gap-2 mb-3">
                        <button
                            onClick={() => setShowAllFilters(!showAllFilters)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors font-medium text-sm"
                        >
                            <Filter size={16} />
                            <span>Filters</span>
                            {showAllFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        <PermissionWrapper section="Landing Page Features" action="create">
                            <button
                                onClick={() => openModal()}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-leafGreen   text-white rounded-lg shadow-sm transition-colors font-medium text-sm"
                            >
                                <Plus size={16} />
                                <span>Add Feature</span>
                            </button>
                        </PermissionWrapper>
                    </div>

                    <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${showAllFilters ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
                            }`}
                    >
                        <div className="p-3 bg-lightGreen/20 rounded-lg border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                                        value={filterActive}
                                        onChange={(e) => setFilterActive(e.target.value)}
                                    >
                                        <option value="">All Status</option>
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            {filterActive !== "" && (
                                <div className="mt-3">
                                    <button
                                        onClick={() => setFilterActive("")}
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

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-lightGreen border-b border-gray-200">
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600 w-24">Sequence</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600 w-24">Icon</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">Title</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">BG Color</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600 w-32">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600 text-right w-24">Actions</th>
                                </tr>
                            </thead>
                            {isLoading ? (
                                <tbody>
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center">
                                            <AdminLoader message="Loading Features..." />
                                        </td>
                                    </tr>
                                </tbody>
                            ) : features.length === 0 ? (
                                <tbody>
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-500">
                                            No Features found.
                                        </td>
                                    </tr>
                                </tbody>
                            ) : (
                                <DragDropContext onDragEnd={onDragEnd}>
                                    <Droppable droppableId="features-list" isDropDisabled={filterActive !== ""}>
                                        {(provided) => (
                                            <tbody
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className="bg-white divide-y divide-gray-200"
                                            >
                                                {features.map((feature, index) => (
                                                    <Draggable
                                                        key={feature.id.toString()}
                                                        draggableId={feature.id.toString()}
                                                        index={index}
                                                        isDragDisabled={filterActive !== "" || isUpdatingSequence}
                                                    >
                                                        {(provided, snapshot) => (
                                                            <tr
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className={`border-b border-gray-200 transition-colors ${snapshot.isDragging ? "bg-lightGreen/50 shadow-md" : "hover:bg-lightGreen/20"
                                                                    }`}
                                                                style={{
                                                                    ...provided.draggableProps.style,
                                                                    display: snapshot.isDragging ? 'table' : '',
                                                                }}
                                                            >
                                                                <td className="p-4 align-middle">
                                                                    <div className="flex items-center gap-2">
                                                                        <PermissionWrapper section="Landing Page Features" action="edit">
                                                                            <div
                                                                                {...provided.dragHandleProps}
                                                                                className={`p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 ${filterActive === "" && !isUpdatingSequence ? "cursor-grab" : "cursor-not-allowed opacity-50"}`}
                                                                            >
                                                                                <GripVertical size={18} />
                                                                            </div>
                                                                        </PermissionWrapper>
                                                                        <span className="text-sm font-bold text-gray-700 w-6 text-center">{feature.sequence_no}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 align-middle">
                                                                    {feature.icon && (
                                                                        <div className={`h-10 w-10 ${feature.bgColor || 'bg-experience1'} rounded-md overflow-hidden flex items-center justify-center p-1`}>
                                                                            <img
                                                                                src={feature.icon.startsWith("http") || feature.icon.startsWith("/assets/") ? feature.icon : `${import.meta.env.VITE_BACKEND_MEDIA_URL}${feature.icon}`}
                                                                                alt={feature.title}
                                                                                className="max-h-full max-w-full object-contain"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="p-4 rtl w-1/3">
                                                                    <p className="font-bold text-gray-800 line-clamp-1">{feature.title}</p>
                                                                    <p className="text-gray-500 text-xs line-clamp-1 mt-1">{feature.description}</p>
                                                                </td>
                                                                <td className="p-4 align-middle">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`w-4 h-4 rounded ${feature.bgColor || 'bg-experience1'}`}></div>
                                                                        <span className="text-xs text-gray-600">{feature.bgColor || 'bg-experience1'}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 align-middle">
                                                                    <PermissionWrapper section="Landing Page Features" action="toggle">
                                                                        <label
                                                                            className="relative inline-flex items-center cursor-pointer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            title={Boolean(feature.is_active) ? "Deactivate" : "Activate"}
                                                                        >
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={Boolean(feature.is_active)}
                                                                                onChange={() => handleToggle(feature.id)}
                                                                                className="sr-only peer"
                                                                            />
                                                                            <div className="w-8 h-4 md:w-9 md:h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                                                            <div className="absolute left-0.5 top-0.5 w-3 h-3 md:left-1 md:top-1 md:w-3 md:h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4 md:peer-checked:translate-x-4"></div>
                                                                        </label>
                                                                    </PermissionWrapper>
                                                                </td>
                                                                <td className="p-4 align-middle text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <PermissionWrapper section="Landing Page Features" action="edit">
                                                                            <button
                                                                                onClick={() => openModal(feature)}
                                                                                className="p-1.5 rounded-lg text-forestGreen bg-lightGreen hover:bg-lightGreen transition-colors border border-leafGreen/30/50"
                                                                                title="Edit"
                                                                            >
                                                                                <Edit2 size={16} />
                                                                            </button>
                                                                        </PermissionWrapper>
                                                                        <PermissionWrapper section="Landing Page Features" action="delete">
                                                                            <button
                                                                                onClick={() => handleDeleteClick(feature.id)}
                                                                                disabled={isDeleting}
                                                                                className="p-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-200/50 disabled:opacity-50"
                                                                                title="Delete"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </PermissionWrapper>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </tbody>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            )}
                        </table>
                    </div>
                </div>

                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                    <Trash2 className="h-6 w-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Feature</h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    Are you sure you want to delete this Feature? This action cannot be undone.
                                </p>
                                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                                    <button
                                        onClick={() => {
                                            setIsDeleteModalOpen(false);
                                            setFeatureToDelete(null);
                                        }}
                                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        disabled={isDeleting}
                                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 disabled:opacity-70 flex items-center justify-center gap-2"
                                    >
                                        {isDeleting && <Loader2 size={16} className="animate-spin" />}
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl w-full max-w-xl mx-auto overflow-hidden shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                                    {editMode ? "Edit Feature" : "Add Feature"}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-lightGreen rounded-lg transition-colors flex-shrink-0"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                <form id="featureForm" onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleInputChange}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all"
                                                placeholder="e.g. Industry-Led instruction"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Description <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all resize-none"
                                                placeholder="Feature description..."
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Background Color
                                                </label>
                                                <select
                                                    name="bgColor"
                                                    value={formData.bgColor}
                                                    onChange={handleInputChange}
                                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all"
                                                >
                                                    {bgColors.map((color) => (
                                                        <option key={color.value} value={color.value}>
                                                            {color.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Feature Icon {!editMode && <span className="text-red-500">*</span>}
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all text-sm"
                                                />
                                                {imagePreview && (
                                                    <div className={`mt-2 ${formData.bgColor} p-2 rounded-lg inline-block`}>
                                                        <img src={imagePreview} alt="Preview" className="h-16 w-16 object-contain" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-3 rounded-lg">
                                            <input
                                                type="checkbox"
                                                id="is_active"
                                                name="is_active"
                                                checked={formData.is_active}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 accent-leafGreen text-forestGreen rounded border-gray-300 focus:ring-leafGreen focus:ring-2"
                                            />
                                            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                                                Set as Active
                                            </label>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || isUpdating}
                                    form="featureForm"
                                    className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editMode ? "Update " : "Create "} <span className="hidden sm:inline">Feature</span>
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FrontendFeatures;
