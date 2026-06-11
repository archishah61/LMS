import { useState, useEffect, useRef } from "react";
import {
    useSaveSeoMetaMutation,
    useGetSeoMetaByPageTypeQuery,
    useToggleSeoMetaStatusMutation,
} from "../../services/LegalPages/seoMetaAPI";
import PermissionWrapper from "../../context/PermissionWrapper";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowLeft, ChevronDown, Plus, Save, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { getAdminToken } from "../../services/CookieService";
import AdminLoader from "../../components/admin/AdminLoader";

const SeoMeta = () => {

    const ogImageRef = useRef(null);
    const seoImageRef = useRef(null);

    const [selectedPageType, setSelectedPageType] = useState("home");
    const [formData, setFormData] = useState({
        ogImage: null,
        og_image: null,
        og_alt: "",
        og_title: "",
        og_description: "",
        og_keywords: "",
        seoImage: null,
        seo_image: null,
        seo_alt: "",
        seo_title: "",
        seo_description: "",
        seo_keywords: "",
        canonical_url: "",
        page_type: "home",
    });
    const [showDropdown, setShowDropdown] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { access_token } = getAdminToken();
    const navigate = useNavigate();

    const { data: seoMetaData, isLoading, error, refetch } = useGetSeoMetaByPageTypeQuery({
        page_type: selectedPageType
    });

    const [saveSeoMeta, { isLoading: isSaving }] = useSaveSeoMetaMutation();
    const [toggleSeoMetaStatus, { isLoading: isToggling }] = useToggleSeoMetaStatusMutation();

    // Page type options
    const pageTypeOptions = [
        { value: "home", label: "Home" },
        { value: "about", label: "About" },
        { value: "contact-us", label: "Contact Us" },
        { value: "default", label: "Default" },
    ];

    // Update form data when page type changes or when data is fetched
    useEffect(() => {
        // Clear file inputs when page type changes
        if (ogImageRef.current) ogImageRef.current.value = "";
        if (seoImageRef.current) seoImageRef.current.value = "";

        if (seoMetaData?.data) {
            const meta = seoMetaData.data;
            setFormData({
                ogImage: null,
                og_alt: meta.og_alt || "",
                og_title: meta.og_title || "",
                og_description: meta.og_description || "",
                og_keywords: meta.og_keywords || "",
                og_image: meta.og_image || null,
                seoImage: null,
                seo_alt: meta.seo_alt || "",
                seo_title: meta.seo_title || "",
                seo_description: meta.seo_description || "",
                seo_keywords: meta.seo_keywords || "",
                canonical_url: meta.canonical_url || "",
                seo_image: meta.seo_image || null,
                page_type: selectedPageType,
            });
            setEditingId(meta.id || null);
        } else {
            // Reset form when no data found
            setFormData(prev => ({
                ogImage: null,
                og_alt: "",
                og_title: "",
                og_description: "",
                og_keywords: "",
                og_image: null,
                seoImage: null,
                seo_alt: "",
                seo_title: "",
                seo_description: "",
                seo_keywords: "",
                canonical_url: "",
                seo_image: null,
                page_type: selectedPageType,
            }));
            setEditingId(null);
        }
    }, [seoMetaData, selectedPageType]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            setFormData(prev => ({
                ...prev,
                [name]: files[0]
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.page_type.trim()) {
            toast.error("Page type is required.");
            return;
        }

        const formDataToSend = new FormData();

        // Append all fields including id (0 for create, existing id for update)
        formDataToSend.append('id', editingId || 0);
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
                formDataToSend.append(key, formData[key]);
            }
        });

        try {
            await saveSeoMeta({ data: formDataToSend, access_token }).unwrap();
            toast.success(`SEO Meta ${editingId ? 'updated' : 'created'} successfully.`);
            refetch();
        } catch (err) {
            console.error("Error saving SEO meta:", err);
            toast.error(err?.data?.error || "Failed to save SEO meta. Please try again.");
        }
    };

    const handleToggleStatus = async () => {
        if (!editingId) {
            toast.error("Please save the SEO meta first before toggling status.");
            return;
        }

        try {
            await toggleSeoMetaStatus({ id: editingId, access_token }).unwrap();
            toast.success("Status toggled successfully.");
            refetch();
        } catch (err) {
            console.error("Error toggling status:", err);
            toast.error(err?.data?.error || "Failed to toggle status. Please try again.");
        }
    };

    const handlePageTypeChange = (e) => {
        setSelectedPageType(e.target.value);
    };

    const currentMeta = seoMetaData?.data;
    const isActive = currentMeta?.is_active;

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
                <div className="w-full p-4 sm:px-6">
                    <div className="flex items-center justify-between">
                        {/* Left Section: Title and Subtitle */}
                        <div className="flex-1">
                            <h1 className="text-xl text-center md:text-start md:text-2xl font-bold bg-forestGreen bg-clip-text text-transparent">
                                SEO Meta<span className="hidden sm:inline"> Management</span>
                            </h1>
                            <p className="text-sm text-center md:text-start md:text-base text-gray-600 mt-1">
                                Manage OG and SEO<span className="hidden sm:inline"> meta</span> tags <span className="hidden sm:inline">for different pages</span>
                            </p>
                        </div>

                        {/* Right Section: Buttons */}
                        <div className="flex items-center gap-4 flex-wrap relative">
                            {/* Buttons for md and above */}
                            <div className="hidden md:flex items-center gap-4">
                                <select
                                    value={selectedPageType}
                                    onChange={handlePageTypeChange}
                                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-colors"
                                >
                                    {pageTypeOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>

                                {/* Status Toggle */}
                                {editingId && (
                                    <PermissionWrapper section="SEO Meta" action="toggle">
                                        <label
                                            className="relative inline-flex items-center cursor-pointer"
                                            title={
                                                currentMeta?.is_active
                                                    ? "Deactivate"
                                                    : "Activate"
                                            }
                                        >
                                            <input
                                                type="checkbox"
                                                checked={currentMeta?.is_active}
                                                onChange={handleToggleStatus}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-leafGreen transition-colors"></div>
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                                        </label>
                                    </PermissionWrapper>
                                )}

                                {/* Save Button */}
                                <PermissionWrapper section="SEO Meta" action={editingId ? "edit" : "create"}>
                                    <button
                                        type="submit"
                                        form="seoMetaForm"
                                        disabled={isSaving}
                                        className="bg-leafGreen text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-sm text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    >
                                        {isSaving ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        ) : (
                                            <Save size={18} />
                                        )}
                                        {isSaving ? "Saving..." : "Save"}
                                    </button>
                                </PermissionWrapper>

                                {/* Back Button */}
                                <button
                                    onClick={() => navigate(-1)}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                                >
                                    <ArrowLeft size={18} />
                                    <span className="font-medium">Back</span>
                                </button>
                            </div>

                            {/* Mobile View Header Controls */}
                            <div className="md:hidden flex items-center gap-3">
                                {/* Current Page Type Badge */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowDropdown((prev) => !prev)}
                                        className="flex items-center gap-1 px-3 py-3 bg-gradient-to-r from-forestGreen to-leafGreen text-white rounded-lg text-sm font-medium shadow-sm"
                                    >
                                        <ChevronDown size={16} className="flex-shrink-0" />
                                    </button>

                                    {showDropdown && (
                                        <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white border border-gray-300 rounded-lg shadow-lg py-1">
                                            {pageTypeOptions.map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setSelectedPageType(option.value);
                                                        setShowDropdown(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${option.value === selectedPageType ? 'bg-lightGreen/50 text-forestGreen font-medium' : 'text-gray-700'}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span>{option.label}</span>
                                                        {option.value === selectedPageType && (
                                                            <div className="w-2 h-2 bg-leafGreen rounded-full"></div>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Status Toggle - Mobile */}
                                {editingId && (
                                    <PermissionWrapper section="SEO Meta" action="toggle">
                                        <button
                                            onClick={handleToggleStatus}
                                            className={`flex items-center justify-center w-10 h-10 rounded-lg ${currentMeta?.is_active ? 'bg-lightGreen text-forestGreen' : 'bg-gray-100 text-gray-700'}`}
                                            title={currentMeta?.is_active ? "Deactivate" : "Activate"}
                                        >
                                            {currentMeta?.is_active ? (
                                                <ToggleRight size={20} className="text-leafGreen" />
                                            ) : (
                                                <ToggleLeft size={20} className="text-gray-400" />
                                            )}
                                        </button>
                                    </PermissionWrapper>
                                )}

                                {/* Save Button - Mobile */}
                                <PermissionWrapper section="SEO Meta" action={editingId ? "edit" : "create"}>
                                    <button
                                        type="submit"
                                        form="seoMetaForm"
                                        disabled={isSaving}
                                        className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-forestGreen to-leafGreen hover:from-forestGreen/90 hover:to-leafGreen/90 text-white rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Save Changes"
                                    >
                                        {isSaving ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        ) : (
                                            <Save size={18} />
                                        )}
                                    </button>
                                </PermissionWrapper>

                                {/* Back Button - Mobile */}
                                <button
                                    onClick={() => navigate(-1)}
                                    className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm"
                                    title="Go Back"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto w-full p-3 sm:p-4 lg:p-6 mb-14 lg:mb-0">
                {isLoading && <AdminLoader message="Loading SEO meta..." />}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start">
                            <svg
                                className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span className="text-red-800 text-sm">Error loading SEO meta. Please try again.</span>
                        </div>
                    </div>
                )}

                {!isLoading && !error && (
                    // <PermissionWrapper section="SEO Meta" action={editingId ? "edit" : "create"}>
                        <div className="bg-white border border-gray-200 rounded-xl md:rounded-lg">
                            <form onSubmit={handleSubmit} id="seoMetaForm" className="p-3 sm:p-4 space-y-4 sm:space-y-6">
                                {/* Mobile Form Header */}
                                <div className="md:hidden pb-2 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-base font-semibold text-gray-900">SEO & OG Details</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {pageTypeOptions.find(opt => opt.value === selectedPageType)?.label || selectedPageType} Page
                                            </p>
                                        </div>
                                        {editingId && (
                                            <div className={`px-2 py-1 rounded text-xs font-medium ${currentMeta?.is_active ? 'bg-lightGreen text-forestGreen' : 'bg-gray-100 text-gray-800'}`}>
                                                {currentMeta?.is_active ? 'Active' : 'Inactive'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* SEO & OG Sections */}
                                <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
                                    {/* SEO Section */}
                                    <div className="md:border-r md:border-gray-200 md:pr-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-base font-semibold text-gray-900">SEO Details</h3>
                                            <div className="md:hidden w-2 h-2 bg-leafGreen rounded-full"></div>
                                        </div>
                                        <div className="space-y-4">
                                            {/* SEO Image File Upload - Mobile Optimized */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    SEO Image
                                                </label>
                                                <div className="space-y-3">
                                                    <input
                                                        type="file"
                                                        name="seoImage"
                                                        ref={seoImageRef}
                                                        onChange={handleFileChange}
                                                        accept="image/*"
                                                        className="
                                                            block w-full text-sm text-gray-700
                                                            file:mr-4 file:px-3 file:py-2 file:border-0
                                                            file:bg-leafGreen file:text-white file:rounded-md
                                                            file:cursor-pointer
                                                            cursor-pointer border border-gray-300 rounded-lg
                                                            overflow-hidden text-ellipsis whitespace-nowrap
                                                            "
                                                    />

                                                    <div className="flex justify-center">
                                                        {formData.seoImage && typeof formData.seoImage === "object" ? (
                                                            <div className="relative">
                                                                <img
                                                                    src={URL.createObjectURL(formData.seoImage)}
                                                                    alt="SEO Preview"
                                                                    className="h-24 w-24 object-cover rounded-lg border-2 border-lightGreen"
                                                                />
                                                                <div className="absolute -top-1 -right-1 bg-leafGreen text-white text-xs px-1.5 py-0.5 rounded-full">
                                                                    New
                                                                </div>
                                                            </div>
                                                        ) : formData.seo_image ? (
                                                            <img
                                                                src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${formData.seo_image}`}
                                                                alt="SEO Image"
                                                                className="h-24 w-24 object-cover rounded-lg border"
                                                            />
                                                        ) : (
                                                            <div className="h-24 w-24 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                                                                <span className="text-xs text-gray-500 text-center px-2">No Image</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mobile Form Inputs - More Compact */}
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        SEO Image Alt Text
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="seo_alt"
                                                        value={formData.seo_alt}
                                                        onChange={handleInputChange}
                                                        placeholder="SEO image description"
                                                        required
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-colors"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        SEO Title
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="seo_title"
                                                        value={formData.seo_title}
                                                        onChange={handleInputChange}
                                                        placeholder="SEO title for search"
                                                        required
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-colors"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        SEO Keywords
                                                    </label>
                                                    <textarea
                                                        name="seo_keywords"
                                                        value={formData.seo_keywords}
                                                        onChange={handleInputChange}
                                                        placeholder="keywords, separated, by, commas"
                                                        rows={2}
                                                        required
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-colors resize-vertical"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        SEO Description
                                                    </label>
                                                    <textarea
                                                        name="seo_description"
                                                        value={formData.seo_description}
                                                        onChange={handleInputChange}
                                                        placeholder="SEO description for search results"
                                                        rows={3}
                                                        required
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-colors resize-vertical"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* OG Section */}
                                    <div className="md:pl-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-base font-semibold text-gray-900">OG Details</h3>
                                            <div className="md:hidden w-2 h-2 bg-leafGreen rounded-full"></div>
                                        </div>
                                        <div className="space-y-4">
                                            {/* OG Image File Upload - Mobile Optimized */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    OG Image
                                                </label>
                                                <div className="space-y-3">
                                                    <input
                                                        type="file"
                                                        name="ogImage"
                                                        ref={ogImageRef}
                                                        onChange={handleFileChange}
                                                        accept="image/*"
                                                        className="
                                                            block w-full text-sm text-gray-700
                                                            file:mr-4 file:px-3 file:py-2 file:border-0
                                                            file:bg-leafGreen file:text-white file:rounded-md
                                                            file:cursor-pointer
                                                            cursor-pointer border border-gray-300 rounded-lg
                                                            overflow-hidden text-ellipsis whitespace-nowrap
                                                            
                                                            "
                                                    />

                                                    <div className="flex justify-center">
                                                        {formData.ogImage && typeof formData.ogImage === "object" ? (
                                                            <div className="relative">
                                                                <img
                                                                    src={URL.createObjectURL(formData.ogImage)}
                                                                    alt="OG Preview"
                                                                    className="h-24 w-24 object-cover rounded-lg border-2 border-lightGreen"
                                                                />
                                                                <div className="absolute -top-1 -right-1 bg-leafGreen text-white text-xs px-1.5 py-0.5 rounded-full">
                                                                    New
                                                                </div>
                                                            </div>
                                                        ) : formData.og_image ? (
                                                            <img
                                                                src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${formData.og_image}`}
                                                                alt="OG Image"
                                                                className="h-24 w-24 object-cover rounded-lg border"
                                                            />
                                                        ) : (
                                                            <div className="h-24 w-24 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                                                                <span className="text-xs text-gray-500 text-center px-2">No Image</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mobile Form Inputs - More Compact */}
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        OG Image Alt Text
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="og_alt"
                                                        value={formData.og_alt}
                                                        onChange={handleInputChange}
                                                        placeholder="OG image description"
                                                        required
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-colors"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        OG Title
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="og_title"
                                                        value={formData.og_title}
                                                        onChange={handleInputChange}
                                                        placeholder="OG title for social sharing"
                                                        required
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-colors"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        OG Keywords
                                                    </label>
                                                    <textarea
                                                        name="og_keywords"
                                                        value={formData.og_keywords}
                                                        onChange={handleInputChange}
                                                        placeholder="keywords, separated, by, commas"
                                                        rows={2}
                                                        required
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-colors resize-vertical"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        OG Description
                                                    </label>
                                                    <textarea
                                                        name="og_description"
                                                        value={formData.og_description}
                                                        onChange={handleInputChange}
                                                        placeholder="OG description for social sharing"
                                                        rows={3}
                                                        required
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-colors resize-vertical"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Canonical URL - Mobile Optimized */}
                                <div className="pt-4 border-t border-gray-100">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Canonical URL
                                        </label>
                                        <div className="space-y-2">
                                            <input
                                                name="canonical_url"
                                                value={formData.canonical_url}
                                                onChange={handleInputChange}
                                                placeholder="https://example.com/canonical-url"
                                                type="url"
                                                required
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-colors"
                                            />
                                            <p className="text-xs text-gray-500">
                                                Helps search engines understand the preferred version of your page.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Save Button Sticky Bottom */}
                                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-gray-600">
                                            {editingId ? 'Editing existing SEO meta' : 'Creating new SEO meta'}
                                        </div>
                                        <PermissionWrapper section="SEO Meta" action={editingId ? "edit" : "create"}>
                                            <button
                                                type="submit"
                                                form="seoMetaForm"
                                                disabled={isSaving}
                                                className="bg-gradient-to-r from-forestGreen to-leafGreen hover:from-forestGreen/90 hover:to-leafGreen/90 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                        <span>Saving...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save size={16} />
                                                        <span>Save</span>
                                                    </>
                                                )}
                                            </button>
                                        </PermissionWrapper>
                                    </div>
                                </div>
                            </form>
                        </div>
                    // </PermissionWrapper>
                )}
            </div>
        </div>
    );
};

export default SeoMeta;