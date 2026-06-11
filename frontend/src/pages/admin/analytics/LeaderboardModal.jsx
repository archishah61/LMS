import { X, Trophy, Medal, Clock, Calendar, TrendingUp, ChevronDown } from "lucide-react";
import { useState } from "react";

const LeaderboardModal = ({
    isOpen,
    onClose,
    contest,
    leaderboardData,
    isLoading,
    timeFilter,
    setTimeFilter,
    onRefetch,
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const timeFilterOptions = [
        { label: "Daily", value: "daily", icon: Clock },
        { label: "Weekly", value: "weekly", icon: Calendar },
        { label: "Monthly", value: "monthly", icon: TrendingUp },
    ];

    const getCurrentFilterLabel = () => {
        const option = timeFilterOptions.find(opt => opt.value === timeFilter);
        return option?.label || "Daily";
    };

    const getCurrentFilterIcon = () => {
        const option = timeFilterOptions.find(opt => opt.value === timeFilter);
        const IconComponent = option?.icon || Clock;
        return <IconComponent size={16} />;
    };

    const getMedalColor = (rank) => {
        switch (rank) {
            case 1:
                return "text-yellow-500";
            case 2:
                return "text-gray-400";
            case 3:
                return "text-amber-600";
            default:
                return "text-gray-300";
        }
    };

    const getMedalIcon = (rank) => {
        switch (rank) {
            case 1:
                return <Trophy size={20} className="text-yellow-500" />;
            case 2:
                return <Medal size={20} className="text-gray-400" />;
            case 3:
                return <Medal size={20} className="text-amber-600" />;
            default:
                return null;
        }
    };

    const handleFilterChange = (filter) => {
        setTimeFilter(filter);
        setIsDropdownOpen(false);
        setTimeout(() => onRefetch(), 0);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                            Leaderboard
                        </h2>
                        {contest && (
                            <p className="text-sm text-gray-500 mt-1 truncate max-w-[200px] sm:max-w-md">
                                {contest.contest_name}
                            </p>
                        )}
                    </div>

                    {/* Time Filter Dropdown and Close Button */}
                    <div className="flex items-center gap-2">
                        {/* Time Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                            >
                                {getCurrentFilterIcon()}
                                <span>{getCurrentFilterLabel()}</span>
                                <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsDropdownOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                        {timeFilterOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleFilterChange(option.value)}
                                                className={`w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-50 transition-colors
                                                    ${timeFilter === option.value ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700'}
                                                `}
                                            >
                                                <option.icon size={16} />
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : !leaderboardData?.leaderboard?.length ? (
                        <div className="text-center py-12">
                            <Trophy className="mx-auto text-gray-300 mb-4" size={48} />
                            <p className="text-gray-500">No rankings available yet</p>
                            <p className="text-sm text-gray-400 mt-2">
                                Be the first to participate and earn points!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {/* Header Row - Hidden on mobile, visible on desktop */}
                            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 rounded-lg text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="col-span-2">Rank</div>
                                <div className="col-span-7">Participant</div>
                                <div className="col-span-3 text-right">Score</div>
                            </div>

                            {/* Leaderboard Rows */}
                            <div className="space-y-2">
                                {leaderboardData.leaderboard.map((user, index) => (
                                    <div
                                        key={user.user_id}
                                        className={`grid grid-cols-12 gap-4 items-center p-4 rounded-lg transition-colors
                                            ${user.user_rank === 1 ? "bg-yellow-50 border border-yellow-100" : ""}
                                            ${user.user_rank === 2 ? "bg-gray-50 border border-gray-100" : ""}
                                            ${user.user_rank === 3 ? "bg-amber-50 border border-amber-100" : ""}
                                            ${user.user_rank > 3 ? "hover:bg-gray-50 border border-transparent hover:border-gray-100" : ""}
                                        `}
                                    >
                                        {/* Rank */}
                                        <div className="col-span-3 md:col-span-2 flex items-center gap-2">
                                            {getMedalIcon(user.user_rank) || (
                                                <span className={`font-bold text-lg ${getMedalColor(user.user_rank)}`}>
                                                    #{user.user_rank}
                                                </span>
                                            )}
                                        </div>

                                        {/* User Info */}
                                        <div className="col-span-7 md:col-span-7 flex items-center gap-3">
                                            {user.profile_image ? (
                                                <img
                                                    src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${user.profile_image || "/assets/placeholder2.png"}`}
                                                    alt={user.full_name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold">
                                                    {user.full_name?.charAt(0) || user.username?.charAt(0)}
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-gray-800 truncate">
                                                    {user.full_name || user.username}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    @{user.username}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Score */}
                                        <div className="col-span-2 md:col-span-3 text-right">
                                            <p className="text-lg font-bold text-indigo-600">
                                                {user.total_score}
                                            </p>
                                            <p className="text-xs text-gray-500 hidden md:block">points</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-4 sm:px-6 py-4 bg-gray-50 rounded-b-xl">
                    <p className="text-xs text-gray-500 text-center">
                        Rankings are updated in real-time based on contest participation
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardModal;