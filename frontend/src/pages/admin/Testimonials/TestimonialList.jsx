"use client"

import { useState } from "react"
import AdminLoader from "../../../components/admin/AdminLoader"
import {
    Plus,
    Edit2,
    Trash2,
    X,
    ArrowLeft,
    Quote,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import Cookies from "js-cookie"
import PermissionWrapper from "../../../context/PermissionWrapper"
import { useGetAllTestimonialsQuery, useCreateTestimonialMutation, useUpdateTestimonialMutation, useDeleteTestimonialMutation, useGetAllLogosQuery } from "../../../services/Testimonials/testimonialApi"

const TestimonialList = () => {
    const navigate = useNavigate()
    const accessToken = Cookies.get("accessToken");

    const { data: testimonialsData, isLoading: isTestimonialsLoading } = useGetAllTestimonialsQuery(accessToken);
    const { data: logosData } = useGetAllLogosQuery(accessToken);

    const [createTestimonial] = useCreateTestimonialMutation();
    const [updateTestimonial] = useUpdateTestimonialMutation();
    const [deleteTestimonial] = useDeleteTestimonialMutation();

    const testimonials = testimonialsData?.data || [];
    const masterLogos = logosData?.data || [];

    const [showForm, setShowForm] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [formData, setFormData] = useState({
        text: "",
        author: "",
        role: "",
        companyId: "",
        authorImageFile: null,
        authorImageUrl: "",
        rating: 5
    })
    const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, id: null, author: "" })

    const handleIdentifier = () => {
        setEditingItem(null)
        setFormData({ text: "", author: "", role: "", companyId: "", authorImageFile: null, authorImageUrl: "", rating: 5 })
        setShowForm(true)
    }

    const handleEdit = (item) => {
        setEditingItem(item)
        setFormData({
            text: item.testimonial_text,
            author: item.author_name,
            role: item.author_role,
            companyId: item.company_id,
            authorImageFile: null,
            authorImageUrl: item.author_image,
            rating: item.rating || 5
        })
        setShowForm(true)
    }

    const handleDelete = (item) => {
        setDeleteConfirmation({ show: true, id: item.id, author: item.author_name })
    }

    const handleConfirmDelete = async () => {
        try {
            await deleteTestimonial({ id: deleteConfirmation.id, access_token: accessToken }).unwrap();
            toast.success("Testimonial deleted successfully");
            setDeleteConfirmation({ show: false, id: null, author: "" })
        } catch (error) {
            console.error("Failed to delete testimonial:", error);
            toast.error("Failed to delete testimonial");
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const data = new FormData();
        data.append("author_name", formData.author);
        data.append("author_role", formData.role);
        data.append("testimonial_text", formData.text);
        data.append("rating", formData.rating);
        data.append("company_id", formData.companyId);
        data.append("status", "active");

        if (formData.authorImageFile) {
            data.append("authorImage", formData.authorImageFile);
        }

        if (!editingItem) {
            data.append("created_by", 1);
        } else {
            data.append("updated_by", 1);
        }


        try {
            if (editingItem) {
                await updateTestimonial({ id: editingItem.id, data, access_token: accessToken }).unwrap();
                toast.success("Testimonial updated successfully");
            } else {
                await createTestimonial({ data, access_token: accessToken }).unwrap();
                toast.success("Testimonial created successfully");
            }
            setShowForm(false);
        } catch (error) {
            console.error("Failed to save testimonial:", error);
            toast.error("Failed to save testimonial");
        }
    }

    const handleToggle = async (item) => {
        const data = new FormData();
        data.append("status", item.status === "active" ? "inactive" : "active");
        try {
            await updateTestimonial({ id: item.id, data, access_token: accessToken }).unwrap();
            toast.success("Testimonial status updated successfully");
        } catch (error) {
            console.error("Failed to toggle testimonial status:", error);
            toast.error("Failed to toggle testimonial status");
        }
    }

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b pl-0 sm:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
                <div className="w-full px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-forestGreen">Testimonials</h1>
                            <p className="text-gray-600 mt-1">Manage user success stories</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <PermissionWrapper section="Landing Page Testimonials" action="create">
                                <button
                                    onClick={handleIdentifier}
                                    className="flex items-center gap-2 px-4 py-2 bg-leafGreen text-white rounded-lg shadow-sm transition-colors font-medium"
                                >
                                    <Plus size={18} />
                                    Add Testimonial
                                </button>
                            </PermissionWrapper>
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-300 rounded-lg shadow-sm"
                            >
                                <ArrowLeft size={18} />
                                <span className="font-medium hidden md:inline-flex">Back</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-lightGreen uppercase border-b border-gray-200 text-xs font-semibold text-gray-700">
                        <div className="col-span-4">Author Details</div>
                        <div className="col-span-4">Testimonial</div>
                        <div className="col-span-2">Company</div>
                        <div className="col-span-2 text-center">Actions</div>
                    </div>

                    {isTestimonialsLoading ? (
                        <AdminLoader message="Loading testimonials..." />
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {testimonials.map((item) => (
                                <div key={item.id} className="p-4 sm:px-6 sm:py-5 hover:bg-lightGreen/20 transition-all duration-200">
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                                        <div className="col-span-4 flex items-center gap-3">
                                            {item.author_image && (
                                                <img
                                                    src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${item.author_image}`}
                                                    alt={item.author_name}
                                                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                                />
                                            )}
                                            <div>
                                                <div className="font-medium text-gray-900">{item.author_name}</div>
                                                <div className="text-sm text-gray-500">{item.author_role}</div>
                                            </div>
                                        </div>
                                        <div className="col-span-4 text-gray-600 text-sm line-clamp-2 italic">
                                            "{item.testimonial_text}"
                                        </div>
                                        <div className="col-span-2 flex items-center gap-2">
                                            {item.company?.logo_url ? (
                                                <img
                                                    src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${item.company?.logo_url}`}
                                                    alt={item.company.name}
                                                    className="h-6 object-contain"
                                                />
                                            ) : (
                                                <span className="text-gray-400 text-sm">No Logo</span>
                                            )}
                                        </div>
                                        <div className="col-span-2 flex justify-center gap-2">
                                            <PermissionWrapper section="Landing Page Testimonials" action="edit">
                                                <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg text-forestGreen bg-lightGreen hover:bg-lightGreen/80 transition-colors border border-leafGreen/30">
                                                    <Edit2 size={16} />
                                                </button>
                                            </PermissionWrapper>
                                            <PermissionWrapper section="Landing Page Testimonials" action="edit">
                                                <div className="inline-flex items-center ">
                                                    <label
                                                        className="relative cursor-pointer flex-shrink-0"
                                                        title={item.status === "active" ? "Activate" : "Deactivate"}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={item.status === "active"}
                                                            onChange={() => handleToggle(item)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                                        <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                                                    </label>
                                                </div>
                                            </PermissionWrapper>
                                            <PermissionWrapper section="Landing Page Testimonials" action="delete">
                                                <button onClick={() => handleDelete(item)} className="p-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-200/50">
                                                    <Trash2 size={16} />
                                                </button>
                                            </PermissionWrapper>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isTestimonialsLoading && testimonials.length === 0 && (
                        <div className="px-6 py-16 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Quote size={24} className="text-gray-400" />
                            </div>
                            <div className="text-gray-500 text-lg font-medium mb-2">No testimonials yet</div>
                            <p className="text-gray-400">Add a success story to showcase.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-xl mx-auto overflow-hidden shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                                {editingItem ? "Edit Testimonial" : "Add Testimonial"}
                            </h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-lightGreen rounded-lg transition-colors flex-shrink-0"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            <form onSubmit={handleSubmit} id="testimonialForm" className="space-y-4">
                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Author Image</label>
                                    <div className="flex items-center gap-4">
                                        {(formData.authorImageUrl || formData.authorImageFile) ? (
                                            <img
                                                src={formData.authorImageFile ? URL.createObjectURL(formData.authorImageFile) : `${import.meta.env.VITE_BACKEND_MEDIA_URL}${formData.authorImageUrl}`}
                                                alt="Preview"
                                                className="w-16 h-16 rounded-full object-cover border"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No Image</div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setFormData({ ...formData, authorImageFile: file });
                                                } else {
                                                    setFormData({ ...formData, authorImageFile: null });
                                                }
                                            }}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-lightGreen file:text-forestGreen hover:file:bg-lightGreen/80"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Author Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.author}
                                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent outline-none"
                                        placeholder="e.g. Jane Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role / Job Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent outline-none"
                                        placeholder="e.g. Senior Developer"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company (Logo)</label>
                                    <select
                                        required
                                        value={formData.companyId}
                                        onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent outline-none bg-white"
                                    >
                                        <option value="">Select a Company...</option>
                                        {masterLogos.map(logo => (
                                            <option key={logo.id} value={logo.id}>{logo.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Manage logos in Logo Master</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                                    <select
                                        required
                                        value={formData.rating}
                                        onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent outline-none bg-white"
                                    >
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <option key={num} value={num}>{num} Stars</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial Text</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={formData.text}
                                        onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent outline-none resize-none"
                                        placeholder="What did they say?"
                                    />
                                </div>
                            </form>
                        </div>


                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="testimonialForm"
                                className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {editingItem ? "Update " : "Create "} <span className="hidden sm:inline">Testimonial</span>
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteConfirmation.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={24} className="text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Testimonial?</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to remove the review from <span className="font-semibold">{deleteConfirmation.author}</span>?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmation({ show: false, id: null, author: "" })}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default TestimonialList
