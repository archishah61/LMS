"use client"
import { useState, useEffect } from "react"
import {
    useGetSocialMediaLinksQuery,
    useUpdateSocialMediaPlatformMutation,
} from "../../services/legalPages/socialMediaApi"
import { useGetFooterSettingsQuery, useUpdateFooterFieldMutation } from "../../services/LegalPages/footerSettingApi"
import {
    Facebook,
    Twitter,
    Youtube,
    Instagram,
    Linkedin,
    ExternalLink,
    Check,
    X,
    MapPin,
    Phone,
    Mail,
    Clock,
    ImageIcon,
    ArrowLeft
} from "lucide-react"
import { getAdminToken } from "../../services/CookieService"
import AdminLoader from "../../components/admin/AdminLoader"
import { toast } from "react-hot-toast"
import PermissionWrapper from "../../context/PermissionWrapper"
import { useNavigate } from "react-router-dom";

export default function SocialMedia() {
    const { access_token } = getAdminToken()
    const [updatePlatform] = useUpdateSocialMediaPlatformMutation()
    const [updateFooterField] = useUpdateFooterFieldMutation()

    // Social Media Queries
    const { data: socialLinks, isLoading: socialLoading, refetch: refetchSocial } = useGetSocialMediaLinksQuery()

    // Footer Settings Queries
    const { data: footerSettings, isLoading: footerLoading, refetch: refetchFooter } = useGetFooterSettingsQuery()

    const [editingPlatform, setEditingPlatform] = useState(null)
    const [editingFooterField, setEditingFooterField] = useState(null)
    const [saving, setSaving] = useState(null)

    // Add this after the existing state declarations
    const [logoFile, setLogoFile] = useState(null)
    const [logoPreview, setLogoPreview] = useState(null)
    const navigate = useNavigate();

    // State for social media form inputs
    const [formData, setFormData] = useState({
        linkedin: "",
        facebook: "",
        twitter: "",
        youtube: "",
        instagram: "",
    })

    // State for footer settings form inputs
    const [footerFormData, setFooterFormData] = useState({
        address: "",
        phone: "",
        email: "",
        timing: "",
        footerLogo: "",
        headerLogo: "",
    })

    // Update social media form data when socialLinks are fetched
    useEffect(() => {
        if (socialLinks?.data?.[0]) {
            setFormData({
                linkedin: socialLinks.data[0].linkedin || "",
                facebook: socialLinks.data[0].facebook || "",
                twitter: socialLinks.data[0].twitter || "",
                youtube: socialLinks.data[0].youtube || "",
                instagram: socialLinks.data[0].instagram || "",
            })
        }
    }, [socialLinks])

    // Update footer form data when footerSettings are fetched
    useEffect(() => {
        if (footerSettings?.data) {
            setFooterFormData({
                address: footerSettings.data.address || "",
                phone: footerSettings.data.phone ? footerSettings.data.phone.replace(/^\+91\s+/, "") : "",
                email: footerSettings.data.email || "",
                timing: footerSettings.data.timing || "",
                footerLogo: footerSettings.data.footerLogo || "",
                headerLogo: footerSettings.data.headerLogo || "",
            })
        }
    }, [footerSettings])

    // Handle social media input change
    const handleChange = (platform, value) => {
        setFormData((prev) => ({
            ...prev,
            [platform]: value,
        }))
    }

    // Handle footer input change
    const handleFooterChange = (field, value) => {
        setFooterFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    // Handle social media form submission
    const handleSubmit = async (platform) => {
        setSaving(platform)
        try {
            const response = await updatePlatform({
                platform,
                url: formData[platform],
                access_token,
            }).unwrap()
            if (response.success) {
                toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} updated successfully!`)
                setEditingPlatform(null)
                refetchSocial()
            } else {
                toast.error(`Failed to update ${platform}.`)
            }
        } catch (error) {
            toast.error(`Error updating ${platform}: ${error?.data?.message || err?.data?.error || "Something went wrong"}`)
            console.error("Error updating social media link:", error)
        } finally {
            setSaving(null)
        }
    }

    // Replace the existing handleFooterSubmit function with:
    const handleFooterSubmit = async (field) => {
        if (field === "footerLogo" || field === "headerLogo") {
            handleLogoSubmit(field)
            return
        }

        setSaving(field)
        try {
            const response = await updateFooterField({
                field,
                value: { value: footerFormData[field] },
                access_token,
            }).unwrap()
            if (response.success) {
                toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`)
                setEditingFooterField(null)
                refetchFooter()
            } else {
                toast.error(`Failed to update ${field}.`)
            }
        } catch (error) {
            toast.error(`Error updating ${field}: ${error?.data?.message || err?.data?.error || "Something went wrong"}`)
            console.error("Error updating footer field:", error)
        } finally {
            setSaving(null)
        }
    }

    const handleCancel = (platform) => {
        setEditingPlatform(null)
        if (socialLinks?.data?.[0]) {
            setFormData((prev) => ({
                ...prev,
                [platform]: socialLinks.data[0][platform] || "",
            }))
        }
    }

    const handleFooterCancel = (field) => {
        setEditingFooterField(null)
        if (footerSettings?.data) {
            setFooterFormData((prev) => ({
                ...prev,
                [field]: footerSettings.data[field] || "",
            }))
        }
    }

    // Add these functions after handleFooterCancel
    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            // Validate file type
            const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
            if (!validTypes.includes(file.type)) {
                toast.error("Please select a valid image file (JPEG, PNG, GIF, or WebP)")
                return
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024 // 5MB in bytes
            if (file.size > maxSize) {
                toast.error("File size must be less than 5MB")
                return
            }

            setLogoFile(file)

            // Create preview
            const reader = new FileReader()
            reader.onload = (e) => {
                setLogoPreview(e.target.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleLogoCancel = () => {
        setEditingFooterField(null)
        setLogoFile(null)
        setLogoPreview(null)
    }

    const handleLogoSubmit = async (field) => {
        if (!logoFile) {
            toast.error("Please select a logo file")
            return
        }

        setSaving(field)
        try {
            const formData = new FormData()
            // Append with correct key based on field
            if (field === 'headerLogo') {
                formData.append("header-logo", logoFile)
            } else {
                formData.append("footer-logo", logoFile)
            }

            const response = await updateFooterField({
                field: field,
                value: formData,
                access_token,
            }).unwrap()

            if (response.success) {
                toast.success(`${field === "headerLogo" ? "Header" : "Footer"} Logo updated successfully!`)
                setEditingFooterField(null)
                setLogoFile(null)
                setLogoPreview(null)
                refetchFooter()
            } else {
                toast.error("Failed to update logo.")
            }
        } catch (error) {
            toast.error(`Error updating logo: ${error?.data?.message || err?.data?.error || "Something went wrong"}`)
            console.error("Error updating logo:", error)
        } finally {
            setSaving(null)
        }
    }

    // Social Media Platform configurations
    const platforms = [
        {
            name: "linkedin",
            icon: Linkedin,
            label: "LinkedIn",
            placeholder: "linkedin.com/in/username",
            color: "from-blue-600 to-blue-700",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200",
        },
        {
            name: "facebook",
            icon: Facebook,
            label: "Facebook",
            placeholder: "facebook.com/username",
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200",
        },
        {
            name: "twitter",
            icon: Twitter,
            label: "Twitter",
            placeholder: "twitter.com/username",
            color: "from-sky-400 to-sky-500",
            bgColor: "bg-sky-50",
            borderColor: "border-sky-200",
        },
        {
            name: "youtube",
            icon: Youtube,
            label: "YouTube",
            placeholder: "youtube.com/@username",
            color: "from-red-500 to-red-600",
            bgColor: "bg-red-50",
            borderColor: "border-red-200",
        },
        {
            name: "instagram",
            icon: Instagram,
            label: "Instagram",
            placeholder: "instagram.com/username",
            color: "from-pink-500 to-purple-500",
            bgColor: "bg-gradient-to-br from-pink-50 to-purple-50",
            borderColor: "border-pink-200",
        },
    ]

    // In the footerFields array, replace the logo object with:
    const footerFields = [
        {
            name: "headerLogo",
            icon: ImageIcon,
            label: "Header Logo",
            placeholder: "Choose header logo image",
            color: "from-blue-600 to-blue-700",
            type: "file",
        },
        {
            name: "footerLogo",
            icon: ImageIcon,
            label: "Footer Logo",
            placeholder: "Choose footer logo image",
            color: "from-indigo-600 to-indigo-700",
            type: "file",
        },
        {
            name: "address",
            icon: MapPin,
            label: "Address",
            placeholder: "Enter your business address",
            color: "from-green-600 to-green-700",
            type: "textarea",
        },
        {
            name: "phone",
            icon: Phone,
            label: "Phone",
            placeholder: "+1 (555) 123-4567",
            color: "from-blue-600 to-blue-700",
            type: "tel",
        },
        {
            name: "email",
            icon: Mail,
            label: "Email",
            placeholder: "contact@company.com",
            color: "from-purple-600 to-purple-700",
            type: "email",
        },
        {
            name: "timing",
            icon: Clock,
            label: "Business Hours",
            placeholder: "Mon-Fri: 9AM-6PM",
            color: "from-orange-600 to-orange-700",
            type: "text",
        },
    ]

    if (socialLoading || footerLoading) {
        return <AdminLoader message="Loading settings..." />
    }

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">

            {/* Header */}
            <div className="bg-white border-b border-gray-200 flex-shrink-0">
                <div className="w-full px-4 lg:px-6 py-3 lg:py-4">
                    <div className="flex items-center justify-between">
                        {/* Mobile: Centered title, Desktop: Left aligned */}
                        <div className="text-center lg:text-left">
                            <h1 className="text-xl lg:text-2xl font-bold bg-forestGreen bg-clip-text text-transparent break-words">
                                Social Media & Footer
                            </h1>
                            <p className="text-gray-600 mt-0.5 lg:mt-1 text-xs lg:text-base hidden lg:block break-words">
                                Manage your social media presence and footer information
                            </p>
                        </div>

                        {/* Back button - always on right */}
                        <div className="flex-shrink-0">
                            <button
                                onClick={() => navigate("/admin/dashboard")}
                                className="flex items-center justify-center w-10 h-10 lg:w-auto lg:h-auto lg:px-4 lg:py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                            >
                                <ArrowLeft size={18} />
                                <span className="hidden lg:inline font-medium ml-2">Back</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full p-4 lg:p-6">

                <div className="space-y-6">
                    {/* Social Media Section */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Social Media</h3>
                                <p className="text-sm text-gray-500 mt-1">Connect with your audience across platforms</p>
                            </div>
                            <div className="flex -space-x-2">
                                {platforms.filter(p => socialLinks?.data?.[0]?.[p.name]).slice(0, 5).map(p => (
                                    <div key={p.name} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center bg-gray-50`} title={p.label}>
                                        <p.icon className="w-4 h-4 text-gray-600" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-lightGreen border-b border-gray-200 sticky top-0 z-20">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Platform</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">URL</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {platforms.map((platform) => {
                                        const isEditing = editingPlatform === platform.name
                                        const isSaving = saving === platform.name
                                        const currentUrl = socialLinks?.data?.[0]?.[platform.name]
                                        const hasUrl = currentUrl && currentUrl.length > 0

                                        return (
                                            <tr key={platform.name} className="hover:bg-lightGreen/20 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2.5 rounded-xl bg-gray-50 text-gray-600 group-hover:bg-white group-hover:shadow-sm transition-all`}>
                                                            <platform.icon className="w-5 h-5" />
                                                        </div>
                                                        <span className="font-medium text-gray-900">{platform.label}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    {isEditing ? (
                                                        <input
                                                            type="url"
                                                            value={formData[platform.name]}
                                                            onChange={(e) => handleChange(platform.name, e.target.value)}
                                                            placeholder={platform.placeholder}
                                                            className="w-full max-w-md px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-sm font-medium"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <div className="flex items-center gap-2 max-w-md">
                                                            {hasUrl ? (
                                                                <>
                                                                    <span className="text-sm text-gray-600 truncate font-medium">{currentUrl}</span>
                                                                    <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                                    </a>
                                                                </>
                                                            ) : (
                                                                <span className="text-sm text-gray-400 italic">Not connected</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${hasUrl ? 'bg-leafGreen' : 'bg-gray-300'}`}></div>
                                                        <span className={`text-xs font-medium ${hasUrl ? 'text-gray-900' : 'text-gray-500'}`}>
                                                            {hasUrl ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    {isEditing ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleSubmit(platform.name)}
                                                                disabled={!formData[platform.name] || isSaving}
                                                                className="p-2 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50 transition-colors shadow-sm"
                                                            >
                                                                {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                                                            </button>
                                                            <button
                                                                onClick={() => handleCancel(platform.name)}
                                                                disabled={isSaving}
                                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <PermissionWrapper section="Social Media" action="edit">
                                                            <button
                                                                onClick={() => setEditingPlatform(platform.name)}
                                                                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50"
                                                            >
                                                                Edit
                                                            </button>
                                                        </PermissionWrapper>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer Settings Section */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
                            <p className="text-sm text-gray-500 mt-1">Contact info and branding assets.</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-lightGreen">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Setting</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Value</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {footerFields.map((field) => {
                                        const isEditing = editingFooterField === field.name
                                        const isSaving = saving === field.name
                                        const currentValue = footerSettings?.data[field.name]
                                        const hasValue = currentValue && currentValue.length > 0
                                        const isLogo = field.name === "footerLogo" || field.name === "headerLogo"

                                        return (
                                            <tr key={field.name} className="hover:bg-lightGreen/20 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2.5 rounded-xl bg-gray-50 text-gray-600 group-hover:bg-white group-hover:shadow-sm transition-all`}>
                                                            <field.icon className="w-5 h-5" />
                                                        </div>
                                                        <span className="font-medium text-gray-900">{field.label}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    {isEditing ? (
                                                        <div className="max-w-md">
                                                            {isLogo ? (
                                                                <div className="flex items-center gap-4">
                                                                    <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-gray-200 border-dashed rounded-xl cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-all bg-white">
                                                                        <div className="flex flex-col items-center justify-center">
                                                                            {logoPreview || currentValue ? (
                                                                                <img
                                                                                    src={logoPreview || `${import.meta.env.VITE_BACKEND_MEDIA_URL}${currentValue}`}
                                                                                    alt="Preview"
                                                                                    className="h-12 object-contain mb-2"
                                                                                />
                                                                            ) : (
                                                                                <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                                                                            )}
                                                                            <p className="text-xs text-gray-500 font-medium">Click to change</p>
                                                                        </div>
                                                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                                                    </label>
                                                                    {logoFile && (
                                                                        <div className="text-xs text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                                                                            Ready to upload
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : field.type === "textarea" ? (
                                                                <textarea
                                                                    value={footerFormData[field.name]}
                                                                    onChange={(e) => handleFooterChange(field.name, e.target.value)}
                                                                    placeholder={field.placeholder}
                                                                    rows={2}
                                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-sm resize-none"
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                <input
                                                                    type={field.type}
                                                                    value={footerFormData[field.name]}
                                                                    onChange={(e) => handleFooterChange(field.name, e.target.value)}
                                                                    placeholder={field.placeholder}
                                                                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-sm font-medium"
                                                                    autoFocus
                                                                />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm font-medium text-gray-600">
                                                            {isLogo ? (
                                                                currentValue ? (
                                                                    <div className="h-10 w-fit p-1 bg-gray-50 rounded-lg border border-gray-100">
                                                                        <img
                                                                            src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${currentValue}`}
                                                                            alt={field.label}
                                                                            className="h-full object-contain"
                                                                        />
                                                                    </div>
                                                                ) : <span className="text-gray-400 italic">No image set</span>
                                                            ) : (
                                                                <span className="line-clamp-1">{currentValue || <span className="text-gray-400 italic">Not set</span>}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${hasValue ? 'bg-leafGreen' : 'bg-gray-300'}`}></div>
                                                        <span className={`text-xs font-medium ${hasValue ? 'text-gray-900' : 'text-gray-500'}`}>
                                                            {hasValue ? 'Configured' : 'Missing'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    {isEditing ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => isLogo ? handleLogoSubmit(field.name) : handleFooterSubmit(field.name)}
                                                                disabled={isSaving}
                                                                className="p-2 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50 transition-colors shadow-sm"
                                                            >
                                                                {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                                                            </button>
                                                            <button
                                                                onClick={() => isLogo ? handleLogoCancel() : handleFooterCancel(field.name)}
                                                                disabled={isSaving}
                                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <PermissionWrapper section="Footer" action="edit">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingFooterField(field.name)
                                                                    if (isLogo) {
                                                                        setLogoFile(null);
                                                                        setLogoPreview(null);
                                                                    }
                                                                }}
                                                                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50"
                                                            >
                                                                Edit
                                                            </button>
                                                        </PermissionWrapper>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
