"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useCreateReviewMutation } from "../../services/Reviews/reviewApi"
import { getStudentToken } from "../../services/CookieService"
import { Star } from "lucide-react"
import toast from "react-hot-toast"

const ReviewModal = ({ isOpen, onClose, courseId, userId }) => {
  const [review, setReview] = useState("")
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [createReview, { isLoading, error }] = useCreateReviewMutation()

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please add a review and rating.")
      return
    }

    const { access_token } = getStudentToken()
    if (!access_token) {
      toast.error("Authentication error. Please log in.")
      return
    }

    try {
      await createReview({
        reviewData: { course_id: courseId, user_id: userId, review, rating },
        access_token,
      }).unwrap()
      toast.success("Review submitted successfully!")
      setReview("")
      setRating(0)
      onClose()
    } catch (err) {
      console.error("Failed to submit review:", err)
      const errorMessage = err?.data?.error ||
        err?.data?.message ||
        err?.error ||
        err?.message ||
        'Failed to delete review';
      toast.error(errorMessage);
    }
  }

  // Backdrop variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  }

  // Modal variants
  const modalVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      y: 10,
      scale: 0.98,
      transition: { duration: 0.15 },
    },
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={backdropVariants}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-[550px] overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="bg-lightGreen p-4 sm:p-5 relative overflow-hidden">


              <div className="relative z-10">
                <h2 className="text-xl font-bold text-forestGreen">
                  Leave a Review
                </h2>
                <p className="text-secondaryForestGreen/80 mt-1 text-sm font-medium">Share your experience with this course</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* Star Rating */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">Your Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                    >
                      <Star
                        size={28}
                        strokeWidth={1.5}
                        className={`transition-colors duration-200 ${star <= (hoveredRating || rating)
                          ? "fill-amber-400 text-amber-400" // Filled when active
                          : "fill-transparent text-gray-400 hover:text-gray-500" // Outline when inactive
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">Your Review</label>
                <div className="relative">
                  <textarea
                    className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-800 placeholder-gray-400 transition-all duration-200 outline-none focus:ring-0 focus:border-black resize-none text-sm leading-relaxed"
                    rows="3"
                    placeholder="Write your review here..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                  />
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                      {error.data?.message || "Failed to submit review."}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 focus:bg-gray-50 transition-colors duration-200 text-sm"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2.5 rounded-lg bg-leafGreen text-white font-medium text-sm min-w-[140px] flex justify-center items-center shadow-sm shadow-primary/30"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    "Submit Review"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ReviewModal

