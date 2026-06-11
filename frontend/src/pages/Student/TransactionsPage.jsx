/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useLocation } from "react-router-dom"
import { useState, useEffect, useCallback, useMemo } from "react"
import { getStudentToken } from "../../services/CookieService"
import { ArrowDownLeft, ArrowUpRight, ChevronDown, Wallet, TrendingUp, TrendingDown, Calendar, Receipt, Filter } from "lucide-react"
import { useGetUserPointsByIdQuery } from "../../services/Challenge/userChallenge"
import PrimaryLoader from "../../components/ui/PrimaryLoader"

export default function TransactionsPage() {
    const location = useLocation()
    const isStandalone = location.pathname === '/transactions'
    const [token, setToken] = useState(null)

    useEffect(() => {
        const { access_token } = getStudentToken()
        if (access_token) {
            setToken(access_token)
        }
    }, [])

    const [timeFilter, setTimeFilter] = useState("all")
    const [page, setPage] = useState(0)
    const [transactions, setTransactions] = useState([])
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" })
    const [isCustomDateOpen, setIsCustomDateOpen] = useState(false)

    // Reset state when filter changes
    useEffect(() => {
        setPage(0)
        setTransactions([])
    }, [timeFilter, customDateRange])

    const queryParams = useMemo(() => ({
        access_token: token,
        timeFilter: timeFilter === "all" ? undefined : timeFilter,
        limit: 10,
        offset: page * 10,
        startDate: timeFilter === 'custom' && customDateRange.start ? customDateRange.start : undefined,
        endDate: timeFilter === 'custom' && customDateRange.end ? customDateRange.end : undefined
    }), [token, timeFilter, page, customDateRange])

    const {
        data: pointsData,
        isLoading,
        error,
    } = useGetUserPointsByIdQuery(
        queryParams,
        { skip: !token }
    )

    useEffect(() => {
        if (pointsData?.transactions) {
            setTransactions((prev) => {
                // If page is 0, we can likely safely reset, but relying on the order is key or explicit reset
                // But since we have the reset effect above, we need to be careful not to append twice if strict mode?
                // Actually with reordering:
                // 1. Filter change -> Render.
                // 2. Reset Effect runs -> sets []
                // 3. Data Effect runs -> sets [...prev, ...data] -> [...[], ...data] -> [data].
                // This works for Cached data too because effects run in order.

                const merged = [...prev, ...pointsData.transactions]
                const unique = Array.from(new Map(merged.map(t => [t.id, t])).values())
                return unique
            })
        }
    }, [pointsData])

    const hasMore = transactions.length < (pointsData?.total || 0)

    const handleScroll = useCallback(() => {
        if (
            hasMore &&
            window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000 &&
            !isLoadingMore
        ) {
            setIsLoadingMore(true)
            setTimeout(() => {
                setPage((prev) => prev + 1)
                setIsLoadingMore(false)
            }, 500)
        }
    }, [isLoadingMore, hasMore])

    useEffect(() => {
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [handleScroll])

    const getFilterLabel = (filter) => {
        switch (filter) {
            case "all": return "All Time";
            case "24h": return "Last 24 Hours";
            case "1w": return "This Week";
            case "1m": return "This Month";
            case "1y": return "This Year";
            case "custom": return "Custom Range"; // Label for custom
            default: return "All Time";
        }
    }

    if (isLoading) {
        return <PrimaryLoader />
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center px-4">
                <div className="text-center p-6 sm:p-8 bg-red-50 rounded-2xl border border-red-100 max-w-md w-full">
                    <p className="text-red-500 font-bold mb-2 text-sm sm:text-base">Unavailable</p>
                    <p className="text-gray-600 mb-4 text-xs sm:text-sm">We couldn&apos;t load your transactions.</p>
                    <button onClick={() => window.location.reload()} className="text-xs sm:text-sm underline text-red-600 hover:text-red-800">Retry</button>
                </div>
            </div>
        )
    }

    const userPoints = pointsData?.userPoints
    const visibleTransactions = transactions

    return (
        <div className="min-h-screen bg-white pt-4 pb-4">
            <div className={`container mx-auto ${isStandalone ? 'px-3 xs:px-4 sm:px-6 lg:px-8' : ''}`}>
                {/* Header Section */}
                <div className="w-full mx-auto rounded-2xl overflow-hidden shadow-sm mb-6 sm:mb-8">
                    <div
                        className="px-4 xs:px-6 sm:px-8 py-6 sm:py-8 relative bg-cover bg-center text-white"
                        style={{ backgroundImage: "url('/assets/My_Profile_Heading_Background.png')" }}
                    >
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Transaction History <Receipt className="inline ml-1 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white text-opacity-80" /></h1>
                            </div>
                            <p className="text-indigo-100 text-xs sm:text-sm md:text-base opacity-90 font-light max-w-xl">
                                Track your points earnings, spending, and balance over time
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                    {/* Left Column: Summary Cards */}
                    <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                        {userPoints && (
                            <>
                                {/* Current Balance */}
                                <div className="bg-white rounded-xl p-3 sm:p-4 border-l-4 border-l-purple-500 shadow-sm border border-gray-100 flex items-center gap-3 sm:gap-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0">
                                        <Wallet size={20} sm:size={24} strokeWidth={1.5} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-gray-800 truncate">Current Balance</p>
                                        <h3 className="text-xl sm:text-2xl font-bold text-purple-600 leading-tight truncate">{userPoints.points}</h3>
                                        <p className="text-[10px] sm:text-xs text-gray-500">Available to spend</p>
                                    </div>
                                </div>

                                {/* Total Earned (Red as per mockup) */}
                                <div className="bg-white rounded-xl p-3 sm:p-4 border-l-4 border-l-red-500 shadow-sm border border-gray-100 flex items-center gap-3 sm:gap-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500 flex-shrink-0">
                                        <Wallet size={20} sm:size={24} strokeWidth={1.5} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-gray-800 truncate">Total Earned</p>
                                        <h3 className="text-xl sm:text-2xl font-bold text-red-500 leading-tight truncate">{userPoints.total_earned}</h3>
                                        <p className="text-[10px] sm:text-xs text-gray-500">All time earnings</p>
                                    </div>
                                </div>

                                {/* Total Spent (Green as per mockup) */}
                                <div className="bg-white rounded-xl p-3 sm:p-4 border-l-4 border-l-green-500 shadow-sm border border-gray-100 flex items-center gap-3 sm:gap-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-500 flex-shrink-0">
                                        <Wallet size={20} sm:size={24} strokeWidth={1.5} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-gray-800 truncate">Total Spent</p>
                                        <h3 className="text-xl sm:text-2xl font-bold text-green-500 leading-tight truncate">{userPoints.total_spent}</h3>
                                        <p className="text-[10px] sm:text-xs text-gray-500">All time spending</p>
                                    </div>
                                </div>

                                {/* Net Change */}
                                <div className="bg-lightGreen/50 rounded-xl p-3 sm:p-4 border border-gray-200 flex items-center justify-between">
                                    <span className="text-xs sm:text-sm font-medium text-gray-600">Net Change</span>
                                    <span className={`text-base sm:text-lg font-bold ${userPoints.total_earned - userPoints.total_spent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {userPoints.total_earned - userPoints.total_spent >= 0 ? '+' : ''}
                                        {userPoints.total_earned - userPoints.total_spent}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right Column: Transaction List */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[350px] xs:min-h-[400px] sm:min-h-[450px] md:min-h-[500px]">
                            {/* List Header */}
                            <div className="px-3 xs:px-4 sm:px-6 py-3 xs:py-3.5 sm:py-4 border-b border-gray-100 flex flex-col xs:flex-row xs:items-start sm:items-center justify-between gap-2 sm:gap-4 bg-white">
                                <div className="min-w-0">
                                    <h3 className="text-sm xs:text-base sm:text-lg font-bold text-gray-800 truncate">Recent Transactions</h3>
                                    <p className="text-xs text-gray-500">{transactions.length} transactions found</p>
                                </div>

                                <div className="relative w-full xs:w-auto self-start xs:self-auto flex flex-col xs:flex-row items-start xs:items-center gap-2">
                                    {/* Custom Date Inputs (only visible if custom selected) */}
                                    {timeFilter === 'custom' && (
                                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mr-0 xs:mr-2 w-full xs:w-auto">
                                            <span className="text-xs text-gray-500 hidden sm:inline">Range:</span>
                                            <span className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1.5 xs:py-1 rounded border border-gray-200 truncate max-w-[140px] xs:max-w-full">
                                                {customDateRange.start} - {customDateRange.end}
                                            </span>
                                            <button
                                                onClick={() => setIsCustomDateOpen(true)}
                                                className="text-xs text-primary hover:underline whitespace-nowrap"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    )}

                                    <div className="relative w-full xs:w-auto">
                                        <button
                                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                                            className="flex items-center justify-between xs:justify-start gap-2 px-3 sm:px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 w-full xs:w-auto min-w-[120px] xs:min-w-[130px] sm:min-w-[140px]"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="flex-shrink-0" />
                                                <span className="truncate">{getFilterLabel(timeFilter)}</span>
                                            </div>
                                            <ChevronDown size={14} className="flex-shrink-0" />
                                        </button>

                                        {isFilterOpen && (
                                            <>
                                                {/* Backdrop for mobile */}
                                                <div
                                                    className="fixed inset-0 bg-black/20 z-30 lg:hidden"
                                                    onClick={() => setIsFilterOpen(false)}
                                                />
                                                <div className="absolute top-full left-0 xs:left-auto xs:right-0 mt-1 w-full xs:w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-40 overflow-hidden">
                                                    {["all", "24h", "1w", "1m", "1y", "custom"].map((opt) => (
                                                        <button
                                                            key={opt}
                                                            onClick={() => {
                                                                if (opt === 'custom') {
                                                                    setIsCustomDateOpen(true);
                                                                    setIsFilterOpen(false);
                                                                } else {
                                                                    setTimeFilter(opt);
                                                                    setIsFilterOpen(false);
                                                                }
                                                            }}
                                                            className={`w-full text-left px-4 py-3 text-xs sm:text-sm ${timeFilter === opt ? "font-bold text-primary bg-lightGreen/10" : "text-gray-600"} hover:bg-gray-50 transition-colors`}
                                                        >
                                                            {getFilterLabel(opt)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Custom Date Range Modal/Popup */}
                                    {isCustomDateOpen && (
                                        <>
                                            {/* Backdrop for mobile */}
                                            <div
                                                className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                                                onClick={() => setIsCustomDateOpen(false)}
                                            />
                                            <div className="fixed bottom-0 left-0 right-0 xs:absolute xs:bottom-auto xs:left-auto xs:right-0 xs:top-full xs:mt-2 w-full xs:w-80 bg-white rounded-t-2xl xs:rounded-xl shadow-2xl border border-gray-100 z-50 p-4 xs:p-4">
                                                <div className="flex items-center justify-between xs:justify-start mb-3">
                                                    <h4 className="text-sm font-bold text-gray-800">Select Date Range</h4>
                                                    <button
                                                        onClick={() => setIsCustomDateOpen(false)}
                                                        className="xs:hidden p-2 text-gray-500 hover:text-gray-700"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                                                        <input
                                                            type="date"
                                                            max={customDateRange.end || new Date().toISOString().split("T")[0]}
                                                            className="w-full text-sm border border-gray-200 rounded-lg p-2.5 xs:p-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                            value={customDateRange.start}
                                                            onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">End Date</label>
                                                        <input
                                                            type="date"
                                                            min={customDateRange.start}
                                                            max={new Date().toISOString().split("T")[0]}
                                                            className="w-full text-sm border border-gray-200 rounded-lg p-2.5 xs:p-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                            value={customDateRange.end}
                                                            onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                                                        />
                                                    </div>
                                                    {customDateRange.start && customDateRange.end && customDateRange.start > customDateRange.end && (
                                                        <p className="text-[10px] text-red-500 bg-red-50 p-2 rounded">Start date cannot be after end date.</p>
                                                    )}
                                                    <div className="flex justify-end gap-2 pt-2">
                                                        <button
                                                            onClick={() => setIsCustomDateOpen(false)}
                                                            className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 flex-1 xs:flex-none"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (customDateRange.start || customDateRange.end) {
                                                                    setTimeFilter('custom');
                                                                    setIsCustomDateOpen(false);
                                                                }
                                                            }}
                                                            disabled={(!customDateRange.start && !customDateRange.end) || (customDateRange.start && customDateRange.end && customDateRange.start > customDateRange.end)}
                                                            className="px-4 py-2 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex-1 xs:flex-none"
                                                        >
                                                            Apply
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* List Items */}
                            {visibleTransactions.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {visibleTransactions.map((transaction) => {
                                        const isEarn = transaction.type === "earn";
                                        return (
                                            <div key={transaction.id} className="px-3 xs:px-4 sm:px-6 py-3 xs:py-3.5 sm:py-4 flex items-start xs:items-center gap-2 xs:gap-3 sm:gap-4 group hover:bg-gray-50/50 transition-colors">
                                                {/* Icon Box */}
                                                <div className={`w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isEarn ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                                                    {isEarn ? <ArrowDownLeft size={16} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" /> : <ArrowUpRight size={16} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" />}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 mb-0.5 xs:mb-1">
                                                        <h4 className="text-xs xs:text-sm sm:text-base font-semibold text-gray-900 truncate pr-2">
                                                            {transaction.description.replace(/^Enrolled Course/, "Course Enroll:")}
                                                        </h4>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 sm:gap-3 text-xs text-gray-500">
                                                        <span className={`px-1.5 xs:px-2 py-0.5 rounded-md font-medium uppercase tracking-wide bg-gray-100 text-gray-600 w-fit text-[10px] xs:text-xs`}>
                                                            {transaction.source.replace(/_/g, " ")}
                                                        </span>
                                                        <span className="truncate text-[10px] xs:text-xs">
                                                            {new Date(transaction.created_at).toLocaleDateString("en-US", {
                                                                month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Amount Pill */}
                                                <div className={`px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1 sm:py-1 rounded-md font-bold text-xs ${isEarn ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"} flex-shrink-0 whitespace-nowrap`}>
                                                    {isEarn ? "+" : "-"}{transaction.points}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 xs:py-12 sm:py-16 md:py-20 text-center px-4">
                                    <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2 xs:mb-3 sm:mb-4 text-gray-300">
                                        <Receipt size={20} className="xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                                    </div>
                                    <h3 className="text-sm xs:text-base sm:text-lg font-bold text-gray-900">No Transactions</h3>
                                    <p className="text-xs text-gray-500 mt-1">No data found for this period.</p>
                                </div>
                            )}

                            {/* Load More */}
                            {hasMore && !isLoadingMore && (
                                <div className="p-3 xs:p-3.5 sm:p-4 bg-gray-50 border-t border-gray-100 text-center">
                                    <button
                                        onClick={handleScroll}
                                        className="text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-4 py-2 rounded-lg hover:bg-primary/5"
                                    >
                                        Load More History
                                    </button>
                                </div>
                            )}
                            {isLoadingMore && (
                                <div className="p-3 xs:p-3.5 sm:p-4 text-center text-gray-400 text-xs sm:text-sm">
                                    <span className="inline-flex items-center gap-2">
                                        <div className="w-3 h-3 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
                                        Loading...
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}