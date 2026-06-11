import React, { useState, useEffect } from "react";
import AdminLoader from "../AdminLoader";
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Loader2, GripVertical, ArrowLeft, Filter, ChevronUp, ChevronDown, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAdminToken } from "../../../services/CookieService";
import {
    useGetAdminFaqsQuery,
    useCreateFaqMutation,
    useUpdateFaqMutation,
    useDeleteFaqMutation,
    useToggleFaqActiveMutation,
    useUpdateFaqSequenceMutation
} from "../../../services/LangingPage_Management/frontendFaqApi";
import toast from "react-hot-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import PermissionWrapper from "../../../context/PermissionWrapper";

const FrontendFaq = () => {
    const { access_token } = getAdminToken() || {};
    const navigate = useNavigate();
    const [showAllFilters, setShowAllFilters] = useState(false);
    const [filterActive, setFilterActive] = useState(""); // "" | "true" | "false"
    const { data, isLoading, refetch } = useGetAdminFaqsQuery(
        { access_token, is_active: filterActive },
        { skip: !access_token, refetchOnMountOrArgChange: true }
    );

    const [createFaq, { isLoading: isCreating }] = useCreateFaqMutation();
    const [updateFaq, { isLoading: isUpdating }] = useUpdateFaqMutation();
    const [deleteFaq, { isLoading: isDeleting }] = useDeleteFaqMutation();
    const [toggleActive, { isLoading: isToggling }] = useToggleFaqActiveMutation();
    const [updateSequence, { isLoading: isUpdatingSequence }] = useUpdateFaqSequenceMutation();

    const [faqs, setFaqs] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentFaq, setCurrentFaq] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [faqToDelete, setFaqToDelete] = useState(null);

    const [formData, setFormData] = useState({
        question: "",
        answer: "",
        is_active: true,
    });

    useEffect(() => {
        if (data?.data) {
            // Ensure they are sorted by sequence_no
            const sorted = [...data.data].sort((a, b) => a.sequence_no - b.sequence_no);
            setFaqs(sorted);
        }
    }, [data]);

    const openModal = (faq = null) => {
        if (faq) {
            setCurrentFaq(faq);
            setFormData({
                question: faq.question,
                answer: faq.answer,
                is_active: faq.is_active,
            });
            setEditMode(true);
        } else {
            setCurrentFaq(null);
            setFormData({
                question: "",
                answer: "",
                is_active: true
            });
            setEditMode(false);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentFaq(null);
        setEditMode(false);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.question || !formData.answer) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            if (editMode && currentFaq) {
                const res = await updateFaq({
                    id: currentFaq.id,
                    data: formData,
                    access_token,
                }).unwrap();
                if (res.success) {
                    toast.success("FAQ updated successfully.");
                }
            } else {
                const res = await createFaq({
                    data: formData,
                    access_token,
                }).unwrap();
                if (res.success) {
                    toast.success("FAQ created successfully.");
                }
            }
            closeModal();
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || err.message || "Operation failed.");
        }
    };

    const handleDeleteClick = (id) => {
        setFaqToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!faqToDelete) return;
        try {
            const res = await deleteFaq({ id: faqToDelete, access_token }).unwrap();
            if (res.success) {
                toast.success("FAQ deleted successfully.");
                refetch();
            }
        } catch (err) {
            toast.error(err?.data?.message || err.message || "Delete failed.");
        } finally {
            setIsDeleteModalOpen(false);
            setFaqToDelete(null);
        }
    };

    const handleToggle = async (id) => {
        try {
            const res = await toggleActive({ id, access_token }).unwrap();
            if (res.success) {
                toast.success("FAQ status changed successfully.");
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

        const items = Array.from(faqs);
        const [reorderedItem] = items.splice(sourceIndex, 1);
        items.splice(destIndex, 0, reorderedItem);

        // Update sequence numbers locally
        const updatedFaqs = items.map((item, index) => ({
            ...item,
            sequence_no: index + 1
        }));

        setFaqs(updatedFaqs); // Optimistic UI update

        try {
            const sequences = updatedFaqs.map(f => ({ id: f.id, sequence_no: f.sequence_no }));
            const res = await updateSequence({ sequences, access_token }).unwrap();
            if (res.success || res.message) {
                toast.success("Sequence updated successfully.");
            }
        } catch (err) {
            toast.error(err?.data?.message || err.message || "Failed to update sequence.");
            refetch(); // Revert to server state on error
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
                <div className="w-full px-4 sm:px-6 py-4">
                    {/* Mobile Header */}
                    <div className="md:hidden flex items-center justify-between mb-3">
                        <div className="flex-1 text-center">
                            <h1 className="text-xl font-bold  text-forestGreen">
                                Landing Page FAQs
                            </h1>
                        </div>
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 border text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    </div>

                    {/* Desktop Header */}
                    <div className="hidden md:flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold  text-forestGreen">
                                Landing Page FAQs
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Manage the frequently asked questions displayed on the landing page
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
                            <PermissionWrapper section="Landing Page FAQ" action="create">
                                <button
                                    onClick={() => openModal()}
                                    className="flex items-center gap-2 px-4 py-2 bg-leafGreen   text-white rounded-lg shadow-sm transition-colors"
                                >
                                    <Plus size={18} />
                                    <span className="font-medium">Add FAQ</span>
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

                    {/* Mobile Action Buttons */}
                    <div className="md:hidden flex items-center gap-2 mb-3">
                        <button
                            onClick={() => setShowAllFilters(!showAllFilters)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors font-medium text-sm"
                        >
                            <Filter size={16} />
                            <span>Filters</span>
                            {showAllFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        <PermissionWrapper section="Landing Page FAQ" action="create">
                            <button
                                onClick={() => openModal()}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-leafGreen   text-white rounded-lg shadow-sm transition-colors font-medium text-sm"
                            >
                                <Plus size={16} />
                                <span>Add FAQ</span>
                            </button>
                        </PermissionWrapper>
                    </div>

                    {/* Filters */}
                    <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${showAllFilters ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
                            }`}
                    >
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
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
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-700 w-24">Sequence</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-700">Question</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-700">Answer</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-700 w-32">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-700 text-right w-24">Actions</th>
                                </tr>
                            </thead>
                            {isLoading ? (
                                <tbody>
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center">
                                            <AdminLoader message="Loading FAQs..." />
                                        </td>
                                    </tr>
                                </tbody>
                            ) : faqs.length === 0 ? (
                                <tbody>
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-500">
                                            No FAQs found.
                                        </td>
                                    </tr>
                                </tbody>
                            ) : (
                                <DragDropContext onDragEnd={onDragEnd}>
                                    <Droppable droppableId="faqs-list" isDropDisabled={filterActive !== ""}>
                                        {(provided) => (
                                            <tbody
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className="bg-white divide-y divide-gray-200"
                                            >
                                                {faqs.map((faq, index) => (
                                                    <Draggable
                                                        key={faq.id.toString()}
                                                        draggableId={faq.id.toString()}
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
                                                                        <PermissionWrapper section="Landing Page FAQ" action="edit">
                                                                            <div
                                                                                {...provided.dragHandleProps}
                                                                                className={`p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 ${filterActive === "" && !isUpdatingSequence ? "cursor-grab" : "cursor-not-allowed opacity-50"}`}
                                                                                title={filterActive !== "" ? "Clear filter to reorder" : "Drag to reorder"}
                                                                            >
                                                                                <GripVertical size={18} />
                                                                            </div>
                                                                        </PermissionWrapper>
                                                                        <span className="text-sm font-bold text-gray-700 w-6 text-center">{faq.sequence_no}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 rtl w-1/4">
                                                                    <p className="font-medium text-gray-800 line-clamp-2">{faq.question}</p>
                                                                </td>
                                                                <td className="p-4 rtl w-1/3">
                                                                    <p className="text-gray-600 text-sm line-clamp-3">{faq.answer}</p>
                                                                </td>
                                                                <td className="p-4 align-middle">
                                                                    <PermissionWrapper section="Landing Page FAQ" action="toggle">
                                                                        <label
                                                                            className="relative inline-flex items-center cursor-pointer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            title={Boolean(faq.is_active) ? "Deactivate" : "Activate"}
                                                                        >
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={Boolean(faq.is_active)}
                                                                                onChange={() => handleToggle(faq.id)}
                                                                                className="sr-only peer"
                                                                            />
                                                                            <div className="w-8 h-4 md:w-9 md:h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                                                            <div className="absolute left-0.5 top-0.5 w-3 h-3 md:left-1 md:top-1 md:w-3 md:h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4 md:peer-checked:translate-x-4"></div>
                                                                        </label>
                                                                    </PermissionWrapper>
                                                                </td>
                                                                <td className="p-4 align-middle text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <PermissionWrapper section="Landing Page FAQ" action="edit">
                                                                            <button
                                                                                onClick={() => openModal(faq)}
                                                                                className="p-1.5 rounded-lg text-forestGreen bg-lightGreen hover:bg-lightGreen transition-colors border border-leafGreen/30/50"
                                                                                title="Edit"
                                                                            >
                                                                                <Edit2 size={16} />
                                                                            </button>
                                                                        </PermissionWrapper>
                                                                        <PermissionWrapper section="Landing Page FAQ" action="delete">
                                                                            <button
                                                                                onClick={() => handleDeleteClick(faq.id)}
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

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                    <Trash2 className="h-6 w-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete FAQ</h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    Are you sure you want to delete this FAQ? This action cannot be undone.
                                </p>
                                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                                    <button
                                        onClick={() => {
                                            setIsDeleteModalOpen(false);
                                            setFaqToDelete(null);
                                        }}
                                        disabled={isDeleting}
                                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        disabled={isDeleting}
                                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
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
                        <div className="bg-white rounded-xl w-full max-w-3xl mx-auto overflow-hidden shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                                    {editMode ? "Edit FAQ" : "Add FAQ"}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-lightGreen rounded-lg transition-colors flex-shrink-0"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                <form id="faqForm" onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Question <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="question"
                                                value={formData.question}
                                                onChange={handleInputChange}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all"
                                                placeholder="Enter question"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Answer <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                name="answer"
                                                value={formData.answer}
                                                onChange={handleInputChange}
                                                rows="4"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all resize-none"
                                                placeholder="Enter answer"
                                                required
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 mt-4 bg-gray-50 border border-gray-200 p-3 rounded-lg">
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
                                    form="faqForm"
                                    className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen   rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editMode ? "Update " : "Create "} <span className="hidden sm:inline">FAQ</span>
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FrontendFaq;
