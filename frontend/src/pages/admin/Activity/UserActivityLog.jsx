"use client";

import { useEffect, useState, useMemo } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useSelector, useDispatch } from "react-redux";
import AdminLoader from "../../../components/admin/AdminLoader";
import {
  useGetActivityLogDatesQuery,
  useGetActivityLogsByDateQuery,
  useGetActivityLogMetaQuery,
} from "../../../services/Activity/userActivityLogApi";
import { getAdminToken } from "../../../services/CookieService";
import { setFilters } from "../../../features/Activity/userActivityLogSlice";
import { slugify } from "../../../utils/slugify";
import { useLocation, useNavigate } from "react-router-dom";
import PermissionWrapper from "../../../context/PermissionWrapper";
import { ArrowLeft } from "lucide-react";

const formatTime = (ts) => {
  if (!ts) return "-";
  const d = new Date(ts);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const outcomeStyles = {
  success: "bg-green-100 text-green-700 ring-green-200",
  failure: "bg-red-100 text-red-700 ring-red-200",
  "n/a": "bg-gray-100 text-gray-600 ring-gray-200",
};

export const UserActivityLog = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { filters } = useSelector((s) => s.userActivityLog);
  const { access_token } = getAdminToken();
  const [selectedDate, setSelectedDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [expandedMonths, setExpandedMonths] = useState(new Set());
  const [draftFilters, setDraftFilters] = useState({
    start_date: filters.start_date || "",
    end_date: filters.end_date || "",
    event_category: filters.event_category || "",
    event_action: filters.event_action || "",
    outcome: filters.outcome || "",
  });
  const [metadataTermInput, setMetadataTermInput] = useState("");
  const [metadataTerms, setMetadataTerms] = useState([]);
  const dateLimit = 30;

  const { data: datesData, isFetching: fetchingDates } =
    useGetActivityLogDatesQuery({
      access_token,
      user_id: filters.user_id,
      start: filters.start_date,
      end: filters.end_date,
      limit: dateLimit,
      offset: 0,
    });
  const dateRows = datesData?.data || [];

  useEffect(() => {
    if (!selectedDate && dateRows.length) {
      setSelectedDate(dateRows[0].activity_date);
    }
  }, [dateRows, selectedDate]);

  const { data: logsData, isFetching: fetchingLogs } =
    useGetActivityLogsByDateQuery(
      selectedDate
        ? {
          date: selectedDate,
          access_token,
          user_id: filters.user_id,
          event_category: filters.event_category,
          event_action: filters.event_action,
          outcome: filters.outcome,
          entity_type: filters.entity_type,
          limit: filters.limit,
          offset: (filters.page - 1) * filters.limit,
        }
        : skipToken,
      { skip: !selectedDate }
    );
  const logs = logsData?.data || [];
  const pagination = logsData?.pagination || {
    limit: filters.limit,
    offset: (filters.page - 1) * filters.limit,
    count: logs.length,
  };

  // Fetch meta lists (categories, actions, metadata keys)
  const { data: metaData } = useGetActivityLogMetaQuery({
    access_token,
    user_id: filters.user_id,
  });
  const metaCategories = metaData?.categories || [];
  const metaActions = metaData?.actions || [];
  const metaKeysApi = metaData?.metadata_keys || [];
  const EXCLUDED_META_KEYS = useMemo(
    () => new Set(["title", "course_title", "coursetitle", "enrollment_id"]),
    []
  );
  const metaKeys = useMemo(() => {
    const s = new Set();
    // Include from API, excluding disallowed keys
    metaKeysApi.forEach((k) => {
      const lk = String(k).toLowerCase();
      if (!EXCLUDED_META_KEYS.has(lk)) s.add(k);
    });
    // Include from currently loaded logs, excluding disallowed keys
    logs.forEach((l) => {
      if (l.metadata && typeof l.metadata === "object") {
        Object.keys(l.metadata).forEach((k) => {
          const lk = String(k).toLowerCase();
          if (!EXCLUDED_META_KEYS.has(lk)) s.add(k);
        });
      }
    });
    return Array.from(s).sort();
  }, [metaKeysApi, logs, EXCLUDED_META_KEYS]);

  // Combine live derived categories (from currently loaded logs) with meta endpoint categories for freshness
  const derivedCategories = useMemo(() => {
    const set = new Set(metaCategories);
    logs.forEach((l) => {
      if (l.event_category) set.add(l.event_category);
    });
    return Array.from(set).sort();
  }, [logs, metaCategories]);

  const filteredLogs = useMemo(() => {
    if (!metadataTerms.length) return logs;
    return logs.filter((l) => {
      const metaStr = JSON.stringify(l.metadata || {}).toLowerCase();
      return metadataTerms.every((t) => metaStr.includes(t));
    });
  }, [logs, metadataTerms]);

  const totalPages = pagination.limit
    ? Math.max(1, Math.ceil((pagination.count || 0) / pagination.limit))
    : 1;

  useEffect(() => {
    if (selectedDate) {
      if (filters.page !== 1) dispatch(setFilters({ ...filters, page: 1 }));
    }
  }, [selectedDate]);

  const applyFilters = () => {
    let { start_date, end_date } = draftFilters;
    if (start_date && end_date && start_date > end_date) {
      [start_date, end_date] = [end_date, start_date];
    }
    dispatch(
      setFilters({
        ...filters,
        start_date,
        end_date,
        event_category: draftFilters.event_category.trim() || "",
        event_action: draftFilters.event_action.trim() || "",
        outcome: draftFilters.outcome || "",
        page: 1,
      })
    );
    setSelectedDate("");
  };

  const resetFilters = () => {
    setDraftFilters({
      start_date: "",
      end_date: "",
      event_category: "",
      event_action: "",
      outcome: "",
    });
    dispatch(
      setFilters({
        ...filters,
        start_date: "",
        end_date: "",
        event_category: "",
        event_action: "",
        outcome: "",
        page: 1,
      })
    );
    setSelectedDate("");
  };

  const removeActiveFilter = (key) => {
    dispatch(setFilters({ ...filters, [key]: "", page: 1 }));
    setSelectedDate("");
  };

  const addMetadataTerm = () => {
    const t = metadataTermInput.trim().toLowerCase();
    if (t && !metadataTerms.includes(t))
      setMetadataTerms((prev) => [...prev, t]);
    setMetadataTermInput("");
  };
  const removeMetadataTerm = (t) =>
    setMetadataTerms((prev) => prev.filter((x) => x !== t));
  const clearMetadataTerms = () => setMetadataTerms([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const uid = params.get("user_id");
    if (uid && uid !== String(filters.user_id || "")) {
      setMetadataTerms([]);
      setDraftFilters({
        start_date: "",
        end_date: "",
        event_category: "",
        event_action: "",
        outcome: "",
      });
      dispatch(
        setFilters({
          page: 1,
          limit: filters.limit,
          user_id: uid,
          event_category: "",
          event_action: "",
          outcome: "",
          entity_type: "",
          start_date: "",
          end_date: "",
          search: "",
        })
      );
      setSelectedDate("");
    }
  }, [location.search]);

  const calendar = useMemo(() => {
    const toMonthKey = (d) => {
      const parts = (d.activity_date || d).split("-");
      const y = parts[0];
      const m = parts[1];
      const monthIdx = Number(m) - 1;
      const monthName = new Date(Number(y), monthIdx, 1).toLocaleString([], {
        month: "long",
      });
      return { y, monthIdx, monthName, key: `${y}-${m}` };
    };

    const map = new Map();
    const availableYears = new Set();

    dateRows.forEach((row) => {
      const { y, monthIdx, monthName, key } = toMonthKey(row);
      availableYears.add(y);
      if (!map.has(y)) map.set(y, new Map());
      const mMap = map.get(y);
      if (!mMap.has(key))
        mMap.set(key, { y, monthIdx, monthName, key, items: [] });
      mMap.get(key).items.push(row);
    });

    // Filter by selected year
    const yearData = map.get(selectedYear);
    const months = yearData
      ? Array.from(yearData.values())
        .sort((a, b) => b.monthIdx - a.monthIdx)
        .map((m) => ({
          ...m,
          items: m.items.sort((a, b) => {
            const da = new Date(a.activity_date || a);
            const db = new Date(b.activity_date || b);
            return db - da;
          }),
        }))
      : [];

    return {
      availableYears: Array.from(availableYears).sort(
        (a, b) => Number(b) - Number(a)
      ),
      months,
    };
  }, [dateRows, selectedYear]);

  const toggleMonth = (monthKey) => {
    setExpandedMonths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey);
      } else {
        newSet.add(monthKey);
      }
      return newSet;
    });
  };

  const analytics = useMemo(() => {
    const total = filteredLogs.length;
    let success = 0,
      failure = 0,
      na = 0;
    const byCategory = new Map();
    filteredLogs.forEach((l) => {
      const oc = (l.outcome || "n/a").toLowerCase();
      if (oc === "success") success++;
      else if (oc === "failure") failure++;
      else na++;
      const cat = l.event_category || "other";
      byCategory.set(cat, (byCategory.get(cat) || 0) + 1);
    });
    const topCategories = Array.from(byCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return { total, success, failure, na, topCategories };
  }, [filteredLogs]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b pl-0 sm:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full p-4">
          <div className="flex items-center justify-between">
            {/* Left Section: Title and Subtitle */}
            <div className="flex-1 mx-2">
              <h1 className="text-xl text-center md:text-start md:text-2xl font-bold text-forestGreen">
                User Activity Logs
              </h1>
              {/* <span>
                Total: {pagination.count ?? logs.length}
              </span> */}

              <p className="text-sm text-center md:text-start md:text-base text-gray-600 mt-1">
                Monitor and analyze user activities
              </p>
            </div>

            {/* Right Section: Buttons */}
            <div className="flex items-center gap-4 flex-wrap relative">
              {/* Back Button */}
              <button
                onClick={() => navigate("/admin/dashboard/users")}
                className="flex items-center gap-2 sm:px-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline font-medium">Back</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex-1 overflow-y-auto p-4 sm:px-6">
        {/* Filters Section */}
        <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden mb-4 sm:mb-6">
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowFilters((s) => !s)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${showFilters
                    ? "bg-green-100 text-leafGreen border border-leafGreen"
                    : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                    }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M3 5a1 1 0 011-1h12a1 1 0 01.8 1.6l-3.9 5.2a2 2 0 00-.4 1.2v2.3a1 1 0 01-.553.894l-2 1A1 1 0 018 15.5V12a2 2 0 00-.4-1.2L3.2 5.6A1 1 0 013 5z" />
                  </svg>
                  Filters
                  {showFilters && (
                    <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                      Open
                    </span>
                  )}
                </button>
                {(filters.start_date ||
                  filters.end_date ||
                  filters.event_category ||
                  filters.event_action ||
                  filters.outcome) && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Active:</span>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                        {
                          [
                            "start_date",
                            "end_date",
                            "event_category",
                            "event_action",
                            "outcome",
                          ].filter((k) => filters[k]).length
                        }
                      </span>
                    </div>
                  )}
              </div>
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <ExportControls
                    access_token={access_token}
                    filters={filters}
                    selectedDate={selectedDate}
                  />
                </div>
                <button
                  onClick={resetFilters}
                  className="text-sm px-3 sm:px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors font-medium flex-1 sm:flex-none"
                >
                  Reset
                </button>
                <button
                  onClick={applyFilters}
                  className="text-sm px-3 sm:px-4 py-2 rounded-lg bg-leafGreen text-white hover:bg-primary transition-colors font-medium shadow-sm flex-1 sm:flex-none"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="p-4 sm:p-6 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={draftFilters.start_date}
                    onChange={(e) =>
                      setDraftFilters((f) => ({
                        ...f,
                        start_date: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen transition-colors text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={draftFilters.end_date}
                    onChange={(e) =>
                      setDraftFilters((f) => ({ ...f, end_date: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen transition-colors text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    value={draftFilters.event_category}
                    onChange={(e) =>
                      setDraftFilters((f) => ({
                        ...f,
                        event_category: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen bg-white text-sm"
                  >
                    <option value="">Any category</option>
                    {derivedCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Action
                  </label>
                  <select
                    value={draftFilters.event_action}
                    onChange={(e) =>
                      setDraftFilters((f) => ({
                        ...f,
                        event_action: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen bg-white text-sm"
                  >
                    <option value="">Any action</option>
                    {metaActions.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Outcome
                  </label>
                  <select
                    value={draftFilters.outcome}
                    onChange={(e) =>
                      setDraftFilters((f) => ({ ...f, outcome: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen transition-colors text-sm"
                  >
                    <option value="">Any outcome</option>
                    <option value="success">Success</option>
                    <option value="failure">Failure</option>
                    <option value="n/a">N/A</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    Metadata
                    {!!metadataTerms.length && (
                      <button
                        type="button"
                        onClick={clearMetadataTerms}
                        className="text-xs text-gray-500 hover:text-red-600"
                      >
                        Clear
                      </button>
                    )}
                  </label>
                  <div className="flex gap-2 items-stretch">
                    <select
                      value={metadataTermInput}
                      onChange={(e) => setMetadataTermInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen bg-white text-sm"
                    >
                      <option value="">Select key...</option>
                      {metaKeys.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addMetadataTerm}
                      disabled={!metadataTermInput}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-40 rounded-lg text-sm font-medium transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active filter chips */}
          {(filters.start_date ||
            filters.end_date ||
            filters.event_category ||
            filters.event_action ||
            filters.outcome ||
            metadataTerms.length > 0) && (
              <div className="px-4 sm:px-6 py-4 bg-white border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {[
                    "start_date",
                    "end_date",
                    "event_category",
                    "event_action",
                    "outcome",
                  ].map((k) =>
                    filters[k] ? (
                      <span
                        key={k}
                        className="inline-flex items-center gap-2 bg-green-100 text-leafGreen border border-leafGreen px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium"
                      >
                        {k.replace("_", " ")}: <strong>{filters[k]}</strong>
                        <button
                          onClick={() => removeActiveFilter(k)}
                          className="hover:text-red-500 ml-1"
                          aria-label="remove"
                        >
                          ×
                        </button>
                      </span>
                    ) : null
                  )}
                  {metadataTerms.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 border border-gray-200 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm"
                    >
                      meta: <strong>{t}</strong>
                      <button
                        onClick={() => removeMetadataTerm(t)}
                        className="hover:text-red-500 ml-1"
                        aria-label="remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {!!metadataTerms.length && (
                    <button
                      onClick={clearMetadataTerms}
                      className="text-xs sm:text-sm text-gray-500 underline hover:text-gray-700"
                    >
                      clear all
                    </button>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Mobile Analytics Bar */}
        <div className="lg:hidden bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4 sm:mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl bg-gray-50">
              <div className="text-xs text-gray-600 mb-1">Total</div>
              <div className="text-lg font-bold text-gray-900">
                {analytics.total}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-green-50">
              <div className="text-xs text-green-700 mb-1">Success</div>
              <div className="text-lg font-bold text-green-700">
                {analytics.success}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-red-50">
              <div className="text-xs text-red-700 mb-1">Failure</div>
              <div className="text-lg font-bold text-red-700">
                {analytics.failure}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Stacked on mobile, side-by-side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)_20rem] gap-4 sm:gap-6">
          {/* Calendar Panel */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden order-3 lg:order-1">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Activity Calendar
                </h3>
                {fetchingDates && (
                  <span className="text-xs text-leafGreen animate-pulse">
                    Loading...
                  </span>
                )}
              </div>

              {/* Year Selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">
                  Select Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setExpandedMonths(new Set());
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen bg-white"
                >
                  {calendar.availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="max-h-[40vh] lg:max-h-[60vh] overflow-y-auto">
              {calendar.months.length === 0 && !fetchingDates && (
                <div className="p-6 text-center text-sm text-gray-500">
                  No activity data for {selectedYear}
                </div>
              )}

              <div className="p-2 space-y-2">
                {calendar.months.map((m) => {
                  const monthTotal = m.items.reduce(
                    (acc, r) => acc + (r.count || r.total || 0),
                    0
                  );
                  const isExpanded = expandedMonths.has(m.key);

                  return (
                    <div
                      key={m.key}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleMonth(m.key)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""
                              }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                          <span className="text-sm font-medium text-gray-900">
                            {m.monthName}
                          </span>
                        </div>
                        {monthTotal > 0 && (
                          <span className="text-xs px-2 py-1 rounded-full bg-primary text-leafGreen font-medium">
                            {monthTotal}
                          </span>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-200">
                          {m.items.map((dObj) => {
                            const d = dObj.activity_date || dObj;
                            const active = d === selectedDate;
                            const count = dObj.count || dObj.total || "";
                            const dateObj = new Date(d);
                            const dayName = dateObj.toLocaleDateString([], {
                              weekday: "short",
                            });
                            const dayNum = dateObj.getDate();

                            return (
                              <button
                                key={d}
                                onClick={() => setSelectedDate(d)}
                                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors border-b border-gray-100 last:border-b-0 ${active
                                  ? "bg-green-50 text-leafGreen border-l-4 border-l-primary"
                                  : "hover:bg-gray-50 text-gray-700"
                                  }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`text-center ${active ? "text-leafGreen" : "text-gray-500"
                                      }`}
                                  >
                                    <div className="text-xs font-medium">
                                      {dayName}
                                    </div>
                                    <div className="text-lg font-bold">
                                      {dayNum}
                                    </div>
                                  </div>
                                  <span className="text-sm">{d}</span>
                                </div>
                                {count !== "" && (
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full font-medium ${active
                                      ? "bg-primary text-forestGreen"
                                      : "bg-gray-200 text-gray-600"
                                      }`}
                                  >
                                    {count}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center: Logs Panel */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col order-1 lg:order-2">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {selectedDate
                      ? `Activity for ${selectedDate}`
                      : "Select a date"}
                  </h3>
                  {selectedDate && (
                    <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">
                      (latest first)
                    </span>
                  )}
                </div>

                {selectedDate && (
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500 flex-wrap">
                    <span className="bg-gray-100 px-2 py-1 rounded-full">
                      Total: {pagination.count ?? logs.length}
                    </span>
                    {metadataTerms.length > 0 && (
                      <span className="bg-green-100 text-leafGreen px-2 py-1 rounded-full">
                        Filtered: {filteredLogs.length}
                      </span>
                    )}
                    {totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          className="px-2 sm:px-3 py-1 rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors text-xs"
                          disabled={filters.page <= 1 || fetchingLogs}
                          onClick={() =>
                            dispatch(
                              setFilters({ ...filters, page: filters.page - 1 })
                            )
                          }
                        >
                          Prev
                        </button>
                        <span className="font-mono text-xs sm:text-sm px-1 sm:px-2">
                          {filters.page}/{totalPages}
                        </span>
                        <button
                          className="px-2 sm:px-3 py-1 rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors text-xs"
                          disabled={filters.page >= totalPages || fetchingLogs}
                          onClick={() =>
                            dispatch(
                              setFilters({ ...filters, page: filters.page + 1 })
                            )
                          }
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[50vh] lg:max-h-[70vh]">
              {fetchingLogs ? (
                <AdminLoader fullScreen={false} message="Loading activity logs..." />
              ) : logs.length > 0 ? (
                filteredLogs.map((ev) => {
                  const meta =
                    ev.metadata && typeof ev.metadata === "object"
                      ? ev.metadata
                      : null;
                  const outcome = ev.outcome || "n/a";
                  const outcomeClass =
                    outcomeStyles[outcome] || outcomeStyles["n/a"];
                  const courseHash = meta?.course_public_hash;
                  const courseTitle = meta?.course_title;
                  const isCourseEvent =
                    (ev.entity_type || "").toLowerCase() === "course" &&
                    !!ev.entity_id;
                  return (
                    <div key={ev.id} className="relative pl-6 sm:pl-8 group">
                      <span
                        className="absolute left-3 sm:left-[17px] top-0 h-full w-px bg-gradient-to-b from-leafGreen via-primary to-transparent"
                        aria-hidden="true"
                      />
                      <span className="absolute left-2 sm:left-3 top-1 w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-primary ring-2 sm:ring-4 ring-leafGreen/20 group-hover:scale-110 transition-transform" />
                      <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-3 mb-2">
                        <span className="text-xs sm:text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                          {formatTime(ev.occurred_at || ev.created_at)}
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900 flex-1">
                          {meta?.title ||
                            `${ev.event_category}.${ev.event_action}`}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ring-1 font-medium ${outcomeClass}`}
                        >
                          {outcome}
                        </span>
                        {isCourseEvent && courseHash && (
                          <PermissionWrapper action="view" section="User Activity Logs">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/admin/dashboard/students/courseProgress/${slugify(
                                    courseTitle ||
                                    `course-${ev.entity_id ||
                                    meta?.course?.id ||
                                    "unknown"
                                    }`
                                  )}`,
                                  {
                                    state: {
                                      courseId: ev.entity_id,
                                      coursePublicHash: courseHash,
                                      courseTitle: courseTitle,
                                      userId: filters.user_id
                                        ? Number(filters.user_id)
                                        : undefined,
                                    },
                                  }
                                )
                              }
                              className="inline-flex items-center gap-1 text-xs font-medium px-2 sm:px-3 py-1 rounded-md border border-primary text-white bg-primary hover:bg-leafGreen"
                              title="View student's course progress"
                            >
                              View Progress
                            </button>
                          </PermissionWrapper>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-x-4 sm:gap-y-2 mb-3">
                        {ev.entity_type && (
                          <span>
                            Entity:{" "}
                            <strong className="text-gray-900">
                              {ev.entity_type}
                            </strong>
                          </span>
                        )}
                        {meta?.course_title && (
                          <span
                            className="text-primary"
                            title={meta.course_title}
                          >
                            Course:{" "}
                            <strong>
                              {meta.course_title.slice(0, 30)}
                              {meta.course_title.length > 30 ? "…" : ""}
                            </strong>
                          </span>
                        )}
                        {ev.user_agent && (
                          <span
                            className="truncate max-w-xs text-gray-500"
                            title={ev.user_agent}
                          >
                            Agent: {ev.user_agent.slice(0, 40)}
                            {ev.user_agent.length > 40 ? "…" : ""}
                          </span>
                        )}
                      </div>
                      {meta && Object.keys(meta).length > 0 && (
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {(() => {
                            const entries = Object.entries(meta).filter(
                              ([k]) =>
                                !EXCLUDED_META_KEYS.has(String(k).toLowerCase())
                            );
                            return (
                              <>
                                {entries.slice(0, 4).map(([k, v]) => (
                                  <span
                                    key={k}
                                    className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-md border border-gray-200"
                                    title={`${k}: ${typeof v === "object"
                                      ? JSON.stringify(v)
                                      : v
                                      }`}
                                  >
                                    <span className="font-medium">{k}:</span>{" "}
                                    {typeof v === "object"
                                      ? JSON.stringify(v).slice(0, 15) + "…"
                                      : String(v).slice(0, 20)}
                                    {String(v).length > 20 ? "…" : ""}
                                  </span>
                                ))}
                                {entries.length > 4 && (
                                  <span className="text-xs text-gray-400 italic">
                                    +{entries.length - 4} more
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg
                    className="w-12 h-12 mx-auto mb-2 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  No events found for this date
                </div>
              )}
            </div>
          </div>

          <div className="lg:hidden bg-white border border-gray-200 rounded-2xl shadow-sm p-4 order-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Categories
            </h3>
            <div className="space-y-3">
              {analytics.topCategories.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">
                  No category data available
                </div>
              )}
              {analytics.topCategories.map(([cat, cnt]) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span
                    className="text-sm font-medium text-gray-900 truncate"
                    title={cat}
                  >
                    {cat}
                  </span>
                  <span className="text-sm px-3 py-1 rounded-full bg-leafGreen/10 text-primary font-semibold">
                    {cnt}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Analytics Sidebar - Hidden on mobile, shown on xl screens */}
          <aside className="hidden lg:block order-3">
            <div className="sticky top-6 space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Analytics Overview
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center p-4 rounded-xl bg-gray-50">
                    <div className="text-sm text-gray-600 mb-1">Total Events</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {analytics.total}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-xl bg-green-50">
                      <div className="text-xs text-green-700 mb-1">Success</div>
                      <div className="text-xl font-bold text-green-700">
                        {analytics.success}
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-red-50">
                      <div className="text-xs text-red-700 mb-1">Failure</div>
                      <div className="text-xl font-bold text-red-700">
                        {analytics.failure}
                      </div>
                    </div>
                  </div>
                  {analytics.na > 0 && (
                    <div className="text-center text-sm text-gray-500 bg-gray-50 py-2 rounded-lg">
                      N/A: {analytics.na}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Top Categories
                </h3>
                <div className="space-y-3">
                  {analytics.topCategories.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No category data available
                    </div>
                  )}
                  {analytics.topCategories.map(([cat, cnt]) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span
                        className="text-sm font-medium text-gray-900 truncate"
                        title={cat}
                      >
                        {cat}
                      </span>
                      <span className="text-sm px-3 py-1 rounded-full bg-leafGreen/10 text-primary font-semibold">
                        {cnt}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

// Export controls component (scopes: date, month, year, all)
const ExportControls = ({ access_token, filters, selectedDate }) => {
  const [scope, setScope] = useState("date");
  const [month, setMonth] = useState(""); // YYYY-MM
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (selectedDate) setScope("date");
  }, [selectedDate]);

  const triggerDownload = async () => {
    try {
      setDownloading(true);
      const params = new URLSearchParams();
      params.append("scope", scope);
      if (filters.user_id) params.append("user_id", filters.user_id);
      if (filters.event_category)
        params.append("event_category", filters.event_category);
      if (filters.event_action)
        params.append("event_action", filters.event_action);
      if (filters.outcome) params.append("outcome", filters.outcome);
      if (filters.entity_type)
        params.append("entity_type", filters.entity_type);
      if (scope === "date") {
        if (!selectedDate) return;
        params.append("date", selectedDate);
      } else if (scope === "month") {
        if (!month) return;
        params.append("month", month);
      } else if (scope === "year") {
        params.append("year", year);
      } else if (scope === "all") {
        if (filters.start_date) params.append("start_date", filters.start_date);
        if (filters.end_date) params.append("end_date", filters.end_date);
      }
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL
        }/activity/logs/export?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      let filename = "activity-export.csv";
      if (cd) {
        const match = cd.match(/filename="?([^";]+)"?/);
        if (match) filename = match[1];
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={scope}
        onChange={(e) => setScope(e.target.value)}
        className="flex-1 min-w-[100px] text-sm border border-gray-200 rounded-md px-2 py-2 bg-white"
      >
        <option value="date" disabled={!selectedDate}>
          Date
        </option>
        <option value="month">Month</option>
        <option value="year">Year</option>
        <option value="all">All/Range</option>
      </select>
      {scope === "month" && (
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="flex-1 min-w-[100px] text-sm border border-gray-200 rounded-md px-2 py-2"
        />
      )}
      {scope === "year" && (
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="flex-1 min-w-[80px] text-sm border border-gray-200 rounded-md px-2 py-2"
        />
      )}
      <button
        type="button"
        onClick={triggerDownload}
        disabled={
          downloading ||
          (scope === "date" && !selectedDate) ||
          (scope === "month" && !month)
        }
        className="flex-1 min-w-[80px] inline-flex items-center justify-center gap-1 text-sm px-2 sm:px-3 py-2 rounded-md bg-leafGreen text-white hover:bg-primary disabled:opacity-50"
      >
        {downloading ? "Exporting..." : "Export"}
      </button>
    </div>
  );
};

export default UserActivityLog;