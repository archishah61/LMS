"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useUpdateReviewMutation } from "../../services/Reviews/reviewAPI"
import { getStudentToken } from "../../services/CookieService"
import { Star } from "lucide-react"
import toast from "react-hot-toast"

const EditReviewModal = ({ isOpen, onClose, courseId, userId, review }) => {
  const [editedReview, setEditedReview] = useState("")
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [updateReview, { isLoading, error }] = useUpdateReviewMutation()

  useEffect(() => {
    if (review) {
      setEditedReview(review.review)
      setRating(review.rating)
    }
  }, [review])

  const handleSubmit = async () => {
    if (editedReview.trim() === "" || rating === 0) {
      toast.error("Please add a review and rating.")
      return
    }

    const { access_token } = getStudentToken()
    if (!access_token) {
      toast.error("Authentication error. Please log in.")
      return
    }

    try {
      await updateReview({
        id: review.id,
        reviewData: { course_id: courseId, user_id: userId, review: editedReview, rating },
        access_token,
      }).unwrap()
      toast.success("Review updated successfully!")
      onClose()
    } catch (err) {
      console.error("Failed to update review:", err)
      const errorMessage = err?.data?.error ||
        err?.data?.message ||
        err?.error ||
        err?.message ||
        'Failed to delete role';
      toast.error(errorMessage);
    }
  }

  // Backdrop variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2, delay: 0.1 } },
  }

  // Modal variants
  const modalVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay: 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  }

  if (!review) {
    return null
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={backdropVariants}
          >
            {/* Backdrop with blur effect */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal */}
            <motion.div
              variants={modalVariants}
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[550px] overflow-hidden"
              style={{
                boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.2), 0 10px 10px -5px rgba(124, 58, 237, 0.1)",
              }}
            >
              {/* Header with gradient */}
              <div className="relative">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                    height: "100%",
                  }}
                />
                <div className="relative p-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Edit Review
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">Update your review for this course</p>
                </div>
              </div>

              <div className="p-6 pt-2">
                {/* Star Rating with Enhanced Animation */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Rating</label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        type="button"
                        className="focus:outline-none"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        whileTap={{ scale: 0.9 }}
                      >
                        <motion.div
                          animate={{
                            scale: hoveredRating === star ? 1.2 : 1,
                            rotate: hoveredRating === star ? [0, -5, 5, -5, 0] : 0,
                          }}
                          transition={{
                            scale: { type: "spring", stiffness: 300, damping: 10 },
                            rotate: { duration: 0.5, ease: "easeInOut" },
                          }}
                        >
                          <Star
                            size={28}
                            className={`
                            transition-colors duration-200
                            ${star <= (hoveredRating || rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 dark:text-gray-600"
                              }
                            `}
                          />
                        </motion.div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Review Input with animation */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Review</label>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative"
                  >
                    <textarea
                      className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                      rows="5"
                      placeholder="Write your review here..."
                      value={editedReview}
                      onChange={(e) => setEditedReview(e.target.value)}
                    />
                  </motion.div>
                </div>

                {/* Error Message with animation */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4"
                    >
                      <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        {error.data?.message || "Failed to update review."}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Buttons */}
                <div className="mt-6 flex justify-end gap-3">
                  <motion.button
                    className="px-5 py-2.5 rounded-lg text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                    onClick={onClose}
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    className="px-5 py-2.5 rounded-lg text-white font-medium disabled:opacity-70 transition-all duration-200"
                    style={{
                      background: "linear-gradient(to right, #4F46E5, #7C3AED)",
                      backgroundSize: "200% auto",
                    }}
                    onClick={handleSubmit}
                    disabled={isLoading}
                    whileHover={{
                      scale: 1.02,
                      backgroundPosition: "right center",
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          className="mr-2 h-4 w-4"
                        >
                          <svg
                            className="animate-spin h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        </motion.div>
                        <span>Updating...</span>
                      </div>
                    ) : (
                      "Update Review"
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default EditReviewModal
