/* eslint-disable no-unused-vars */
"use client";
import { useState, useMemo, useEffect } from "react";
import { useGetMainSectionByIdQuery } from "../../services/CheatSheet/cheatSheetContent/mainSectionApi";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, BookOpen, Copy, Layers, Code, Image } from 'lucide-react';
import { useGetCheatSheetByIdQuery } from "../../services/CheatSheet/cheatSheetApi";
import { getStudentToken } from "../../services/CookieService";
import ErrorBoundary from "../../components/common/ErrorBoundary";
import SupportModal from "../../components/modal/SupportModal";
import PrimaryLoader from "../../components/ui/PrimaryLoader";

import { toast } from "react-hot-toast";

export default function StudentCheatSheetDisplay() {
  return (
    <ErrorBoundary showDetails={false}>
      <StudentCheatSheetDisplayContent />
    </ErrorBoundary>
  );
}

function StudentCheatSheetDisplayContent() {
  const { access_token } = getStudentToken();

  const { sheetId } = useLocation().state;
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, isError, error, isFetching } = useGetMainSectionByIdQuery({
    id: sheetId,
    search_term: debouncedSearchQuery,
    access_token
  });

  const { data: cheatSheets, isError: isCheatSheetError, error: cheatSheetError } = useGetCheatSheetByIdQuery(sheetId, {
    skip: !sheetId
  });

  const [copiedSectionId, setCopiedSectionId] = useState(null);
  const [isSupportModalOpen, setSupportModalOpen] = useState(false);

  const copyContent = async (content, sectionId, section) => {
    try {
      if (section.contentType === "image") {
        const imageUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${section.sectionImage || "/assets/placeholder2.png"
          }`;

        const response = await fetch(imageUrl);
        const blob = await response.blob();

        // Convert any image type to PNG
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = URL.createObjectURL(blob);

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const pngBlob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/png")
        );

        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": pngBlob,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(content);
      }

      setCopiedSectionId(sectionId);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedSectionId(null), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Copy failed");
    }
  };

  const filteredCheatSheets = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    // Filter only active main sections
    const activeSheets = data.filter((sheet) => sheet.status === "active");

    // Since filtering is done on backend, we just map and return valid sheets
    return activeSheets
      .map((sheet) => ({
        ...sheet,
        Sections: sheet.Sections && Array.isArray(sheet.Sections)
          ? sheet.Sections
          : [],
      }))
      .filter((sheet) => sheet.Sections && sheet.Sections.length > 0);
  }, [data]);

  if (isLoading) {
    return <PrimaryLoader />;
  }

  if (isError || isCheatSheetError || !data || !Array.isArray(data) || data.length === 0 || !cheatSheets) {
    let errorMessage = "An unexpected error occurred while loading the cheat sheet";
    let errorTitle = "Loading Error";
    if (isError && error) {
      errorMessage = error.data?.error || (error.status === 404 ? "Cheat sheet content not found" : "Unable to load the requested cheat sheet content");
      errorTitle = error.status === 404 ? "Content Not Found" : "Cheat Sheet Content Error";
    } else if (isCheatSheetError && cheatSheetError) {
      errorMessage = cheatSheetError.data?.error || (cheatSheetError.status === 404 ? "Cheat sheet not found" : "Unable to load the requested cheat sheet");
      errorTitle = cheatSheetError.status === 404 ? "Cheat Sheet Not Found" : "Cheat Sheet Loading Error";
    } else if (!data || !Array.isArray(data) || data.length === 0) {
      errorMessage = "No content available for this cheat sheet";
      errorTitle = "Content Not Available";
    }
    return (
      <motion.div
        className="flex flex-col justify-center items-center h-screen p-3 sm:p-4 text-center bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <BookOpen className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-400 mb-3 sm:mb-4" />
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-forestGreen mb-2 sm:mb-3 md:mb-4">
          {errorTitle}
        </h2>
        <p className="text-gray-600 mb-3 sm:mb-4 font-medium text-sm sm:text-base">
          {errorMessage}
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Go Back
        </button>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-3 sm:px-4 md:px-5 lg:px-8 py-4 sm:py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 sm:mb-6 md:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-forestGreen break-words">
              {cheatSheets?.title || "Cheat Sheet"}
            </h1>

            {/* Support Button */}
            <button
              onClick={() => setSupportModalOpen(true)}
              className="text-xs sm:text-sm text-leafGreen hover:underline self-end sm:self-auto"
            >
              Need help?
            </button>
          </div>
          <div className="relative mt-2 sm:mt-3 md:mt-4">
            <input
              type="text"
              placeholder="Search cheat sheets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2.5 sm:p-3 pl-8 sm:pl-10 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-0 focus:border-gray-300 text-sm sm:text-base"
            />
            <Search className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3.5 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </motion.div>

        <div className="relative min-h-[150px] sm:min-h-[200px]">
          {/* Loading Overlay */}
          {isFetching && !isLoading && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-start justify-center pt-12 sm:pt-16 md:pt-20">
              <motion.div
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border-3 sm:border-4 border-leafGreen border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          )}

          {filteredCheatSheets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {filteredCheatSheets.map((sheet) => (
                <motion.div
                  key={sheet.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 transition-all duration-200"
                >
                  <div className="px-4 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5 border-b border-gray-100">
                    <h2 className="text-lg sm:text-xl font-bold text-forestGreen break-words">{sheet.mainTitle}</h2>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                      <div className="flex items-center gap-1 sm:gap-2 px-2 py-0.5 sm:px-3 sm:py-1 bg-sand text-secondaryForestGreen rounded-full text-xs font-medium">
                        <Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span className="text-xs">{sheet.Sections.length} sections</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 md:p-6">
                    <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
                      {sheet.Sections.map((section) => (
                        <motion.div
                          key={section.id}
                          className="bg-gray-50 rounded-lg sm:rounded-xl border border-gray-100 transition-all"
                        >
                          <div className="p-2.5 sm:p-3 md:p-4">
                            <div className="flex items-start justify-between mb-2 sm:mb-3">
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <div className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0 ${section.contentType === "image" ? "bg-sand text-forestGreen" : "bg-sand text-leafGreen"
                                  }`}>
                                  {section.contentType === "image" ?
                                    <Image className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" /> :
                                    <Code className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                                  }
                                </div>
                                <h3 className="font-semibold text-forestGreen text-sm sm:text-base truncate" title={section.title}>
                                  {section.title}
                                </h3>
                              </div>
                              <button
                                onClick={() => copyContent(section.content, section.id, section)}
                                className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md transition-all flex-shrink-0 ml-1"
                                title={section.contentType === "image" ? "Copy image" : "Copy text"}
                              >
                                <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </button>
                            </div>
                            {section.contentType === "image" ? (
                              <div className="bg-white rounded-md sm:rounded-lg p-2 sm:p-3 border border-gray-200">
                                <img
                                  src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${section.sectionImage || "/placeholder.png"}`}
                                  alt={section.title}
                                  className="w-full h-auto rounded"
                                  loading="lazy"
                                />
                              </div>
                            ) : (
                              <div className="bg-white rounded-md sm:rounded-lg p-2 sm:p-3 border border-gray-200">
                                <pre className="text-xs sm:text-sm text-gray-700 font-mono whitespace-pre-wrap break-words leading-relaxed overflow-x-auto">
                                  {section.content}
                                </pre>
                              </div>
                            )}
                            {copiedSectionId === section.id && (
                              <div className="absolute top-1 right-1 bg-leafGreen text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs">
                                Copied!
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-500 mt-4 sm:mt-6 md:mt-8 text-sm sm:text-base"
            >
              No active cheat sheets found{searchQuery && ` for "${searchQuery}"`}
            </motion.div>
          )}
        </div>
      </div>

      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        defaultCategory={'Content'}
        relatedId={cheatSheets?.id}
        relatedName={cheatSheets?.title}
        defaultRelatedType={'cheatsheet'}
      />
    </div>
  );
}