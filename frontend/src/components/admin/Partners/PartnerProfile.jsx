"use client"

/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react"
import AdminLoader from "../AdminLoader"
import { useSelector } from "react-redux"
import {
    User,
    Mail,
    Phone,
    Globe,
    Building,
    Users,
    FileText,
    Camera,
    Edit3,
    Save,
    X,
    CheckCircle,
    Clock,
    XCircle,
    Lock,
} from "lucide-react"
import { useGetPartnerByIdQuery, useUpdatePartnerMutation } from "../../../services/Become_partner/becomePartnerApi"
import { getAdminToken } from "../../../services/CookieService"
import ChangePasswordModal from "./ChangePasswordModal" // Adjust the path as needed
import PermissionWrapper from "../../../context/PermissionWrapper";
import toast from "react-hot-toast"

// Import your RTK Query hook - adjust the import path as needed
// import { useGetPartnerByIdQuery, useUpdatePartnerMutation } from "path/to/your/api"

export default function PartnerProfile() {
    const { id } = useSelector((state) => state.user)
    const { access_token } = getAdminToken()

    // Use your RTK Query hooks
    const {
        data: partner,
        isLoading,
        error,
    } = useGetPartnerByIdQuery({
        id,
        access_token,
    })
    const [updatePartner, { isLoading: isUpdating }] = useUpdatePartnerMutation()

    const [formData, setFormData] = useState({
        partner_type: "Individual",
        name: "",
        email: "",
        phone: "",
        organization_type: "",
        contact_person_name: "",
        contact_person_email: "",
        contact_person_phone: "",
        website: "",
        description: "",
        logo: null,
        status: "Pending",
    })

    const [isEditing, setIsEditing] = useState(false)
    const [logoPreview, setLogoPreview] = useState("")
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
    const [originalLogo, setOriginalLogo] = useState("")

    // Populate form when partner data is loaded
    useEffect(() => {
        if (partner) {
            setFormData({
                partner_type: partner.partner_type || "Individual",
                name: partner.name || "",
                email: partner.email || "",
                phone: partner.phone || "",
                organization_type: partner.organization_type || "",
                contact_person_name: partner.contact_person_name || "",
                contact_person_email: partner.contact_person_email || "",
                contact_person_phone: partner.contact_person_phone || "",
                website: partner.website || "",
                description: partner.description || "",
                logo: null,
                status: partner.status || "Pending",
            })
            setLogoPreview(partner.logo || "")
            setOriginalLogo(partner.logo || "") // Add this line
        }
    }, [partner])


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setLogoPreview(reader.result) // This will be base64 data URL
                setFormData((prev) => ({
                    ...prev,
                    logo: file,
                }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleCancelEdit = () => {
        setIsEditing(false)
        setLogoPreview(originalLogo) // Revert to original logo
        setFormData(prev => ({
            ...prev,
            logo: originalLogo
        }))
    }

    const getImageUrl = (logoPath) => {
        if (!logoPath) return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`
        // If it's a base64 data URL (new upload), return as is
        if (logoPath.startsWith('data:')) return logoPath
        // If it's a file path from server, prepend the media URL
        return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${logoPath || "/placeholder.png"}`
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Create FormData for file upload
        const submitData = new FormData()
        Object.keys(formData).forEach((key) => {
            if (formData[key] !== null && formData[key] !== "") {
                submitData.append(key, formData[key])
            }
        })

        try {
            await updatePartner({ id, formData: submitData, access_token }).unwrap()
            setIsEditing(false)
        } catch (error) {
            toast.error(error?.data?.error || "Failed to update partner!")
            console.error("Error updating partner:", error)
        }
    }

    const getStatusConfig = (status) => {
        switch (status) {
            case "Approved":
                return {
                    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
                    icon: CheckCircle,
                    bgGradient: "from-emerald-50 to-green-50",
                }
            case "Pending":
                return {
                    color: "bg-amber-100 text-amber-700 border-amber-200",
                    icon: Clock,
                    bgGradient: "from-amber-50 to-yellow-50",
                }
            case "Rejected":
                return {
                    color: "bg-red-100 text-red-700 border-red-200",
                    icon: XCircle,
                    bgGradient: "from-red-50 to-pink-50",
                }
            default:
                return {
                    color: "bg-gray-100 text-gray-700 border-gray-200",
                    icon: Clock,
                    bgGradient: "from-gray-50 to-slate-50",
                }
        }
    }

    const statusConfig = getStatusConfig(formData.status)
    const StatusIcon = statusConfig.icon

    // Loading state
    if (isLoading) {
        return <AdminLoader message="Loading partner profile..." />
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-lightGreen via-white to-lightGreen p-6">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-3">Error Loading Profile</h2>
                            <p className="text-gray-600 mb-6 text-lg">
                                {error?.data?.message || error?.message || "Failed to load partner profile"}
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-8 py-3  bg-leafGreen text-white rounded-xl   transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // No partner data found
    if (!partner && !isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-lightGreen via-white to-lightGreen p-6">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="w-10 h-10 text-gray-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-3">No Profile Found</h2>
                            <p className="text-gray-600 text-lg">
                                Partner profile not found or you don&apos;t have access to view it.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <PermissionWrapper section="Partner Detail" action="view">
            <div className="min-h-screen bg-gradient-to-br from-lightGreen via-white to-lightGreen p-6">
                <div className="max-w-5xl mx-auto">
                    {/* Enhanced Header */}
                    <div
                        className={` ${statusConfig.bgGradient} rounded-2xl shadow-xl border border-gray-100 p-8 mb-8 relative overflow-hidden`}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

                        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="flex items-center space-x-6">
                                <div className="relative group">
                                    <div className="w-24 h-24 bg-white rounded-2xl shadow-lg overflow-hidden border-4 border-white">
                                        {getImageUrl(logoPreview) ? (
                                            <img
                                                src={getImageUrl(logoPreview)}
                                                alt="Partner Logo"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                                <User className="w-8 h-8 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    {isEditing && (
                                        <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Camera className="w-6 h-6 text-white" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <h1 className="text-3xl font-bold text-gray-900">{formData.name || "Partner Name"}</h1>
                                    <div className="flex items-center space-x-2 text-gray-600">
                                        <Mail className="w-4 h-4" />
                                        <span className="text-lg">{formData.email}</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${statusConfig.color}`}>
                                            <StatusIcon className="w-4 h-4" />
                                            <span className="font-medium text-sm">{formData.status}</span>
                                        </div>
                                        <div className="px-3 py-1.5 bg-lightGreen text-forestGreen rounded-full border border-leafGreen/30">
                                            <span className="font-medium text-sm flex items-center space-x-1">
                                                {formData.partner_type === "Organization" ? (
                                                    <Building className="w-4 h-4" />
                                                ) : (
                                                    <User className="w-4 h-4" />
                                                )}
                                                <span>{formData.partner_type}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => setShowChangePasswordModal(true)}
                                    className="px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2  from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                                >
                                    <Lock className="w-4 h-4" />
                                    <span>Change Password</span>
                                </button>

                                <PermissionWrapper section="Partner Detail" action="edit">
                                    <button
                                        onClick={() => setIsEditing(!isEditing)} // Fixed: was handleCancelEdit before
                                        className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2 ${isEditing
                                            ? "bg-gray-600 hover:bg-gray-700 text-white"
                                            : " bg-leafGreen   text-white"
                                            }`}
                                    >
                                        {isEditing ? (
                                            <>
                                                <X className="w-4 h-4" />
                                                <span>Cancel</span>
                                            </>
                                        ) : (
                                            <>
                                                <Edit3 className="w-4 h-4" />
                                                <span>Edit Profile</span>
                                            </>
                                        )}
                                    </button>
                                </PermissionWrapper>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Profile Form */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className=" from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                                <FileText className="w-6 h-6 text-forestGreen" />
                                <span>Profile Information</span>
                            </h2>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Basic Information */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 pb-2 border-b border-gray-200">
                                    <User className="w-5 h-5 text-forestGreen" />
                                    <span>Basic Information</span>
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">Partner Type</label>
                                        <div className="relative">
                                            <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-medium">
                                                {formData.partner_type}
                                            </div>
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                {formData.partner_type === "Organization" ? (
                                                    <Building className="w-5 h-5 text-gray-400" />
                                                ) : (
                                                    <User className="w-5 h-5 text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500">Partner type cannot be changed</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                required
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200"
                                                placeholder="Enter your name"
                                            />
                                            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                required
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200"
                                                placeholder="Enter your email"
                                            />
                                            <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">Phone</label>
                                        <div className="relative">
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200"
                                                placeholder="Enter your phone number"
                                            />
                                            <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Organization-specific fields */}
                            {formData.partner_type === "Organization" && (
                                <div className="space-y-6 pt-6 border-t border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 pb-2 border-b border-gray-200">
                                        <Building className="w-5 h-5 text-forestGreen" />
                                        <span>Organization Details</span>
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">Organization Type</label>
                                            <select
                                                name="organization_type"
                                                value={formData.organization_type}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200"
                                            >
                                                <option value="">Select Type</option>
                                                <option value="Institute">Institute</option>
                                                <option value="College">College</option>
                                                <option value="School">School</option>
                                                <option value="Company">Company</option>
                                                <option value="NGO">NGO</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">Website</label>
                                            <div className="relative">
                                                <input
                                                    type="url"
                                                    name="website"
                                                    value={formData.website}
                                                    onChange={handleInputChange}
                                                    disabled={!isEditing}
                                                    placeholder="https://example.com"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200"
                                                />
                                                <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">Contact Person Name</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name="contact_person_name"
                                                    value={formData.contact_person_name}
                                                    onChange={handleInputChange}
                                                    disabled={!isEditing}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200"
                                                    placeholder="Contact person name"
                                                />
                                                <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">Contact Person Email</label>
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    name="contact_person_email"
                                                    value={formData.contact_person_email}
                                                    onChange={handleInputChange}
                                                    disabled={!isEditing}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200"
                                                    placeholder="Contact person email"
                                                />
                                                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">Contact Person Phone</label>
                                            <div className="relative">
                                                <input
                                                    type="tel"
                                                    name="contact_person_phone"
                                                    value={formData.contact_person_phone}
                                                    onChange={handleInputChange}
                                                    disabled={!isEditing}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200"
                                                    placeholder="Contact person phone"
                                                />
                                                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Additional Information */}
                            <div className="space-y-6 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 pb-2 border-b border-gray-200">
                                    <FileText className="w-5 h-5 text-forestGreen" />
                                    <span>Additional Information</span>
                                </h3>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 resize-none"
                                            placeholder="Tell us about yourself or your organization..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">Logo</label>
                                        {isEditing ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-center w-full">
                                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                            <Camera className="w-8 h-8 mb-2 text-gray-400" />
                                                            <p className="mb-2 text-sm text-gray-500">
                                                                <span className="font-semibold">Click to upload</span> or drag and drop
                                                            </p>
                                                            <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 800x400px)</p>
                                                        </div>
                                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                                    </label>
                                                </div>
                                                {logoPreview && (
                                                    <div className="flex justify-center">
                                                        <img
                                                            src={getImageUrl(logoPreview)}
                                                            alt="Logo Preview"
                                                            className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex justify-center p-4">
                                                {getImageUrl(logoPreview) ? (
                                                    <img
                                                        src={getImageUrl(logoPreview)}
                                                        alt="Current Logo"
                                                        className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="w-24 h-24 bg-gray-100 rounded-xl border-2 border-gray-200 flex items-center justify-center">
                                                        <Camera className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <PermissionWrapper section="Partner Detail" action="edit">
                                {/* Submit Button */}
                                {isEditing && (
                                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium flex items-center space-x-2"
                                        >
                                            <X className="w-4 h-4" />
                                            <span>Cancel</span>
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="px-8 py-3  bg-leafGreen text-white rounded-xl   transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none font-medium flex items-center space-x-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            <span>{isLoading ? "Saving..." : "Save Changes"}</span>
                                        </button>
                                    </div>
                                )}
                            </PermissionWrapper>
                        </div>
                    </form>
                    {/* Change Password Modal */}
                    {showChangePasswordModal && (
                        <ChangePasswordModal onClose={() => setShowChangePasswordModal(false)} userId={id} />
                    )}
                </div>
            </div>
        </PermissionWrapper>
    )
}
