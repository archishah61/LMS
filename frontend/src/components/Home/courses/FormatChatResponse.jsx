import React from 'react';
import { BookOpen, Clock, DollarSign, Users, Star, ChevronRight, Tag } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { slugify } from '../../../utils/slugify';

// Main function to format different types of responses
const formatChatbotResponse = (responseData) => {
    const { contextType, contextData, reply } = responseData;

    // Return formatted content based on context type
    switch (contextType) {
        case 'COURSE_LIST':
            return <CourseListFormatter courses={contextData} reply={reply} />;
        case 'PURCHASE_LIST':
            return <PurchaseFormatter data={contextData} reply={reply} />;
        case 'SUPPORT_TICKET':
        case 'SUPPORT_TICKET_LIST':
            return <SupportTicketFormatter data={contextData} reply={reply} />;
        case 'FAQ_ANSWER':
            return <DefaultFormatter reply={reply} answer={contextData.answer} />;
        default:
            return <DefaultFormatter reply={reply} />;
    }
};

// Course List Component with horizontal scrollable cards
const CourseListFormatter = ({ courses, reply }) => {
    const navigate = useNavigate();

    const calculateDiscountedPrice = (price, discount) => {
        return (price - (price * discount / 100)).toFixed(0);
    };

    const formatDuration = (duration) => {
        if (duration >= 24) {
            return `${Math.floor(duration / 24)}d ${duration % 24}h`;
        }
        return `${duration}h`;
    };

    return (
        <div className="space-y-3">
            {/* Reply text */}
            {reply && (
                <div className="text-sm text-gray-900 leading-relaxed font-medium">
                    {reply}
                </div>
            )}

            {/* Horizontally scrollable course cards */}
            <div className="relative">
                <div className="flex space-x-3 overflow-x-auto pb-3 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {courses.map((course, index) => (
                        <div
                            key={course.id || index}
                            className="flex-shrink-0 w-64 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                        >
                            {/* Course Image/Icon */}
                            <div className="h-28 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative">
                                {course.thumbnail ?
                                    (<img
                                        src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${course.thumbnail || "/placeholder.png"}`}
                                        alt={course.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />)
                                    :
                                    (<BookOpen size={28} className="text-blue-600" />)
                                }
                                {course.discount && (
                                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                        {course.discount}% OFF
                                    </div>
                                )}
                            </div>

                            {/* Course Content */}
                            <div className="p-3 space-y-2">
                                {/* Title */}
                                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight">
                                    {course.title}
                                </h3>

                                {/* Description */}
                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                    {course.description}
                                </p>

                                {/* Course Stats */}
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center space-x-1">
                                        <Clock size={12} />
                                        <span>{formatDuration(course.duration_hours)}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Users size={12} />
                                        <span>{course.validity_days}d access</span>
                                    </div>
                                </div>

                                {/* Price Section */}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                    <div className="flex items-center space-x-2">
                                        {course.discount ? (
                                            <>
                                                <span className="text-base font-bold text-green-600">
                                                    ${calculateDiscountedPrice(course.price, course.discount)}
                                                </span>
                                                <span className="text-xs text-gray-400 line-through">
                                                    ${course.price}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-base font-bold text-gray-900">
                                                ${course.price}
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={() => navigate(`/course/${slugify(course.title)}`, {
                                            state: { public_hash: course.public_hash }
                                        })}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-full font-semibold transition-colors flex items-center space-x-1"
                                    >
                                        <span>View</span>
                                        <ChevronRight size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Scroll indicator */}
                <div className="absolute right-0 top-0 bottom-3 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none" />
            </div>
        </div>
    );
};

// Refined Purchase Confirmation Component
const PurchaseFormatter = ({ data, reply }) => {
    const purchases = Array.isArray(data) ? data : [data];

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatPrice = (price, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(price);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'active':
                return 'bg-green-100 text-green-700';
            case 'pending':
                return 'bg-yellow-100 text-yellow-700';
            case 'failed':
            case 'cancelled':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-3 max-w-sm">
            {reply && (
                <div className="text-sm text-gray-900 bg-blue-50 p-3 rounded-2xl border border-blue-100">
                    <div className="flex items-start space-x-2">
                        <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-xs">✓</span>
                        </div>
                        <span className="text-sm font-medium">{reply}</span>
                    </div>
                </div>
            )}

            {purchases.map((purchase, index) => (
                <div key={purchase.payment_id || index} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">

                    {/* Success Header */}
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-3">
                        <div className="flex items-center justify-between text-white">
                            <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">✓</span>
                                </div>
                                <div>
                                    <h2 className="font-bold text-sm">Purchase Successful</h2>
                                    <p className="text-green-100 text-xs">Access granted</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-base font-bold">{formatPrice(purchase.amount, purchase.currency)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Course Information */}
                    <div className="p-4 space-y-3">
                        <div>
                            <h3 className="font-bold text-base text-gray-900 mb-1">{purchase.course_title}</h3>
                            <div className="flex flex-wrap gap-1 mb-2">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(purchase.enrollment_status)}`}>
                                    {purchase.enrollment_status?.charAt(0).toUpperCase() + purchase.enrollment_status?.slice(1)}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                                    {purchase.duration_hours}h
                                </span>
                            </div>
                        </div>

                        {/* Transaction Summary */}
                        <div className="bg-gray-50 p-3 rounded-xl space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600 font-medium">Transaction ID:</span>
                                <span className="font-mono text-xs font-semibold text-gray-900">{purchase.transaction_id}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600 font-medium">Payment:</span>
                                <span className="text-xs font-semibold capitalize text-gray-900">{purchase.payment_method}</span>
                            </div>
                            {purchase.course_discount > 0 && (
                                <div className="flex justify-between items-center text-green-600">
                                    <span className="text-xs font-medium">Discount ({purchase.course_discount}%):</span>
                                    <span className="text-xs font-semibold">-{formatPrice((purchase.course_price * purchase.course_discount / 100), purchase.currency)}</span>
                                </div>
                            )}
                        </div>

                        {/* Action Button */}
                        <div className="pt-2">
                            <button
                                onClick={() => navigate(`/course/${slugify(course.title)}`, {
                                    state: { public_hash: course.public_hash }
                                })}
                                className="w-full bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                            >
                                Start Learning
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const SupportTicketFormatter = ({ data, reply }) => {
    const tickets = Array.isArray(data) ? data : [data];

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'open':
                return 'text-red-600 bg-red-50';
            case 'in progress':
            case 'in-progress':
                return 'text-orange-600 bg-orange-50';
            case 'resolved':
            case 'closed':
                return 'text-green-600 bg-green-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
            case 'urgent':
                return 'text-red-600 bg-red-50';
            case 'medium':
                return 'text-orange-600 bg-orange-50';
            case 'low':
                return 'text-gray-600 bg-gray-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="space-y-3 max-w-xs">
            {reply && (
                <div className="text-sm text-gray-900 font-medium mb-2">
                    {reply}
                </div>
            )}

            {tickets.map((ticket, index) => (
                <div key={ticket.id || index} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">

                    {/* Header with icon and date */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                                <span className="text-white text-sm font-bold">#</span>
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-gray-900">Ticket</div>
                                <div className="text-xs text-gray-500">#{ticket.id}</div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                            {formatDate(ticket.created_at)}
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-base font-semibold text-gray-900 mb-3 leading-tight">
                        {ticket.title}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                        </span>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full text-purple-600 bg-purple-50">
                            {ticket.category}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

const DefaultFormatter = ({ reply, answer }) => {
    // Split answer lines
    const answerLines = answer?.split('\n').filter(line => line.trim() !== '');

    return (
        <div className="text-sm text-gray-900 leading-relaxed font-medium space-y-2">
            <p className="whitespace-pre-line">{reply}</p>

            <div className="space-y-1">
                {answerLines?.map((line, idx) => {
                    if (line.startsWith('**Reset Your Password:**')) {
                        return (
                            <p key={idx} className="font-semibold text-base">
                                Reset Your Password:
                            </p>
                        );
                    } else if (line.startsWith('**Note:**')) {
                        return (
                            <p key={idx} className="font-semibold text-sm mt-2">
                                Note: <span className="font-normal">Reset links expire in 24 hours.</span>
                            </p>
                        );
                    } else if (/^\d+\./.test(line)) {
                        // Add left indent for numbered steps
                        return (
                            <p key={idx} className="pl-4">
                                {line}
                            </p>
                        );
                    } else {
                        return <p key={idx}>{line}</p>;
                    }
                })}
            </div>
        </div>
    );
};

// CSS for hiding scrollbar (add this to your global CSS)
const scrollbarHideCSS = `
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
`;

export { formatChatbotResponse, scrollbarHideCSS };