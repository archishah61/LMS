"use client"

import { useState } from "react"
import AdminLoader from "../../../components/admin/AdminLoader"
import {
    Plus,
    Edit2,
    Trash2,
    X,
    Upload,
    ArrowLeft,
    Filter, // kept for potential future use
    ChevronUp, // kept for potential future use
    ChevronDown, // kept for potential future use
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import Cookies from "js-cookie"
import { useGetAllLogosQuery, useCreateLogoMutation, useUpdateLogoMutation, useDeleteLogoMutation } from "../../../services/Testimonials/testimonialApi"

const TestimonialMaster = () => {
    const navigate = useNavigate()
    const accessToken = Cookies.get("accessToken");

    // RTK Query hooks
    const { data: logosData, isLoading } = useGetAllLogosQuery(accessToken);
    const [createLogo] = useCreateLogoMutation();
    const [updateLogo] = useUpdateLogoMutation();
    const [deleteLogo] = useDeleteLogoMutation();

    const logos = logosData?.data || [];

    const [showForm, setShowForm] = useState(false)
    const [editingLogo, setEditingLogo] = useState(null)
    const [formData, setFormData] = useState({ name: "", logoUrl: "", file: null })
    const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, id: null, name: "" })

    const handleAddLogo = () => {
        setEditingLogo(null)
        setFormData({ name: "", logoUrl: "", file: null })
        setShowForm(true)
    }

    const handleEditLogo = (logo) => {
        setEditingLogo(logo)
        setFormData({ name: logo.name, logoUrl: logo.logo_url, file: null })
        setShowForm(true)
    }

    const handleToggle = async (item) => {
        const data = new FormData();
        data.append("status", item.status === "active" ? "inactive" : "active");
        try {
            await updateLogo({ id: item.id, data, access_token: accessToken }).unwrap();
            toast.success("Logo status updated successfully");
        } catch (error) {
            console.error("Failed to toggle Logo status:", error);
            toast.error("Failed to toggle Logo status");
        }
    }

    const handleDeleteLogo = (logo) => {
        setDeleteConfirmation({ show: true, id: logo.id, name: logo.name })
    }

    const handleConfirmDelete = async () => {
        try {
            await deleteLogo({ id: deleteConfirmation.id, access_token: accessToken }).unwrap();
            toast.success("Logo deleted successfully");
            setDeleteConfirmation({ show: false, id: null, name: "" })
        } catch (error) {
            console.error("Failed to delete logo:", error);
            toast.error("Failed to delete logo");
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const data = new FormData();
        data.append("name", formData.name);
        data.append("status", "active");
        // For now, hardcoding created_by or relying on backend to extraction/default
        data.append("created_by", 1);

        if (formData.file) {
            data.append("companyLogo", formData.file);
        } else {
            // Keep existing URL if no new file
            data.append("logo_url", formData.logoUrl);
        }

        try {
            if (editingLogo) {
                await updateLogo({ id: editingLogo.id, data, access_token: accessToken }).unwrap();
                toast.success("Logo updated successfully");
            } else {
                await createLogo({ data, access_token: accessToken }).unwrap();
                toast.success("Logo created successfully");
            }
            setShowForm(false);
        } catch (error) {
            console.error("Failed to save logo:", error);
            toast.error("Failed to save logo");
        }
    }

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b pl-0 sm:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
                <div className="w-full px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-forestGreen">Logo Master</h1>
                            <p className="text-gray-600 mt-1">Manage company logos for testimonials</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleAddLogo}
                                className="flex items-center gap-2 px-4 py-2 bg-leafGreen text-white rounded-lg shadow-sm transition-colors font-medium"
                            >
                                <Plus size={18} />
                                Add Logo
                            </button>
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-300 rounded-lg shadow-sm"
                            >
                                <ArrowLeft size={18} />
                                <span className="font-medium">Back</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 uppercase bg-lightGreen border-b border-gray-200 text-xs font-semibold text-gray-700">
                        <div className="col-span-4">Company Name</div>
                        <div className="col-span-4">Logo Preview</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2 text-center">Actions</div>
                    </div>

                    {isLoading ? (
                        <AdminLoader message="Loading logos..." />
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {logos.map((logo) => (
                                <div key={logo.id} className="p-4 sm:px-6 sm:py-5 hover:bg-lightGreen/20 transition-all duration-200">
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                                        <div className="col-span-4 font-medium text-gray-900">{logo.name}</div>
                                        <div className="col-span-4">
                                            <img
                                                src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${logo?.logo_url}`}
                                                alt={logo.name}
                                                className="h-8 object-contain"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {logo.status}
                                            </span>
                                        </div>
                                        <div className="col-span-2 flex justify-center gap-2">
                                            <button onClick={() => handleEditLogo(logo)} className="p-1.5 rounded-lg text-forestGreen bg-lightGreen hover:bg-lightGreen/80 transition-colors border border-leafGreen/30">
                                                <Edit2 size={16} />
                                            </button>
                                            <div className="inline-flex items-center ">
                                                <label
                                                    className="relative cursor-pointer flex-shrink-0"
                                                    title={logo.status === "active" ? "Activate" : "Deactivate"}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={logo.status === "active"}
                                                        onChange={() => handleToggle(logo)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                                                </label>
                                            </div>
                                            <button onClick={() => handleDeleteLogo(logo)} className="p-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-200/50">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isLoading && logos.length === 0 && (
                        <div className="px-6 py-16 text-center">
                            <div className="text-gray-500 text-lg font-medium mb-2">No logos found</div>
                            <p className="text-gray-400">Add a new logo to get started.</p>
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
                                {editingLogo ? "Edit Logo" : "Add Logo"}
                            </h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-lightGreen rounded-lg transition-colors flex-shrink-0"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            <form id="logoForm" onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent outline-none"
                                        placeholder="e.g. Google"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-leafGreen transition-colors">
                                        <div className="space-y-1 text-center">
                                            {formData.logoUrl ? (
                                                <div className="relative inline-block">
                                                    <img
                                                        src={formData.logoUrl?.startsWith('blob:') ? formData.logoUrl : `${import.meta.env.VITE_BACKEND_MEDIA_URL}${formData?.logoUrl}`}
                                                        alt="Preview"
                                                        className="h-16 object-contain mx-auto mb-4"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, logoUrl: "", file: null })}
                                                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                            )}
                                            <div className="flex text-sm text-gray-600 justify-center">
                                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-leafGreen hover:text-forestGreen focus-within:outline-none">
                                                    <span>Upload a file</span>
                                                    <input
                                                        id="file-upload"
                                                        name="file-upload"
                                                        type="file"
                                                        className="sr-only"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files[0]
                                                            if (file) {
                                                                const url = URL.createObjectURL(file)
                                                                setFormData({ ...formData, logoUrl: url, file: file })
                                                            }
                                                        }}
                                                    />
                                                </label>
                                                <p className="pl-1">or drag and drop</p>
                                            </div>
                                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                                        </div>
                                    </div>
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
                                form="logoForm"
                                className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {editingLogo ? "Update " : "Create "} <span className="hidden sm:inline">Logo</span>
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
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Logo?</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete <span className="font-semibold">{deleteConfirmation.name}</span>? This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmation({ show: false, id: null, name: "" })}
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

export default TestimonialMaster
