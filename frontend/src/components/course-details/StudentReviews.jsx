import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Edit2, Trash2, Send } from 'lucide-react';
import { 
    useGetReviewsByCourseIdQuery,
    useGetUserReviewQuery,
    useCreateReviewMutation, 
    useUpdateReviewMutation, 
    useDeleteReviewMutation 
} from '../../services/Reviews/reviewApi';
import { getStudentToken } from '../../services/CookieService';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import 'swiper/css';
import 'swiper/css/navigation';

// Star Rating Component for Input
const StarRatingInput = ({ rating, setRating, disabled }) => {
    const [hover, setHover] = useState(0);

    return (
        <div className="flex gap-1">
            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                    <button
                        key={index}
                        type="button"
                        className={`text-2xl focus:outline-none transition-colors ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
                        onClick={() => !disabled && setRating(ratingValue)}
                        onMouseEnter={() => !disabled && setHover(ratingValue)}
                        onMouseLeave={() => !disabled && setHover(0)}
                    >
                        <Star
                            className={`w-6 h-6 transition-colors ${
                                ratingValue <= (hover || rating)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-300"
                            }`}
                        />
                    </button>
                );
            })}
             <span className="ml-2 text-sm font-medium text-gray-700">
                {hover > 0 ? ["Poor", "Fair", "Good", "Very Good", "Excellent"][hover - 1] : 
                 rating > 0 ? ["Poor", "Fair", "Good", "Very Good", "Excellent"][rating - 1] : ""}
            </span>
        </div>
    );
};

const ReviewCard = ({ review, isUserReview, onEdit, onDelete }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const maxLength = 240;

    const shouldTruncate = review.review && review.review.length > maxLength;

    return (
        <div className="w-full flex gap-4 py-6 border-b border-gray-100 last:border-0">
             <div className="flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-200 overflow-hidden">
                     <img
                        src={review.profile_image ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${review.profile_image}` : `/assets/placeholder2.png`}
                        alt={review.full_name || "User"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/assets/placeholder2.png";
                        }}
                    />
                </div>
            </div>
            <div className="flex-grow">
                 <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-gray-900 text-base">{review.full_name || "Student"}</h4>
                      {/* {isUserReview && (
                          <div className="flex gap-2">
                               <button onClick={onEdit} className="text-gray-400 hover:text-primary transition-colors">
                                   <Edit2 className="w-4 h-4" />
                               </button>
                               <button onClick={onDelete} className="text-gray-400 hover:text-red-500 transition-colors">
                                   <Trash2 className="w-4 h-4" />
                               </button>
                          </div>
                      )} */}
                 </div>
                 <div className="flex items-center gap-2 mb-3">
                     <div className="flex">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                            />
                        ))}
                    </div>
                     <span className="text-xs text-gray-500">
                        {review.created_at ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true }) : ''}
                    </span>
                 </div>
                 
                 <div className="text-gray-600 text-sm leading-relaxed">
                     <p>
                        {shouldTruncate && !isExpanded
                            ? `${review.review.substring(0, maxLength)}...`
                            : review.review}
                        {shouldTruncate && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-primary font-medium ml-1 hover:underline text-xs inline-block"
                            >
                                {isExpanded ? 'Show Less' : 'Read More'}
                            </button>
                        )}
                    </p>
                 </div>
                 
                 {isUserReview && (
                    <div className="flex gap-4 mt-3">
                        <button onClick={onEdit} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors">
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={onDelete} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 font-medium transition-colors">
                             <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                    </div>
                 )}
            </div>
        </div>
    );
};

export const StudentReviews = ({ courseId, isEnrolled, userId, courseTitle }) => {
    const [page, setPage] = React.useState(1);
    const [limit, setLimit] = React.useState(3); // Reduced limit to verify pagination
    const { access_token } = React.useMemo(() => getStudentToken(), []); // Memoize token fetch or just fetch once

    // Review Management State
    const [userReview, setUserReview] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isWriting, setIsWriting] = useState(false); // New state to toggle form
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false); // Modal state

    // API Hooks
    const [createReview] = useCreateReviewMutation();
    const [updateReview] = useUpdateReviewMutation();
    const [deleteReview] = useDeleteReviewMutation();
    
    const { data, isLoading, refetch } = useGetReviewsByCourseIdQuery({
        courseId,
        page,
        limit,
        access_token,
        exclude_user_id: userId
    }, {
        skip: !courseId
    });

    const userReviewQueryArgs = React.useMemo(() => ({
        courseId,
        userId,
        access_token
    }), [courseId, userId, access_token]);

    const { 
        data: userReviewData, 
        isLoading: isUserReviewLoading, 
        refetch: refetchUserReview 
    } = useGetUserReviewQuery(userReviewQueryArgs, {
        skip: !courseId || !userId || !isEnrolled
    });

    const reviews = data?.reviews || [];
    const totalPages = data?.pagination?.total_pages || 0;
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const currentUserReview = userReviewData?.review;

    useEffect(() => {
        if (currentUserReview) {
            setUserReview(currentUserReview);
           // If we have a review, we are NOT writing a new one.
           // Unless we click edit.
        } else {
             setUserReview(null);
        }
    }, [currentUserReview]);

    // Initialize edit form
    const handleEditClick = () => {
        if (userReview) {
             setRating(userReview.rating);
             setReviewText(userReview.review);
             setIsEditing(true);
             setIsWriting(true); // Reuse the writing form
        }
    };
    
    const handleWriteClick = () => {
        setRating(0);
        setReviewText("");
        setIsEditing(false);
        setIsWriting(true);
    };
    
    const handleCancel = () => {
        setIsWriting(false);
        setIsEditing(false);
        setRating(0);
        setReviewText("");
    };

    const handleRefresh = () => {
        refetch();
        refetchUserReview();
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error("Please select a star rating");
            return;
        }
        if (!reviewText.trim()) {
            toast.error("Please write a review");
            return;
        }

        setIsSubmitting(true);
        try {
            if (isEditing && userReview) {
                await updateReview({
                    id: userReview.id,
                    reviewData: {
                        course_id: courseId, 
                        rating: rating,
                        review: reviewText,
                        user_id: userId 
                    },
                    access_token
                }).unwrap();
                toast.success("Review updated!");
            } else {
                await createReview({
                    reviewData: {
                        course_id: courseId,
                        rating: rating,
                        review: reviewText,
                         user_id: userId
                    },
                    access_token
                }).unwrap();
                toast.success("Review submitted!");
            }
             setIsWriting(false);
             setIsEditing(false);
             handleRefresh();
        } catch (error) {
            console.error("Review error:", error);
            const msg = error?.data?.message || "Failed to save review";
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = () => {
        if (!userReview) return;
        setShowDeleteModal(true);
    };

    const confirmDeleteStr = async () => {
        try {
            await deleteReview({
                id: userReview.id,
                access_token
            }).unwrap();
            toast.success("Review deleted");
            setUserReview(null);
            handleRefresh();
            setShowDeleteModal(false);
        } catch (error) {
             console.error("Delete error:", error);
             toast.error("Failed to delete review");
        }
    };
    
     const handleNext = () => {
        if (hasNextPage) setPage(prev => prev + 1);
    };

    const handlePrev = () => {
        if (hasPrevPage) setPage(prev => prev - 1);
    };

    if (isLoading) {
        return <div className="py-8 animate-pulse text-center text-gray-400">Loading reviews...</div>;
    }

    return (
        <div className="py-8 border-t border-gray-100">
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl transform transition-all scale-100">
                        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4 mx-auto">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Review?</h3>
                        <p className="text-gray-500 text-center mb-6 text-sm">
                            Are you sure you want to delete your review? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteStr}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors text-sm shadow-lg shadow-red-600/20"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header / Actions */}
            <div className="flex items-center justify-between mb-8">
                 <h2 className="text-2xl font-bold text-gray-900">Student Reviews</h2>
                 {/* Only show "Write a Review" if enrolled AND no review yet AND not currently writing */}
                 {isEnrolled && !currentUserReview && !isWriting && (
                    <button 
                        onClick={handleWriteClick}
                        className="bg-megistic text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm hover:shadow-md hover:bg-gray-800 transition-all"
                    >
                        Write a Review
                    </button>
                 )}
            </div>

            {/* Writing Form */}
            {isWriting && (
                 <div className="mb-8 border border-gray-200 rounded-xl p-6 bg-white animate-fade-in shadow-sm">
                     <h3 className="font-bold text-gray-900 mb-4">{isEditing ? "Edit Review" : "Write a Review"}</h3>
                     <form onSubmit={handleSubmitReview}>
                         <div className="mb-4">
                             <StarRatingInput rating={rating} setRating={setRating} />
                         </div>
                         <div className="mb-4">
                             {/* Title Input placeholder if we wanted to match design exactly, but ignoring per prompt constraints */}
                              <textarea
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                rows="5"
                                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-gray-400 focus:ring-0 transition-colors resize-none placeholder-gray-400"
                                placeholder="Write your review..."
                            />
                            {/* Toolbar placeholder */}
                             {/* <div className="border-t border-gray-100 flex gap-4 pt-2 mt-2 text-gray-400"> */}
                                 {/* Example icons: Bold, Italic, Underline, Strikethrough - purely visual for now since simple textarea */}
                                 {/* <span className="font-bold font-serif cursor-pointer hover:text-gray-600">B</span>
                                 <span className="italic font-serif cursor-pointer hover:text-gray-600">I</span>
                                 <span className="underline font-serif cursor-pointer hover:text-gray-600">U</span>
                             </div> */}
                         </div>
                         
                         {/* Action Buttons */}
                         <div className="flex gap-3">
                             <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="bg-megistic text-white px-5 py-1.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-70"
                             >
                                 {isSubmitting ? "Submitting..." : "Submit Review"}
                             </button>
                             <button 
                                type="button" 
                                onClick={handleCancel}
                                className="bg-white border border-gray-200 text-gray-700 px-5 py-1.5 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors"
                             >
                                 Cancel
                             </button>
                         </div>
                     </form>
                 </div>
            )}
            
            {/* Reviews List */}
            <div className="space-y-2">
                 {/* User Review (Card at top) */}
                 {currentUserReview && !isWriting && (
                     <ReviewCard 
                        review={currentUserReview} 
                        isUserReview={true} 
                        onEdit={handleEditClick} 
                        onDelete={handleDeleteClick}
                     />
                 )}
                 
                 {/* Other Reviews */}
                 {reviews.map(review => (
                     <ReviewCard key={review.id} review={review} />
                 ))}
                 
                 {/* Empty State */}
                 {reviews.length === 0 && !currentUserReview && !isWriting && (
                      <div className="text-center py-10 text-gray-400 text-sm">
                          No reviews yet.
                      </div>
                 )}
            </div>

             {/* Pagination */}
             {totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                     <button
                        onClick={handlePrev}
                        disabled={!hasPrevPage}
                        className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-30 hover:bg-gray-50"
                     >
                        Previous
                     </button>
                     <span className="px-3 py-1 text-sm text-gray-500">Page {page} of {totalPages}</span>
                     <button
                         onClick={handleNext}
                         disabled={!hasNextPage}
                         className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-30 hover:bg-gray-50"
                     >
                        Next
                     </button>
                </div>
             )}
        </div>
    );
};
