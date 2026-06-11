// components/LearningPathHistory.jsx
import React, { useState } from 'react';
import {
    ChevronDown,
    Clock,
    CheckCircle,
    XCircle,
    Trash2,
    Eye,
    BookOpen,
    TrendingUp,
    Calendar
} from 'lucide-react';
import { useGetLearningPathsQuery } from '../../../services/AIServices';

const LearningPathHistory = ({ onSelectPath, currentSessionId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { data, isLoading, refetch } = useGetLearningPathsQuery();

    const learningPaths = data?.data?.learningPaths || [];
    const summary = data?.data?.summary || {};

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-3 h-3 text-green-500" />;
            case 'in_progress': return <Clock className="w-3 h-3 text-blue-500" />;
            case 'initialized': return <Clock className="w-3 h-3 text-yellow-500" />;
            default: return <XCircle className="w-3 h-3 text-gray-400" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'completed': return 'Completed';
            case 'in_progress': return 'In Progress';
            case 'initialized': return 'Started';
            default: return status;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition-colors text-sm"
            >
                <BookOpen className="w-4 h-4" />
                <span>History</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[70vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-gray-900">Learning Path History</h3>
                            <p className="text-xs text-gray-500 mt-1">
                                {summary.totalPaths || 0} total paths • {summary.completedPaths || 0} completed
                            </p>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto flex-1">
                            {isLoading ? (
                                <div className="p-8 text-center text-gray-400">
                                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                                    <p className="text-xs">Loading history...</p>
                                </div>
                            ) : learningPaths.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No learning paths yet</p>
                                    <p className="text-xs mt-1">Start your first learning journey!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {learningPaths.map((path) => (
                                        <div
                                            key={path.sessionId}
                                            onClick={() => {
                                                if (path.status === "completed") {
                                                    const pdfUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${path?.roadmap_pdf_url}`;

                                                    // Open PDF in new tab
                                                    window.open(pdfUrl, "_blank");
                                                } else {
                                                    onSelectPath(path.sessionId);
                                                }
                                                setIsOpen(false);
                                            }}
                                            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${currentSessionId === path.sessionId ? 'bg-primary/5 border-l-4 border-primary' : ''
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span
                                                            className="font-semibold text-gray-900 text-sm truncate"
                                                            title={path.goalTitle || path.goal}
                                                        >
                                                            {path.goalTitle || path.goal}
                                                        </span>
                                                        <div className="flex items-center gap-1 text-xs">
                                                            {getStatusIcon(path.status)}
                                                            <span className="text-gray-500">{getStatusText(path.status)}</span>
                                                        </div>
                                                    </div>

                                                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                                                        {path.summary?.goalDescription || `Learning path for ${path.goal}`}
                                                    </p>

                                                    <div className="flex items-center gap-3 text-xs text-gray-400">
                                                        <div className="flex items-center gap-1">
                                                            <TrendingUp className="w-3 h-3" />
                                                            <span>{path.completionRate}% complete</span>
                                                        </div>
                                                        {path.timeFrameEstimate !== 'Not specified' && (
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                <span>{path.timeFrameEstimate}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            <span>{formatDate(path.startedAt)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Skills tags */}
                                                    {path.skills?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {path.skills.slice(0, 2).map((skill, idx) => (
                                                                <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                            {path.skills.length > 2 && (
                                                                <span className="text-[10px] text-gray-400">+{path.skills.length - 2}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-300 rounded-full"
                                                    style={{ width: `${path.progressPercentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
                            <p className="text-[10px] text-gray-400">
                                Click any path to view or resume
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default LearningPathHistory;