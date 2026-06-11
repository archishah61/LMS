/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from "react";
import { Trophy, ArrowLeft, Award, AlertTriangle, Medal, Flame, Star, Users } from "lucide-react";
import {
  useGetTopPerformersByChallengeCategoryQuery,
  useGetUsersWithHighestPointsQuery,
} from "../../../services/Reporting/leaderboardAnalyticsApi";
import { getAdminToken } from "../../../services/CookieService";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import AdminLoader from "../../../components/admin/AdminLoader";

// Enhanced Modal with better transitions and animations
function Modal({ children, onClose }) {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => setShow(true), 10);
    const handleEscape = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
      clearTimeout(timer);
    };
  }, []);

  const handleClose = () => {
    setLeaving(true);
    setShow(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 overflow-hidden">
      <div
        className={`fixed inset-0 bg-black/50 transition-all duration-300 ease-in-out ${show ? "opacity-100" : "opacity-0"
          }`}
        style={{
          backdropFilter: `blur(${show ? "2px" : "0px"})`,
          transform: `scale(${leaving ? 1.05 : 1})`,
        }}
        onClick={handleClose}
      />
      <div
        className="relative z-10 w-full max-w-md transition-all duration-300 ease-out"
        style={{
          opacity: show ? 1 : 0,
          transform: show
            ? "translateY(0) scale(1)"
            : leaving
              ? "translateY(10px) scale(0.95)"
              : "translateY(-20px) scale(0.95)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function getInitials(name) {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const MEDAL_COLORS = [
  { bg: "bg-yellow-100", border: "border-yellow-400", text: "text-yellow-700", shadow: "0 6px 18px rgba(234, 179, 8, 0.3)", label: "🥇" },
  { bg: "bg-gray-100", border: "border-gray-400", text: "text-gray-600", shadow: "0 4px 12px rgba(156, 163, 175, 0.3)", label: "🥈" },
  { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-700", shadow: "0 4px 12px rgba(234, 138, 60, 0.3)", label: "🥉" },
];

const PODIUM_HEIGHTS = ["h-36 md:h-44", "h-28 md:h-36", "h-24 md:h-28"];

const Podium = ({ users }) => {
  const podiumOrder = [0, 1, 2];
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
  }, []);

  return (
    <div className="flex justify-center items-end gap-3 md:gap-6 w-full mb-4 md:mb-6 pt-4">
      {podiumOrder.length > 0 ? (
        podiumOrder.map((pos, idx) => {
          const user = users[pos];
          if (!user) return <div key={idx} className="flex-1" />;
          const isFirst = pos === 0;
          const delay = (idx + 1) * 150;
          const medal = MEDAL_COLORS[pos];

          return (
            <div
              key={user.user_id || user.id || idx}
              className={`flex flex-col items-center flex-1 transition-all duration-700 ease-out ${isFirst ? "z-10" : ""}`}
              style={{
                transform: animate ? "translateY(0)" : "translateY(50px)",
                opacity: animate ? 1 : 0,
                transitionDelay: `${delay}ms`,
              }}
            >
              {/* Medal emoji */}
              <div className="text-xl md:text-2xl mb-1">{medal.label}</div>
              {/* Avatar */}
              <div
                className={`rounded-full border-3 md:border-4 ${medal.border} bg-white flex items-center justify-center mb-2 transition-all duration-300 relative`}
                style={{
                  width: isFirst ? 68 : 54,
                  height: isFirst ? 68 : 54,
                  boxShadow: medal.shadow,
                }}
              >
                {user.profile_image ? (
                  <img
                    src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${user.profile_image || "/placeholder.png"}`}
                    alt={user.full_name || user.user_name}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = "/path/to/default/image.jpg"; }}
                  />
                ) : (
                  <span className={`text-lg md:text-2xl font-bold ${isFirst ? "text-forestGreen" : "text-gray-500"}`}>
                    {getInitials(user.full_name || user.user_name)}
                  </span>
                )}
              </div>
              {/* Name */}
              <span className={`font-semibold ${isFirst ? "text-sm md:text-base" : "text-xs md:text-sm"} text-gray-800 text-center truncate max-w-[100px] md:max-w-[140px]`}>
                {user.full_name || user.user_name}
              </span>
              {/* Points */}
              <span className={`text-[10px] md:text-xs font-medium ${medal.text} mb-2`}>
                {user.points_earned} pts
              </span>
              {/* Podium bar */}
              <div className={`w-full ${PODIUM_HEIGHTS[pos]} rounded-t-xl flex items-start justify-center pt-2 md:pt-3 ${isFirst ? "bg-gradient-to-b from-leafGreen/20 to-leafGreen/5 border-t-2 border-leafGreen/30" : pos === 1 ? "bg-gradient-to-b from-gray-100 to-gray-50 border-t-2 border-gray-300" : "bg-gradient-to-b from-orange-100/60 to-orange-50/30 border-t-2 border-orange-300/50"}`}>
                <span className={`font-bold text-sm md:text-lg ${isFirst ? "text-forestGreen" : pos === 1 ? "text-gray-600" : "text-orange-600"}`}>#{pos + 1}</span>
              </div>
            </div>
          );
        })
      ) : (
        <div className="flex flex-col items-center justify-center w-full text-gray-500">
          <Trophy className="w-8 h-8 md:w-12 md:h-12 mb-1 md:mb-2" />
          <p className="text-xs md:text-sm">No users available</p>
        </div>
      )}
    </div>
  );
};

const CategoryUsersModal = ({ category, onClose }) => {
  if (!category) return null;
  const users = [...category.student_list].sort(
    (a, b) => b.total_points - a.total_points
  );
  const [animateItems, setAnimateItems] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimateItems(true), 300);
  }, []);

  return (
    <Modal onClose={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-4 md:p-8 w-full h-[400px] md:h-[500px] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-2 md:mb-4">
          <div className="font-bold text-base md:text-lg text-gray-800 flex items-center gap-1.5 md:gap-2">
            <span className="w-1.5 h-4 md:w-2 md:h-5 bg-lightGreen rounded-full"></span>
            {category.category_name} - All Performers
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-forestGreen transition-colors duration-200 h-6 w-6 md:h-8 md:w-8 rounded-full flex items-center justify-center hover:bg-lightGreen"
          >
            <span className="text-lg md:text-xl font-bold">&times;</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {users.length === 0 ? (
            <div className="text-center text-gray-400 py-6 md:py-10">
              <p className="text-xs md:text-sm">No users found for this category.</p>
            </div>
          ) : (
            users.map((user, idx) => (
              <div
                key={user.user_id || user.id || idx}
                className="flex items-center gap-2 md:gap-3 py-1.5 md:py-2 px-1.5 md:px-2 rounded hover:bg-lightGreen cursor-pointer transition"
                style={{
                  opacity: animateItems ? 1 : 0,
                  transform: animateItems ? "translateY(0)" : "translateY(10px)",
                  transition: "all 0.3s ease-out",
                  transitionDelay: `${idx * 50}ms`,
                }}
              >
                <span className="w-6 md:w-8 text-center font-bold text-forestGreen text-xs md:text-sm">
                  {idx + 1}
                </span>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 flex items-center justify-center text-base md:text-lg font-bold text-forestGreen overflow-hidden">
                  {user.profile_image ? (
                    <img
                      src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${user.profile_image || "/placeholder.png"
                        }`}
                      alt={user.full_name || user.user_name}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/path/to/default/image.jpg";
                      }}
                    />
                  ) : (
                    getInitials(user.full_name || user.user_name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs md:text-sm text-gray-800 truncate">
                    {user.full_name || user.user_name}
                  </div>
                  <div className="text-[10px] md:text-xs text-gray-500 truncate">
                    {user.email}
                  </div>
                </div>
                <div className="font-semibold text-forestGreen text-xs md:text-sm">
                  {user.total_points}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

const LeaderboardAnalytics = () => {
  const { access_token } = getAdminToken();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryModal, setCategoryModal] = useState(null);
  const [animateContent, setAnimateContent] = useState(false);
  const navigate = useNavigate();
  const { id } = useSelector((state) => state.user);

  useEffect(() => {
    if (!id) {
      navigate("/admin/login");
    }
    setTimeout(() => {
      setIsInitialLoading(false);
      setTimeout(() => setAnimateContent(true), 100);
    }, 500);
  }, [id, navigate]);

  const {
    data: topPerformersData,
    isLoading: loadingTop,
    error: errorTop,
  } = useGetTopPerformersByChallengeCategoryQuery({
    access_token,
  });

  const {
    data: highestPointsData,
    isLoading: loadingPoints,
    error: errorPoints,
  } = useGetUsersWithHighestPointsQuery({
    access_token,
  });

  const isLoading = loadingTop || loadingPoints || isInitialLoading;
  const error = errorTop || errorPoints;

  const users = highestPointsData?.data || [];
  const podiumUsers = users.slice(0, 3);
  const leaderboardUsers = users;

  const openUserModal = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const closeUserModal = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedUser(null), 300);
  };

  if (isLoading) {
    return <AdminLoader className="h-screen" message="Loading leaderboard data..." />;
  }

  if (error) {
    return (
      <div className="p-3 md:p-6 max-w-full mx-2 md:mx-10 bg-white min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 md:p-6 text-red-600 shadow-lg max-w-3xl mx-auto">
          <h2 className="text-base md:text-xl font-bold mb-1.5 md:mb-2 flex items-center gap-1.5 md:gap-2">
            <AlertTriangle className="w-4 h-4 md:w-6 md:h-6" />
            Error Loading Data
          </h2>
          <p className="text-xs md:text-sm">
            {error.message || "Failed to load leaderboard data"}
          </p>
          <button
            className="mt-3 md:mt-4 px-2.5 py-1.5 md:px-4 md:py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-xs md:text-sm"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full p-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 mx-2">
              <h1 className="text-xl text-center md:text-start md:text-2xl font-bold  text-forestGreen">
                Leaderboard
              </h1>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 sm:px-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Back</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Stat Summary Cards */}
        <div className={`w-full max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6 transition-all duration-500 ease-out ${animateContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="bg-white rounded-xl shadow-lg p-3 md:p-5 border border-leafGreen/20 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">Total Participants</p>
                <h3 className="text-lg md:text-2xl font-bold text-gray-800 mt-1">{users.length}</h3>
              </div>
              <div className="bg-lightGreen p-2 rounded-lg"><Users className="w-4 h-4 md:w-5 md:h-5 text-leafGreen" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-3 md:p-5 border border-leafGreen/20 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">Top Score</p>
                <h3 className="text-lg md:text-2xl font-bold text-gray-800 mt-1">{users[0]?.points_earned || 0}</h3>
              </div>
              <div className="bg-lightGreen p-2 rounded-lg"><Trophy className="w-4 h-4 md:w-5 md:h-5 text-leafGreen" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-3 md:p-5 border border-leafGreen/20 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">Avg Points</p>
                <h3 className="text-lg md:text-2xl font-bold text-gray-800 mt-1">{users.length > 0 ? Math.round(users.reduce((s, u) => s + (u.points_earned || 0), 0) / users.length) : 0}</h3>
              </div>
              <div className="bg-lightGreen p-2 rounded-lg"><Star className="w-4 h-4 md:w-5 md:h-5 text-leafGreen" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-3 md:p-5 border border-leafGreen/20 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">Categories</p>
                <h3 className="text-lg md:text-2xl font-bold text-gray-800 mt-1">{topPerformersData?.data?.length || 0}</h3>
              </div>
              <div className="bg-lightGreen p-2 rounded-lg"><Award className="w-4 h-4 md:w-5 md:h-5 text-leafGreen" /></div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 md:gap-8">
          {/* Main Content: Podium and Leaderboard */}
          <div
            className={`flex-1 flex flex-col gap-4 md:gap-6 transition-all duration-500 ease-out ${animateContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            style={{ transitionDelay: "100ms" }}
          >
            {/* Podium */}
            <div className="bg-white rounded-xl shadow-lg p-3 md:p-6 md:mb-2 hover:shadow-xl transition-all duration-300 border border-leafGreen/10">
              <h2 className="text-sm md:text-base font-semibold text-forestGreen mb-2 flex items-center gap-2"><Medal className="w-4 h-4 md:w-5 md:h-5" /> Top Performers</h2>
              <Podium users={podiumUsers} />
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col h-[350px] md:h-[420px] max-h-[420px] hover:shadow-xl transition-all duration-300 border border-leafGreen/10">
              <h2 className="text-sm md:text-base font-semibold text-forestGreen mb-2 flex items-center gap-2"><Trophy className="w-4 h-4 md:w-5 md:h-5" /> Full Rankings</h2>
              {/* Static Header */}
              <div className="grid grid-cols-[40px_48px_1fr_70px_70px] md:grid-cols-[48px_56px_1fr_80px_80px] gap-1.5 md:gap-2 border-b pb-1.5 md:pb-2 mb-1.5 md:mb-2 mr-3">
                <span className="text-[10px] md:text-xs font-semibold text-gray-500 text-center">#</span>
                <span className="text-[10px] md:text-xs font-semibold text-gray-500"></span>
                <span className="text-[10px] md:text-xs font-semibold text-gray-500 truncate">Name</span>
                <span className="text-[10px] md:text-xs font-semibold text-gray-500 text-center">Points</span>
                <span className="text-[10px] md:text-xs font-semibold text-gray-500 text-center">Streak</span>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto transition-all custom-scrollbar">
                {leaderboardUsers.length === 0 ? (
                  <div className="text-center text-gray-400 py-6 md:py-10">
                    <p className="text-xs md:text-sm">No users found.</p>
                  </div>
                ) : (
                  leaderboardUsers.map((user, idx) => (
                    <div
                      key={user.user_id || user.id || idx}
                      className="grid grid-cols-[40px_48px_1fr_70px_70px] md:grid-cols-[48px_56px_1fr_80px_80px] gap-1.5 md:gap-2 py-1.5 md:py-2 px-1.5 md:px-2 rounded hover:bg-lightGreen cursor-pointer transition-all items-center"
                      onClick={() => openUserModal(user)}
                      style={{
                        opacity: animateContent ? 1 : 0,
                        transform: animateContent ? "translateY(0)" : "translateY(10px)",
                        transition: "all 0.3s ease-out",
                        transitionDelay: `${150 + idx * 30}ms`,
                      }}
                    >
                      {/* Rank */}
                      <span className={`text-center font-bold text-[10px] md:text-xs ${idx === 0 ? "text-yellow-600" : idx === 1 ? "text-gray-500" : idx === 2 ? "text-orange-600" : "text-forestGreen"}`}>
                        {idx < 3 ? MEDAL_COLORS[idx].label : idx + 1}
                      </span>

                      {/* Avatar */}
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-lg font-bold text-forestGreen overflow-hidden ${idx < 3 ? MEDAL_COLORS[idx].bg : "bg-gray-100"}`}>
                        {user.profile_image ? (
                          <img
                            src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${user.profile_image || "/placeholder.png"}`}
                            alt={user.full_name || user.user_name}
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/path/to/default/image.jpg";
                            }}
                          />
                        ) : (
                          getInitials(user.full_name || user.user_name)
                        )}
                      </div>

                      {/* Name and Email */}
                      <div className="min-w-0">
                        <div className="font-medium text-xs md:text-sm text-gray-800 truncate">
                          {user.full_name || user.user_name}
                        </div>
                        <div className="text-[10px] md:text-xs text-gray-500 truncate">
                          {user.email}
                        </div>
                      </div>

                      {/* Points */}
                      <div className="font-semibold text-forestGreen text-[10px] md:text-xs text-center">
                        {user.points_earned}
                      </div>

                      {/* Streak */}
                      <div className="flex items-center justify-center gap-1">
                        <svg
                          className="w-3 h-3 md:w-4 md:h-4 text-orange-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.52-.181-2.354.065-.252.147-.493.246-.723a.995.995 0 00-.197-1.091 1 1 0 00-1.414-.016c-.388.386-.72.829-.98 1.305-.255.472-.44.984-.547 1.511-.221 1.088-.126 2.236.262 3.267.41 1.087 1.152 1.965 2.036 2.569.244.165.5.316.767.45.415.21.84.385 1.274.521.423.134.857.234 1.295.3.286.043.575.066.865.066.858 0 1.696-.139 2.48-.4a6.97 6.97 0 002.053-1.021c.535-.386.992-.866 1.344-1.412.353-.545.6-1.149.73-1.787.153-.755.124-1.526-.08-2.259-.383-1.385-1.254-2.546-2.396-3.293a1 1 0 00-1.098.138c-.263.213-.494.463-.685.745-.117.174-.22.359-.305.554-.107.25-.183.513-.226.785-.043.273-.036.55.02.821.09.46.295.874.584 1.202.29.328.654.552 1.05.637.046.01.092.017.139.021.25.02.5-.03.728-.14a1 1 0 00.457-1.383z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-semibold text-orange-600 text-[10px] md:text-xs">
                          {user.current_streak || 0}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar: Top Performers by Category */}
          <div
            className={`w-full lg:w-[300px] md:w-[340px] flex-shrink-0 flex flex-col gap-4 md:gap-6 transition-all duration-500 ease-out ${animateContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 border border-leafGreen/10">
              <h2 className="text-lg sm:text-xl font-semibold text-forestGreen mb-2 md:mb-4 flex items-center gap-1.5 md:gap-2">
                <span className="w-1.5 h-5 bg-leafGreen rounded-full"></span>
                <Award className="w-5 h-5 text-forestGreen" /> Top by Category
              </h2>
              <div className="h-[400px] md:h-[595px] overflow-y-auto pr-1 custom-scrollbar">
                <div className="flex flex-col gap-2 md:gap-4">
                  {topPerformersData?.data?.length > 0 ? (
                    topPerformersData.data.map((cat, idx) => (
                      <div
                        key={idx}
                        className="border border-leafGreen/20 rounded-lg p-2 md:p-3 cursor-pointer hover:bg-lightGreen transition-all hover:shadow-md"
                        onClick={() => setCategoryModal(cat)}
                        style={{
                          opacity: animateContent ? 1 : 0,
                          transform: animateContent ? "translateY(0)" : "translateY(10px)",
                          transition: "all 0.3s ease-out",
                          transitionDelay: `${250 + idx * 50}ms`,
                        }}
                      >
                        <div className="font-medium md:font-semibold text-xs md:text-sm text-gray-700 mb-1.5 md:mb-2">
                          {cat.category_name}
                        </div>
                        {cat.student_list.length === 0 ? (
                          <div className="text-[10px] md:text-xs text-gray-400">
                            No top performer
                          </div>
                        ) : (
                          cat.student_list.slice(0, 1).map((stu, sidx) => (
                            <div
                              key={sidx}
                              className="flex items-center gap-2 md:gap-3 rounded-lg p-1.5 md:p-2"
                            >
                              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs md:text-base font-bold text-forestGreen overflow-hidden">
                                {stu.profile_image ? (
                                  <img
                                    src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${stu.profile_image || "/placeholder.png"
                                      }`}
                                    alt={stu.full_name || stu.user_name}
                                    className="w-full h-full object-cover rounded-full"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = "/path/to/default/image.jpg";
                                    }}
                                  />
                                ) : (
                                  getInitials(stu.full_name || stu.user_name)
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-xs md:text-sm text-gray-800 truncate">
                                  {stu.full_name || stu.user_name}
                                </div>
                                <div className="text-[10px] md:text-xs text-gray-500">
                                  {stu.total_points} pts
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-6 md:py-10">
                      <p className="text-xs md:text-sm">No category data.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {modalOpen && selectedUser && (
        <Modal onClose={closeUserModal}>
          <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-md">
            <div className="bg-leafGreen p-4 md:p-6 text-white relative">
              <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2">
                <button
                  className="text-white/80 hover:text-white transition-colors h-6 w-6 md:h-8 md:w-8 rounded-full flex items-center justify-center hover:bg-white/10"
                  onClick={closeUserModal}
                >
                  <span className="text-lg md:text-xl font-bold">&times;</span>
                </button>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/10 backdrop-blur-sm p-1 flex items-center justify-center mb-2 md:mb-3 border-2 border-white/30">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xl md:text-3xl font-bold text-forestGreen overflow-hidden">
                    {selectedUser.profile_image ? (
                      <img
                        src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${selectedUser.profile_image || "/placeholder.png"
                          }`}
                        alt={selectedUser.full_name || selectedUser.user_name}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/path/to/default/image.jpg";
                        }}
                      />
                    ) : (
                      getInitials(selectedUser.full_name || selectedUser.user_name)
                    )}
                  </div>
                </div>
                <div className="font-bold text-lg md:text-xl">
                  {selectedUser.full_name || selectedUser.user_name}
                </div>
                <div className="text-xs md:text-sm text-white/80 truncate w-full text-center">
                  {selectedUser.email}
                </div>
                <div className="mt-2 md:mt-3 bg-white/20 rounded-full px-3 py-1 backdrop-blur-sm">
                  <span className="font-bold text-xs md:text-sm">
                    {selectedUser.total_points}
                  </span>{" "}
                  points
                </div>
              </div>
            </div>
            <div className="p-3 md:p-6 w-full">
              {selectedUser.completed_challenges && (
                <div>
                  <div className="font-semibold text-forestGreen mb-1.5 md:mb-2 flex items-center gap-1.5 md:gap-2">
                    <Trophy className="w-3 h-3 md:w-4 md:h-4" /> Completed Challenges
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 md:p-3">
                    {Array.isArray(selectedUser.completed_challenges) &&
                      selectedUser.completed_challenges.length > 0 ? (
                      <ul className="space-y-1.5 md:space-y-2">
                        {selectedUser.completed_challenges.map((ch, i) => (
                          <li key={i} className="flex items-center gap-1.5 md:gap-2">
                            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-lightGreen rounded-full"></span>
                            <span className="text-xs md:text-sm text-gray-700 truncate">
                              {ch}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-xs md:text-sm text-gray-500 italic">
                        No challenges completed yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
              <button
                className="mt-4 md:mt-6 w-full py-1.5 md:py-2 bg-forestGreen text-white rounded-lg font-medium text-xs md:text-sm hover:bg-forestGreen/90 transition-colors duration-200 flex items-center justify-center gap-1.5 md:gap-2"
                onClick={closeUserModal}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {categoryModal && (
        <CategoryUsersModal
          category={categoryModal}
          onClose={() => setCategoryModal(null)}
        />
      )}

      <style>{`
        .custom-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 0;
          height: 0;
        }
      `}</style>
    </div>
  );
};

export default LeaderboardAnalytics;
