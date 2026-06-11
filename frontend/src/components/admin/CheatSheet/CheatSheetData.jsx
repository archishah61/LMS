/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateSectionMutation } from '../../../services/CheatSheet/cheatSheetContent/sectionApi';
import { useCreateMainSectionMutation, useGetMainSectionByIdQuery } from '../../../services/CheatSheet/cheatSheetContent/mainSectionApi';
import { getAdminToken } from "../../../services/CookieService";
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import CheatSheetDisplay from './CheatSheetDisplay';
import PermissionWrapper from '../../../context/PermissionWrapper';
import ErrorBoundary from '../../../components/common/ErrorBoundary';
import { toast } from "react-hot-toast";
import { ArrowLeft, Plus } from 'lucide-react';
import AdminLoader from '../AdminLoader';

export default function CheatSheetData() {
    const navigate = useNavigate();

    const [mainTitle, setMainTitle] = useState('');
    const [sections, setSections] = useState([{
        title: '',
        contentType: 'text',
        content: '',
        sectionImage: null
    }]);

    const handleReset = () => {
        setMainTitle('');
        setSections([{
            title: '',
            contentType: 'text',
            content: '',
            sectionImage: null
        }])
    }

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { access_token } = getAdminToken();
    const { id } = useSelector((state) => state.user);
    const { cheatsheetId } = useLocation().state;
    const [createMainSection] = useCreateMainSectionMutation();
    const [createSection] = useCreateSectionMutation();
    const { data: mainSection, isLoading, isError, refetch } = useGetMainSectionByIdQuery({ id: cheatsheetId, access_token });

    const addSection = () => {
        setSections([
            ...sections,
            {
                title: '',
                contentType: 'text',
                content: '',
                sectionImage: null
            }
        ]);
    };

    const updateSection = (index, updates) => {
        const newSections = [...sections];
        newSections[index] = { ...newSections[index], ...updates };
        setSections(newSections);
    };

    const removeSection = (index) => {
        const newSections = sections.filter((_, i) => i !== index);
        setSections(newSections);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const mainSectionData = {
            mainTitle: mainTitle,
            cheatsheetId: parseInt(cheatsheetId),
            createdBy: id,
            updatedBy: id
        };

        try {
            const mainSectionResponse = await createMainSection({
                mainSection: mainSectionData,
                access_token
            }).unwrap();

            const mainSectionId = mainSectionResponse.id;

            for (const section of sections) {
                const sectionData = {
                    mainSectionId,
                    title: section.title,
                    contentType: section.contentType,
                    content: section.contentType === 'text' ? section.content : '',
                    sectionImage: section.sectionImage,
                };

                const formData = new FormData();
                formData.append('mainSectionId', sectionData.mainSectionId);
                formData.append('title', sectionData.title);
                formData.append('contentType', sectionData.contentType);
                formData.append('content', sectionData.content);
                if (sectionData.sectionImage) {
                    formData.append('sectionImage', sectionData.sectionImage);
                }

                await createSection({
                    section: formData,
                    access_token
                }).unwrap();
            }

            // Clear form and close it
            handleReset();
            setIsFormOpen(false);

            // Show success message
            toast.success('Cheat sheet created successfully!');

            // Refetch the data to update the display
            await refetch();

        } catch (error) {
            console.error('Failed to create cheat sheet:', error);
            toast.error(error?.data?.error || 'Failed to create cheat sheet. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <AdminLoader className="h-screen" message="Loading cheat sheet details..." />;

        return (
            <div className="min-h-screen bg-slate-50 flex justify-center items-center">
                <div className="text-center space-y-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-leafGreen/30 border-t-blue-600 rounded-full mx-auto"
                    />
                    <p className="text-slate-600 font-medium">Loading cheat sheets...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header Section */}
            <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
                <div className="w-full p-4 sm:px-6">
                    {/* Mobile View Header */}
                    <div className="sm:hidden">
                        {/* Single Row - Title and Buttons */}
                        <div className="flex items-center justify-between relative">
                            <div className="flex-1"></div>
                            <h1 className="text-lg font-bold  text-forestGreen text-center absolute left-1/2 -translate-x-1/2">
                                Sheet Data
                            </h1>
                            <div className="flex items-center gap-2 flex-1 justify-end">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="flex items-center gap-1 p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                                >
                                    <ArrowLeft size={14} />
                                </button>

                                <PermissionWrapper section="Cheat Sheet Main Section" action="create">
                                    <button
                                        onClick={() => setIsFormOpen(!isFormOpen)}
                                        className="flex items-center gap-1 p-1.5  bg-leafGreen   text-white border border-gray-300 rounded-lg shadow-sm transition-colors font-medium"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </PermissionWrapper>
                            </div>
                        </div>
                    </div>

                    {/* Desktop View - Unchanged */}
                    <div className="hidden sm:block">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 mx-2">
                                <h1 className="text-xl text-center md:text-start md:text-2xl font-bold  text-forestGreen">
                                    Sheet Data <span className="hidden sm:inline">Manager</span>
                                </h1>
                                <p className="text-sm text-center md:text-start md:text-lg text-gray-600 mt-1">
                                    Manage <span className="hidden sm:inline">and organize your</span> learning materials
                                </p>
                            </div>

                            <div className="flex items-center gap-2 md:gap-4">
                                <PermissionWrapper section="Cheat Sheet Main Section" action="create">
                                    <button
                                        onClick={() => setIsFormOpen(!isFormOpen)}
                                        className=" bg-leafGreen   text-white sm:px-4 p-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
                                    >
                                        <Plus size={18} />
                                        <span className="hidden sm:inline">Create <span className="hidden md:inline">New</span></span>
                                    </button>
                                </PermissionWrapper>
                                <button
                                    onClick={() => navigate(-1)}
                                    className="flex border items-center gap-2 sm:px-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ArrowLeft size={18} />
                                    <span className="hidden sm:inline">Back</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full flex-1 overflow-y-auto p-4 sm:px-6">
                <AnimatePresence>
                    {isFormOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl overflow-hidden w-full max-w-4xl mx-auto shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[90vh]">

                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                                        Create New Cheat Sheet
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setIsFormOpen(false);
                                                handleReset();
                                            }}
                                            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <form encType="multipart/form-data" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" id="createCheatSheetForm">
                                            {/* Main Title Section */}
                                            <div className="space-y-2 sm:space-y-3">
                                                <label htmlFor="mainTitle" className="block text-sm font-semibold text-slate-900">
                                                    Main Section Title
                                                </label>
                                                <input
                                                    type="text"
                                                    id="mainTitle"
                                                    value={mainTitle}
                                                    onChange={(e) => setMainTitle(e.target.value)}
                                                    placeholder="e.g., JavaScript Fundamentals, React Hooks Guide..."
                                                    required
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                                                />
                                            </div>

                                            {/* Sections Container */}
                                            <div className="space-y-4 sm:space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-base sm:text-lg font-semibold text-slate-900">Content Sections</h3>
                                                    {sections.length > 0 && (
                                                        <span className="text-xs sm:text-sm text-slate-500 bg-slate-100 px-2 sm:px-3 py-1 rounded-full">
                                                            {sections.length} section{sections.length !== 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>

                                                <AnimatePresence>
                                                    {sections.length === 0 ? (
                                                        <motion.div
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            className="text-center py-8 sm:py-12 bg-slate-50 rounded-lg sm:rounded-xl border-2 border-dashed border-slate-200"
                                                        >
                                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                            </div>
                                                            <p className="text-slate-600 font-medium mb-1 sm:mb-2 text-sm sm:text-base">No sections added yet</p>
                                                            <p className="text-slate-400 text-xs sm:text-sm">Click "Add Section" to start building</p>
                                                        </motion.div>
                                                    ) : (
                                                        <div className="grid gap-3 sm:gap-4">
                                                            {sections.map((section, index) => (
                                                                <motion.div
                                                                    key={index}
                                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                                    transition={{ duration: 0.2 }}
                                                                    className="bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl p-3 sm:p-4 relative"
                                                                >
                                                                    {/* Section Header */}
                                                                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                                                                        <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                                                                            <span className="w-5 h-5 sm:w-6 sm:h-6 bg-lightGreen text-forestGreen rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                                                                                {index + 1}
                                                                            </span>
                                                                            Section {index + 1}
                                                                        </h4>
                                                                        <motion.button
                                                                            whileHover={{ scale: 1.1 }}
                                                                            whileTap={{ scale: 0.9 }}
                                                                            type="button"
                                                                            onClick={() => removeSection(index)}
                                                                            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                                        >
                                                                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                            </svg>
                                                                        </motion.button>
                                                                    </div>

                                                                    {/* Section Fields */}
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                                        <div className="space-y-2 sm:space-y-3">
                                                                            <label className="block text-xs sm:text-sm font-semibold text-slate-900">
                                                                                Section Title
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                value={section.title}
                                                                                onChange={(e) => updateSection(index, { title: e.target.value })}
                                                                                placeholder="Enter section title..."
                                                                                required
                                                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all duration-200 text-sm"
                                                                            />
                                                                        </div>

                                                                        <div className="space-y-2 sm:space-y-3">
                                                                            <label className="block text-xs sm:text-sm font-semibold text-slate-900">
                                                                                Content Type
                                                                            </label>
                                                                            <select
                                                                                value={section.contentType}
                                                                                onChange={(e) => updateSection(index, {
                                                                                    contentType: e.target.value,
                                                                                    content: '',
                                                                                    sectionImage: null
                                                                                })}
                                                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all duration-200 text-sm"
                                                                            >
                                                                                <option value="text">📝 Text Content</option>
                                                                                <option value="image">🖼️ Image Upload</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>

                                                                    {/* Content Input */}
                                                                    <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                                                                        {section.contentType === 'text' ? (
                                                                            <>
                                                                                <label className="block text-xs sm:text-sm font-semibold text-slate-900">
                                                                                    Content
                                                                                </label>
                                                                                <textarea
                                                                                    value={section.content}
                                                                                    onChange={(e) => updateSection(index, { content: e.target.value })}
                                                                                    placeholder="Enter your content here..."
                                                                                    required
                                                                                    rows={3}
                                                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all duration-200 resize-none text-sm"
                                                                                />
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <label className="block text-xs sm:text-sm font-semibold text-slate-900">
                                                                                    Upload Image
                                                                                </label>
                                                                                <div className="relative">
                                                                                    <input
                                                                                        type="file"
                                                                                        accept="image/*"
                                                                                        onChange={(e) => {
                                                                                            const file = e.target.files[0];
                                                                                            updateSection(index, { sectionImage: file });
                                                                                        }}
                                                                                        required
                                                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-lightGreen file:text-forestGreen hover:file:bg-lightGreen focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all duration-200 text-xs sm:text-sm"
                                                                                    />
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </form>
                                    </motion.div>
                                </div>

                                {/* Footer Buttons */}
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3 p-3 sm:p-4 border-t bg-white sticky bottom-0">
                                    {/* Add Section button - Full width on mobile */}
                                    <PermissionWrapper section="Cheat Sheet Section" action="create">
                                        <button
                                            type="button"
                                            onClick={addSection}
                                            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 text-sm font-medium text-white  bg-leafGreen   rounded-lg transition-all duration-200 flex items-center gap-2 justify-center"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add Section
                                        </button>
                                    </PermissionWrapper>

                                    {/* Cancel and Create buttons */}
                                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsFormOpen(false);
                                                handleReset();
                                            }}
                                            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                                        >
                                            Cancel
                                        </button>
                                        <PermissionWrapper section="Cheat Sheet Section" action="create">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="submit"
                                                form="createCheatSheetForm"
                                                disabled={sections.length === 0 || isSubmitting}
                                                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 text-sm font-medium text-white  bg-leafGreen   rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center min-w-[120px] sm:min-w-[140px]"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                                        />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Create
                                                    </>
                                                )}
                                            </motion.button>
                                        </PermissionWrapper>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Display Existing Cheat Sheets */}
                <PermissionWrapper section="Cheat Sheet Main Section" action="view">
                    <ErrorBoundary>
                        <CheatSheetDisplay
                            cheatSheets={mainSection}
                            title={mainTitle}
                            onRefresh={refetch}  // Pass refetch as a prop to CheatSheetDisplay
                        />
                    </ErrorBoundary>
                </PermissionWrapper>
            </div>
        </div>
    );
}