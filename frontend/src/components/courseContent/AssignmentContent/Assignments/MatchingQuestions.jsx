"use client"

import { Info } from "lucide-react"
import { FaLink } from "react-icons/fa"
import { useEffect, useState, useRef, useCallback } from "react"

const MatchingQuestions = ({
  assignmentData,
  matchingAnswers,
  setMatchingAnswers,
  matchingSubmitted,
  matchingScores,
}) => {
  const [randomizedMatches, setRandomizedMatches] = useState({})
  const [showPreview, setShowPreview] = useState(false)
  const [localAnswers, setLocalAnswers] = useState({})
  const [selectedItem, setSelectedItem] = useState(null)
  const [connections, setConnections] = useState({})
  const currentAssignmentId = assignmentData?.id

  const updateAnswers = useCallback(
    (questionId, updatedConnections) => {
      const question = assignmentData.MatchingQuestions.find((q) => q.id.toString() == questionId)
      if (!question || !randomizedMatches[question.id]) return

      const updatedAnswers = { ...matchingAnswers }
      const updatedLocalAnswers = { ...localAnswers }

      // Initialize if needed
      if (!updatedAnswers[questionId]) updatedAnswers[questionId] = {}
      if (!updatedLocalAnswers[questionId]) updatedLocalAnswers[questionId] = {}

      // Clear existing answers for this question
      updatedAnswers[questionId] = {}
      updatedLocalAnswers[questionId] = {}

      // Rebuild answers from connections
      Object.entries(updatedConnections[questionId] || {}).forEach(([itemIndex, matchIndex]) => {
        const optionText = question.MatchingOptions[itemIndex]?.option_text
        const matchText = randomizedMatches[question.id][matchIndex]?.match_text

        if (optionText && matchText) {
          updatedAnswers[questionId][optionText] = matchText
          updatedLocalAnswers[questionId][optionText] = matchText
        }
      })

      setMatchingAnswers(updatedAnswers)
      setLocalAnswers(updatedLocalAnswers)
    },
    [assignmentData.MatchingQuestions, matchingAnswers, localAnswers, randomizedMatches, setMatchingAnswers],
  )

  const handleItemClick = useCallback(
    (questionId, itemIndex, itemText) => {
      const isConnected = connections[questionId]?.[itemIndex] !== undefined

      if (isConnected) {
        // Remove connection - this frees both the item and its match
        const updatedConnections = { ...connections }
        if (!updatedConnections[questionId]) updatedConnections[questionId] = {}

        delete updatedConnections[questionId][itemIndex]

        setConnections(updatedConnections)
        updateAnswers(questionId, updatedConnections)
        setSelectedItem(null)
      } else if (selectedItem?.questionId === questionId && selectedItem?.itemIndex === itemIndex) {
        // Deselect if clicking the same item
        setSelectedItem(null)
      } else {
        // Select the item
        setSelectedItem({ questionId, itemIndex, itemText })
      }
    },
    [connections, selectedItem, updateAnswers],
  )

  const handleMatchClick = useCallback(
    (questionId, matchIndex, matchText) => {
      // Check if this match is already connected
      const isConnected = Object.values(connections[questionId] || {}).includes(matchIndex)

      if (isConnected) {
        // Disabled: Cannot modify connected items
        return
      }

      if (!selectedItem || selectedItem.questionId !== questionId) return

      const updatedConnections = { ...connections }

      // Initialize if needed
      if (!updatedConnections[questionId]) updatedConnections[questionId] = {}

      // Check if this match is already connected to another item
      const existingConnection = Object.entries(updatedConnections[questionId]).find(
        ([_, connectedMatchIndex]) => connectedMatchIndex === matchIndex,
      )

      if (existingConnection) {
        // Remove existing connection (this frees the previous item)
        const [existingItemIndex] = existingConnection
        delete updatedConnections[questionId][existingItemIndex]
      }

      // Check if selected item already has a connection
      if (updatedConnections[questionId][selectedItem.itemIndex] !== undefined) {
        // Remove existing connection for this item (this frees the previously connected match)
        delete updatedConnections[questionId][selectedItem.itemIndex]
      }

      // Add new connection
      updatedConnections[questionId][selectedItem.itemIndex] = matchIndex

      setConnections(updatedConnections)
      updateAnswers(questionId, updatedConnections)
      setSelectedItem(null)
    },
    [connections, selectedItem, updateAnswers],
  )

  useEffect(() => {
    if (assignmentData.MatchingQuestions && assignmentData.MatchingQuestions.length > 0) {
      // Only randomize if we don't already have randomized matches for this assignment
      const needsRandomization = assignmentData.MatchingQuestions.some((question) => !randomizedMatches[question.id])

      if (needsRandomization) {
        const randomized = { ...randomizedMatches }
        assignmentData.MatchingQuestions.forEach((question) => {
          if (question.MatchingOptions && question.MatchingOptions.length > 0 && !randomized[question.id]) {
            const shuffled = [...question.MatchingOptions].sort(() => Math.random() - 0.5)
            randomized[question.id] = shuffled
          }
        })
        setRandomizedMatches(randomized)
      }
    }
  }, [assignmentData, randomizedMatches])

  useEffect(() => {
    setLocalAnswers({})
    setConnections({})
    setSelectedItem(null) // Clear selection when assignment changes

    if (currentAssignmentId && matchingAnswers) {
      const filteredAnswers = {}
      const validQuestionIds = new Set(assignmentData.MatchingQuestions?.map((q) => q.id) || [])

      Object.keys(matchingAnswers).forEach((questionId) => {
        if (validQuestionIds.has(Number.parseInt(questionId)) || validQuestionIds.has(questionId)) {
          filteredAnswers[questionId] = matchingAnswers[questionId]
        }
      })

      setLocalAnswers(filteredAnswers)

      // Convert answers to connections format
      const newConnections = {}
      Object.keys(filteredAnswers).forEach((questionId) => {
        newConnections[questionId] = {}
        Object.entries(filteredAnswers[questionId] || {}).forEach(([optionText, matchText]) => {
          // Find the indices for visual representation
          const question = assignmentData.MatchingQuestions.find((q) => q.id.toString() === questionId)
          if (question && randomizedMatches[question.id]) {
            const optionIndex = question.MatchingOptions.findIndex((opt) => opt.option_text === optionText)
            const matchIndex = randomizedMatches[question.id].findIndex((opt) => opt.match_text === matchText)
            if (optionIndex !== -1 && matchIndex !== -1) {
              newConnections[questionId][optionIndex] = matchIndex
            }
          }
        })
      })
      setConnections(newConnections)
    }
  }, [currentAssignmentId, matchingAnswers, assignmentData.MatchingQuestions, randomizedMatches])

  const renderFilePreview = () => {
    if (!assignmentData.file) return null;
    const fileName = assignmentData.file.split("/").pop();
    const fileExtension = fileName.split(".").pop().toLowerCase();
    const fileUrl = assignmentData.file;

    if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(fileExtension)) {
      return (
        <div className="border-2 border-dashed border-gray-200 rounded-lg xs:rounded-xl sm:rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50 w-full max-w-full">
          <div className="p-2 xs:p-2.5 sm:p-3">
            <div className="relative w-full max-w-full mx-auto overflow-hidden">
              <img
                src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${fileUrl || "/placeholder.png"}`}
                alt="Assignment preview"
                className="w-full h-auto max-h-32 xs:max-h-40 sm:max-h-48 md:max-h-56 object-contain rounded-lg xs:rounded-xl shadow-lg border border-gray-200/50 mx-auto"
                style={{ maxWidth: '100%', width: 'auto', height: 'auto' }}
                loading="lazy"
              />
              <div className="absolute inset-0 rounded-lg xs:rounded-xl bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>
      );
    }

    if (fileExtension === "pdf") {
      return (
        <div className="border-2 border-dashed border-gray-200 rounded-lg xs:rounded-xl sm:rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50 w-full max-w-full">
          <div className="p-2 xs:p-2.5 sm:p-3">
            <div className="relative w-full overflow-hidden" style={{ paddingBottom: '50%' }}>
              <iframe
                src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${fileUrl}#view=FitH`}
                title="PDF Preview"
                className="absolute top-0 left-0 w-full h-full border-none rounded-lg xs:rounded-xl shadow-lg"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      );
    }

    if (["txt", "md", "html", "css", "js", "jsx", "json", "xml", "yaml", "yml"].includes(fileExtension)) {
      return (
        <div className="border-2 border-dashed border-gray-200 rounded-lg xs:rounded-xl sm:rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50 w-full max-w-full">
          <div className="p-2 xs:p-2.5 sm:p-3">
            <div className="bg-white rounded-lg xs:rounded-xl shadow-sm border border-gray-200/50 p-2 xs:p-2.5 sm:p-3 md:p-4 w-full max-w-full overflow-x-auto">
              <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2 mb-1 xs:mb-1.5 sm:mb-2 md:mb-3">
                <div className="w-3 h-3 xs:w-3 xs:h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-1.5 h-1.5 xs:w-1.5 xs:h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium text-xs xs:text-xs sm:text-sm md:text-base">Text File Preview</p>
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-1.5 xs:p-2 sm:p-2.5 md:p-3 rounded-lg border border-gray-200/50 w-full">
                <p className="text-gray-600 text-xs xs:text-xs sm:text-sm md:text-base break-words leading-relaxed">
                  Content preview requires API implementation.
                </p>
                <p className="text-gray-600 mt-1 xs:mt-1.5 text-xs xs:text-xs sm:text-sm md:text-base break-words leading-relaxed">
                  The complete file can be viewed after download.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="border-2 border-dashed border-gray-200 rounded-lg xs:rounded-xl sm:rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50 w-full max-w-full">
        <div className="p-2 xs:p-2.5 sm:p-3 md:p-4">
          <div className="flex items-center justify-center p-3 xs:p-3.5 sm:p-4 md:p-5 bg-gradient-to-br from-amber-50 to-yellow-100 rounded-lg xs:rounded-xl border border-amber-200/50 w-full">
            <div className="text-center max-w-full">
              <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-br from-amber-100 to-yellow-200 rounded-lg xs:rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1 xs:mb-1.5 sm:mb-2 md:mb-3 shadow-sm">
                <svg className="w-3 h-3 xs:w-3 xs:h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-amber-800 font-semibold text-xs xs:text-sm sm:text-sm md:text-base break-words">
                Preview not available
              </p>
              <p className="text-amber-700 mt-0.5 xs:mt-1 sm:mt-1.5 text-[10px] xs:text-xs sm:text-xs md:text-sm break-words max-w-[200px] xs:max-w-[250px] sm:max-w-[300px] mx-auto">
                File type ({fileExtension}) cannot be previewed. Please download to view.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getFileIcon = (fileExtension) => {
    const iconClasses = "w-12 h-12 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0";
    const iconSizes = "w-6 h-6 sm:w-6 sm:h-6 md:w-7 md:h-7";

    switch (fileExtension) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "svg":
        return (
          <div className={`${iconClasses} bg-gradient-to-br from-blue-50 to-indigo-100`}>
            <svg className={`${iconSizes} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case "pdf":
        return (
          <div className={`${iconClasses} bg-gradient-to-br from-red-50 to-pink-100`}>
            <svg className={`${iconSizes} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case "doc":
      case "docx":
        return (
          <div className={`${iconClasses} bg-gradient-to-br from-blue-50 to-cyan-100`}>
            <svg className={`${iconSizes} text-blue-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case "xls":
      case "xlsx":
        return (
          <div className={`${iconClasses} bg-gradient-to-br from-green-50 to-emerald-100`}>
            <svg className={`${iconSizes} text-green-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className={`${iconClasses} bg-gradient-to-br from-gray-50 to-slate-100`}>
            <svg className={`${iconSizes} text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.585a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </div>
        );
    }
  };

  if (!assignmentData.MatchingQuestions || assignmentData.MatchingQuestions.length === 0) {
    return null
  }

  return (
    <div className="mt-4 sm:mt-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <FaLink className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800 flex-shrink-0" />
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 break-words">Matching Questions</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="px-2 sm:px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs sm:text-sm font-medium text-slate-600 whitespace-nowrap">
            Marks: {assignmentData.max_score}
          </div>
          <div className="px-2 sm:px-3 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-xs sm:text-sm font-medium text-emerald-700 whitespace-nowrap">
            Passing: {assignmentData.passing_score}
          </div>
        </div>
      </div>

      {assignmentData.file && (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden mb-4 sm:mb-6 w-full">
          <div className="p-3 xs:p-4 sm:p-4 md:p-4 w-full">
            <div className="flex items-start gap-2 xs:gap-3 sm:gap-3 md:gap-5 mb-3 xs:mb-4 sm:mb-4 md:mb-6 w-full">
              {getFileIcon(assignmentData.file.split(".").pop().toLowerCase())}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col xs:flex-row xs:items-start sm:items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-3">
                  <span className="text-gray-900 font-bold text-sm xs:text-base sm:text-base md:text-xl break-all xs:break-all sm:truncate max-w-full leading-tight xs:leading-snug sm:leading-normal">
                    {assignmentData.file.split("/").pop()}
                  </span>
                  <span className="inline-flex items-center px-1.5 xs:px-2 sm:px-2 md:px-3 py-0.5 rounded-full text-[10px] xs:text-xs font-medium bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200/50 w-fit flex-shrink-0">
                    {assignmentData.file.split(".").pop().toLowerCase().toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-500 text-[10px] xs:text-xs sm:text-xs md:text-sm mt-0.5 xs:mt-1 sm:mt-1 truncate max-w-full">
                  Reference material for the questions below
                </p>
              </div>
            </div>

            <div className="flex flex-col xs:flex-row gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 w-full">
              <a
                href={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${assignmentData.file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-3 xs:px-3.5 sm:px-3 md:px-4 py-2.5 xs:py-2.5 sm:py-2 bg-forestGreen text-white rounded-lg hover:bg-leafGreen transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:ring-offset-2 shadow-lg hover:shadow-xl text-xs xs:text-sm sm:text-sm md:text-base flex-1 xs:flex-none min-w-0 group"
              >
                <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 xs:mr-2 sm:mr-2 flex-shrink-0 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="truncate font-medium text-[11px] xs:text-xs sm:text-sm md:text-base">
                  Download File
                </span>
              </a>

              <button
                className="inline-flex items-center justify-center px-3 xs:px-3.5 sm:px-3 md:px-4 py-2.5 xs:py-2.5 sm:py-2 bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 rounded-lg hover:from-gray-200 hover:to-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 shadow-sm hover:shadow-md text-xs xs:text-sm sm:text-sm md:text-base border border-gray-200/50 flex-1 xs:flex-none min-w-0 group"
                onClick={() => setShowPreview(!showPreview)}
              >
                <svg
                  className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 xs:mr-2 sm:mr-2 flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ transform: showPreview ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="truncate font-medium text-[11px] xs:text-xs sm:text-sm md:text-base">
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </span>
              </button>
            </div>
          </div>

          {showPreview && (
            <div className="border-t border-gray-200/50 bg-gradient-to-br from-gray-50/50 to-slate-50/50">
              <div className="p-3 xs:p-3.5 sm:p-4 w-full">
                {renderFilePreview()}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-6 sm:space-y-8 md:space-y-10 pt-4">
        {assignmentData.MatchingQuestions.map((question, qIndex) => (
          <div key={question.id} className="pb-6 sm:pb-8 md:pb-10 border-b border-gray-100 last:border-0">
            <div className="flex items-start mb-4 sm:mb-6">
              <span className="flex-shrink-0 font-bold text-base sm:text-lg md:text-xl text-gray-800 mr-2 sm:mr-3 mt-0.5">
                {qIndex + 1}.
              </span>
              <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-900 font-medium">
                {question.question}
              </p>
            </div>

            <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-8">
              {/* Items Column */}
              <div>
                <h4 className="font-bold text-gray-500 mb-3 text-xs sm:text-sm uppercase tracking-wider">Items</h4>
                <div className="space-y-2 sm:space-y-3">
                  {question.MatchingOptions?.map((option, index) => {
                    const isSelected = selectedItem?.questionId === question.id && selectedItem?.itemIndex === index
                    const isConnected = connections[question.id]?.[index] !== undefined
                    const connectedMatch = connections[question.id]?.[index]

                    return (
                      <div
                        key={option.id}
                        onClick={() => handleItemClick(question.id, index, option.option_text)}
                        className={`
                          flex items-center p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-200
                          ${isSelected
                            ? "border-slate-800 bg-slate-50 shadow-md ring-2 ring-slate-100"
                            : isConnected
                              ? "border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50 hover:border-emerald-200"
                              : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm"
                          }
                          cursor-pointer group
                        `}
                      >
                        <span className="font-bold text-gray-400 mr-2 sm:mr-3 text-xs sm:text-sm">{index + 1}.</span>
                        <div className="flex-1 min-w-0">
                          {option.option_type === "image" ? (
                            <img
                              src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${option.option_text || "/placeholder.png"}`}
                              alt={`Option ${index + 1}`}
                              className="h-10 w-10 sm:h-12 sm:w-12 object-cover rounded-lg shadow-sm group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <span className="text-gray-700 text-sm sm:text-base break-words font-medium">{option.option_text}</span>
                          )}
                        </div>
                        {isConnected && (
                          <div className="flex items-center ml-2 bg-emerald-500 text-white px-1.5 sm:px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold shadow-sm">
                            <span className="mr-0.5">→</span> {String.fromCharCode(65 + connectedMatch)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Matches Column */}
              <div className="mt-2 md:mt-0">
                <h4 className="font-bold text-gray-500 mb-3 text-xs sm:text-sm uppercase tracking-wider">Matches</h4>
                <div className="space-y-2 sm:space-y-3">
                  {randomizedMatches[question.id]?.map((option, index) => {
                    const isConnected = Object.values(connections[question.id] || {}).includes(index)
                    const canConnect = selectedItem?.questionId === question.id
                    const isHighlighted = canConnect && !isConnected

                    return (
                      <div
                        key={option.id}
                        onClick={() => handleMatchClick(question.id, index, option.match_text)}
                        className={`
                          flex items-center p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-200
                          ${isHighlighted
                            ? "cursor-pointer border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-400 hover:shadow-md animate-pulse-subtle"
                            : isConnected
                              ? "cursor-not-allowed border-gray-100 bg-gray-50/50 opacity-50 grayscale"
                              : "cursor-not-allowed border-gray-100 bg-gray-50/30 opacity-70"
                          }
                        `}
                      >
                        <span className="font-bold text-gray-400 mr-2 sm:mr-3 text-xs sm:text-sm">{String.fromCharCode(65 + index)}.</span>
                        <div className="flex-1 min-w-0">
                          {option.match_type === "image" ? (
                            <img
                              src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${option.match_text || "/placeholder.png"}`}
                              alt={`Match ${String.fromCharCode(65 + index)}`}
                              className="h-10 w-10 sm:h-12 sm:w-12 object-cover rounded-lg shadow-sm"
                            />
                          ) : (
                            <span className="text-gray-700 text-sm sm:text-base break-words font-medium">{option.match_text}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Selection Status & Progress - Responsive */}
            {(selectedItem?.questionId === question.id || Object.keys(connections[question.id] || {}).length > 0) && (
              <div className="mt-4 sm:mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    {selectedItem?.questionId === question.id ? (
                      <div className="flex items-center gap-2 text-blue-600 animate-bounce-horizontal">
                        <Info className="w-4 h-4" />
                        <span className="text-xs sm:text-sm font-bold uppercase tracking-wide">
                          Connecting Item {selectedItem.itemIndex + 1}...
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide">
                        Progress: {Object.keys(connections[question.id] || {}).length} / {question.MatchingOptions?.length} matched
                      </div>
                    )}
                  </div>

                  {Object.keys(connections[question.id] || {}).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {Object.entries(connections[question.id] || {}).sort((a, b) => a[0] - b[0]).map(([itemIndex, matchIndex]) => (
                        <div
                          key={`${itemIndex}-${matchIndex}`}
                          className="flex items-center px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] sm:text-xs font-bold text-slate-700 shadow-sm"
                        >
                          <span className="text-gray-400">{Number.parseInt(itemIndex) + 1}</span>
                          <span className="mx-1 text-blue-500">→</span>
                          <span className="text-slate-900">{String.fromCharCode(65 + matchIndex)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Feedback Section - Responsive */}
            {matchingSubmitted && matchingScores[question.id] && (
              <div className={`mt-6 sm:mt-8 p-4 sm:p-6 rounded-2xl border-2 transition-all duration-300 ${matchingScores[question.id].correctMatches === matchingScores[question.id].totalMatches
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
                }`}>
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 items-start">
                  <div className="w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-sm ${matchingScores[question.id].correctMatches === matchingScores[question.id].totalMatches
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-700 text-white'
                        }`}>
                        {matchingScores[question.id].correctMatches === matchingScores[question.id].totalMatches ? (
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <FaLink className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Results Analysis</h4>
                        <p className="text-xs sm:text-sm text-gray-500 font-medium">
                          Score: <span className="text-gray-900 font-bold">{matchingScores[question.id].correctMatches} / {matchingScores[question.id].totalMatches}</span>
                        </p>
                      </div>
                    </div>
                    {matchingScores[question.id].correctMatches === matchingScores[question.id].totalMatches ? (
                      <div className="inline-flex items-center px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold shadow-sm animate-pulse">
                        🎉 PERFECT SCORE
                      </div>
                    ) : (
                      <div className="text-xs sm:text-sm text-gray-600 bg-white/50 p-3 rounded-xl border border-gray-100 font-medium leading-relaxed">
                        Some items were incorrectly matched. Review the correct pairings on the right.
                      </div>
                    )}
                  </div>

                  <div className="w-full bg-white/60 p-4 sm:p-5 rounded-xl border border-white shadow-inner">
                    <h5 className="font-bold text-gray-900 mb-3 text-xs sm:text-sm uppercase tracking-wider">Final Correct Key:</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(matchingScores[question.id].correctAnswers || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                          <span className="text-[10px] sm:text-xs font-bold text-gray-500 truncate mr-1 max-w-[60px]">{key}</span>
                          <span className="text-[10px] sm:text-xs font-bold text-emerald-600 truncate">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MatchingQuestions