/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useEffect, useState, useRef } from "react";
import { Menu, X, ChevronDown, Lightbulb, Award, CalendarCheck, ArrowDownLeft, ArrowUpRight, UserCircle, ArrowRight, FileText, Briefcase, Calculator, PenTool, Map } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUserInfo, unsetUserInfo } from "../../features/userSlice";
import { getStudentToken, removeToken } from "../../services/CookieService";
import { useGetUserByIdQuery, useLogoutUserMutation } from "../../services/userAuthApi";
import { useGetUserPointsByIdQuery } from "../../services/Challenge/userChallenge";
import { jwtDecode } from 'jwt-decode';
import { toast } from "react-hot-toast";
import LoginModal from "../auth/student/LoginModal";
import SignupModal from "../auth/student/SignupModal";
import { useAuthModal } from "../../context/AuthModalContext"; // Import context hook
import { useGetFooterSettingsQuery } from '../../services/LegalPages/footerSettingApi';

const Navbar = () => {
  const { isLoginOpen, openLogin, closeLogin, isSignupOpen, openSignup, closeSignup } = useAuthModal(); // Use context
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutUser] = useLogoutUserMutation();
  const [openSection, setOpenSection] = useState(null);
  let id, email, username, points, role;
  const { access_token } = getStudentToken()
  if (access_token) {
    const decodedToken = jwtDecode(access_token);
    id = decodedToken.id;
    email = decodedToken.email;
    username = decodedToken.username;
    points = decodedToken.points;
    role = decodedToken.role;
  }
  const {
    data: profileData,
  } = useGetUserByIdQuery({ id, access_token }, { skip: !id });
  let profile_image = profileData?.profile_image
  const getProfileImg = () => {
    if (profile_image) {
      // Make sure we're not returning undefined or null
      const imagePath = profile_image || "/placeholder.png";
      return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${imagePath}`;
    }
    return null; // Return null when there's no profile image
  };
  // Fetch user points with error handling
  const {
    data: pointsData,
    isSuccess: isPointsSuccess,
    error: pointsError
  } = useGetUserPointsByIdQuery({ access_token }, {
    skip: !access_token
  });
  // Add this with other state declarations
  const [isTransactionDropdownOpen, setIsTransactionDropdownOpen] = useState(false);
  // Update points in Redux store
  useEffect(() => {
    if (isPointsSuccess) {
      dispatch(
        setUserInfo({
          id,
          email,
          username,
          profile_image,
          points: pointsData?.userPoints?.points || 0,
          role
        })
      );
    }
  }, [isPointsSuccess, pointsData, dispatch, id, email, username, profile_image]);
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const handleLogout = async () => {
    try {
      await logoutUser(access_token).unwrap();
    } catch (error) {
      console.error("Logout failed", error);
      const errorMessage = error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'An unexpected error occurred';
      toast.error(errorMessage);
    } finally {
      sessionStorage.removeItem("chatHistory");
      dispatch(
        unsetUserInfo({ id: "", email: "", username: "", profile_image: "", points: "", role: "" })
      );
      removeToken();
      navigate("/");
    }
  };
  // Get first letter of username
  const getInitial = (name) => {
    return name && name.length > 0 ? name.charAt(0).toUpperCase() : "?";
  };
  // Global state for managing dropdowns
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownTimeoutRef = useRef(null);
  // Clear all dropdown timeouts function
  const clearAllDropdownTimeouts = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
  };
  // Improved Dropdown component with better hover behavior
  const NavDropdown = ({ title, items = [], id, header }) => {
    const dropdownRef = useRef(null);
    const isOpen = activeDropdown === id;
    const handleMouseEnter = () => {
      clearAllDropdownTimeouts();
      setActiveDropdown(id);
    };
    const handleMouseLeave = () => {
      clearAllDropdownTimeouts();
      dropdownTimeoutRef.current = setTimeout(() => {
        if (activeDropdown === id) {
          setActiveDropdown(null);
        }
      }, 150);
    };
    return (
      <div
        ref={dropdownRef}
        className="relative group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          className="flex items-center space-x-1 text-black font-medium transition-colors duration-200 text-sm"
        >
          <span>{title}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        {isOpen && (
          <div className={`absolute mt-3 left-0 w-64 bg-white border-gray-100 rounded-lg shadow-lg py-0 z-50 transform origin-top-left transition-all duration-150 border overflow-hidden`}>
            {header && (
              <div className="px-5 py-4 bg-white border-b border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{header}</h3>
              </div>
            )}
            <div className="divide-y divide-gray-100">
              {items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={index}
                    to={item.path}
                    className={`flex items-center gap-4 px-5 py-4 text-gray-700 hover:bg-gray-50 transition-colors duration-150`}
                    onClick={(e) => {
                      if (item.onClick) {
                        item.onClick(e);
                      }
                      setActiveDropdown(null);
                    }}
                  >
                    {Icon && (
                      <div className="flex-shrink-0 text-gray-400">
                        <Icon className="w-5 h-5" />
                      </div>
                    )}
                    <span className="font-medium text-gray-900 text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };
  // User profile dropdown with improved hover behavior
  const userProfileRef = useRef(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownTimeoutRef = useRef(null);
  const handleUserProfileMouseEnter = () => {
    // Clear any existing timeout to prevent closing
    if (userDropdownTimeoutRef.current) {
      clearTimeout(userDropdownTimeoutRef.current);
      userDropdownTimeoutRef.current = null;
    }
    setIsUserDropdownOpen(true);
    // Close other regular dropdowns when hovering user dropdown
    setActiveDropdown(null);
  };
  const handleUserProfileMouseLeave = () => {
    // Set a timeout to close the dropdown after delay
    userDropdownTimeoutRef.current = setTimeout(() => {
      setIsUserDropdownOpen(false);
    }, 150); // Shorter delay for responsiveness
  };
  // Clean up all timeouts on unmount
  useEffect(() => {
    return () => {
      clearAllDropdownTimeouts();
      if (userDropdownTimeoutRef.current) {
        clearTimeout(userDropdownTimeoutRef.current);
      }
    };
  }, []);
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        activeDropdown &&
        !event.target.closest('.dropdown-container')
      ) {
        setActiveDropdown(null);
      }
      if (
        isUserDropdownOpen &&
        userProfileRef.current &&
        !userProfileRef.current.contains(event.target)
      ) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown, isUserDropdownOpen]);
  // Daily Problem button with status
  const [challengeStatus, setChallengeStatus] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState("24 hours");
  useEffect(() => {
    // Simulate challenge status and time remaining
    const timer = setInterval(() => {
      setChallengeStatus(Math.random() < 0.5);
      setTimeRemaining(Math.floor(Math.random() * 24) + " hours");
    }, 5000);
    return () => clearInterval(timer);
  }, []);
  // Function to handle mobile link clicks
  const handleMobileLinkClick = () => {
    setIsOpen(false);
    setOpenSection(null);
  };

  const handleProtectedLinkClick = (e) => {
    if (!id) {
      e.preventDefault();
      toast.error('Login required, redirecting...', { duration: 1500 });
      setTimeout(() => {
        openLogin();
      }, 1500);
    }
  };

  const handleProtectedMobileLinkClick = (e) => {
    if (!id) {
      e.preventDefault();
      toast.error('Login required, redirecting...', { duration: 1500 });
      setTimeout(() => {
        handleMobileLinkClick();
        openLogin();
      }, 1500);
    } else {
      handleMobileLinkClick();
    }
  };

  // Fetch footer settings for header logo
  const { data: footerData } = useGetFooterSettingsQuery();
  const headerLogo = footerData?.data?.headerLogo;

  return (
    <>
      {/* Main navbar */}
      <nav
        className={`sticky top-0 z-50 bg-white text-black transition-all duration-300 ${isScrolled ? "shadow-md py-1" : "py-1.5"}`}
      >
        <div className="container px-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Logo */}
            <div className="flex justify-start items-center">
              <Link to="/" className="flex items-center">
                <img
                  src={headerLogo ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${headerLogo}` : "/Layer 1.png"}
                  alt="Logo"
                  className="
                  /* Base styles for all screens */
                  w-auto
                  h-14                  /* Slightly larger for better visibility */
                  
                  /* Large Desktop (1536px and above) */
                  2xl:h-14
                  2xl:max-w-[170px]
                  
                  /* Desktop (1280px to 1535px) */
                  xl:h-13
                  xl:max-w-[160px]
                  
                  /* Small Desktop/Large Tablet (1024px to 1279px) */
                  lg:h-12
                  lg:max-w-[160px]
                  
                  /* Tablet (768px to 1023px) */
                  md:h-11
                  md:max-w-[160px]
                  
                  /* Mobile (640px to 767px) */
                  sm:h-10
                  sm:max-w-[150px]
                  
                  /* Small Mobile (below 640px) */
                  max-[640px]:h-10
                  max-[640px]:max-w-[140px]
                  
                  /* Extra Small Mobile (below 400px) */
                  max-[400px]:h-10
                  max-[400px]:max-w-[130px]
                  
                  object-contain
                  object-left
                "
                />
              </Link>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8 ml-10">
              <Link
                to="/"
                className="text-forestGreen font-medium cursor-pointer transition-colors nav-link-animated text-sm"
              >
                Home
              </Link>

              {/* Add the Explore dropdown here */}
              <Link
                to="/contests"
                className="text-forestGreen font-medium cursor-pointer transition-colors nav-link-animated text-sm"
              >
                Contests
              </Link>
              <Link
                to="/challenges"
                className="text-forestGreen font-medium cursor-pointer transition-colors nav-link-animated text-sm"
              >
                Challenges
              </Link>

              <div className="dropdown-container text-forestGreen">
                <NavDropdown
                  id="ai-tools-dropdown"
                  title="Quick Tools"
                  items={[
                    { label: "Cheat Sheets", path: "/cheat-sheets", icon: FileText },
                    { label: "Crack an Interview", path: "/ai/crack-an-interview", icon: Briefcase, onClick: handleProtectedLinkClick },
                    { label: "Paragraph Writing Tool", path: "/ai/paragraph-typing", icon: PenTool, onClick: handleProtectedLinkClick },
                    { label: "Maths Solver", path: "/ai/maths-solver", icon: Calculator, onClick: handleProtectedLinkClick },
                    { label: "Do Your Own Course", path: "/ai/do-your-own-course", icon: Lightbulb, onClick: handleProtectedLinkClick },
                    { label: "Learning Path", path: "/ai/learning-path", icon: Map, onClick: handleProtectedLinkClick }
                  ]}
                  header="Additional help"
                />
              </div>
            </div>
            {/* Right side items */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Daily Problem and XP buttons - moved to right side */}
              {id && (
                <div className="flex items-center space-x-3">
                  {/* XP Button with transaction dropdown */}
                  <div
                    className="relative group" // Add group class for hover
                    onClick={() => navigate("/transactions")}
                    onMouseEnter={() => setIsTransactionDropdownOpen(true)}
                    onMouseLeave={() => {
                      // Set a timeout to close the dropdown after delay
                      setTimeout(() => {
                        setIsTransactionDropdownOpen(false);
                      }, 500); // Shorter delay for responsiveness
                    }}
                  >
                    <button
                      className="flex items-center px-3 py-1.5 bg-lightGreen border border-primary/30 rounded-full shadow-sm"
                    >
                      <Award className="hidden lg:inline-flex w-4 h-4 mr-2 text-primary" />
                      <span className="text-forestGreen font-medium mr-1">XP</span>
                      <span className="px-2 py-0.5 bg-primary text-white font-bold rounded-full text-xs">
                        {pointsData?.userPoints?.points || 0}
                      </span>
                      {/* <ChevronDown className={`w-3 h-3 ml-2 text-gray-500 transition-transform ${isTransactionDropdownOpen ? 'rotate-180' : ''}`} /> */}
                    </button>
                    {/* Invisible bridge to prevent gap issues */}
                    {isTransactionDropdownOpen && <div className="absolute top-8 right-0 w-28 h-5"></div>}
                    {/* Transaction Dropdown */}
                    {isTransactionDropdownOpen && (
                      <div className="absolute top-full mt-2 right-0 w-80 bg-white rounded-lg shadow-sm border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <h3 className="text-sm font-semibold text-gray-900">Recent Transactions</h3>
                        </div>
                        {pointsData?.transactions?.length > 0 ? (
                          pointsData.transactions.map((transaction) => (
                            <div
                              key={transaction.id}
                              className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                            >
                              <div className="flex items-center gap-3">
                                {/* Icon */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${transaction.type === 'earn'
                                  ? 'bg-lightGreen'
                                  : 'bg-red-100'
                                  }`}>
                                  {transaction.type === 'earn' ? (
                                    <ArrowDownLeft className="w-4 h-4 text-primary" />
                                  ) : (
                                    <ArrowUpRight className="w-4 h-4 text-red-600" />
                                  )}
                                </div>
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="text-sm font-medium text-gray-900 truncate cursor-pointer relative group"
                                    title={transaction.description}
                                  >
                                    {transaction.description}
                                    {/* Hover overlay with full text */}
                                    <span className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 left-0 top-full mt-1 bg-gray-800 text-white text-xs rounded-md px-3 py-2 z-[100] shadow-sm whitespace-normal break-words min-w-[250px] max-w-[350px]">
                                      {transaction.description}
                                    </span>
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(transaction.created_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </p>
                                </div>
                                {/* Amount */}
                                <div className={`text-sm font-semibold ${transaction.type === 'earn' ? 'text-primary' : 'text-red-600'
                                  }`}>
                                  {transaction.type === 'earn' ? '+' : '-'}{transaction.points}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-center text-gray-500 text-sm">
                            No transactions yet
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Daily Problem button with status */}
                  <Link
                    to="/daily-challenge"
                    className="relative group"
                  >
                    <div className="p-2 bg-lightGreen text-primary rounded-full border border-primary/30 transition-all duration-300 shadow-sm flex items-center justify-center tooltip-container">
                      <Lightbulb className="w-5 h-5" />
                      {/* Challenge Status Indicator */}
                      {challengeStatus && (
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-forestGreen border-2 border-white"></div>
                      )}
                    </div>
                    {/* Tooltip with challenge info */}
                    <div className="absolute mt-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 right-0 lg:right-auto lg:left-1/2 transform lg:-translate-x-1/2 w-56 bg-white rounded-lg shadow-sm p-4 z-50 border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-lightGreen text-primary rounded-full">
                          <CalendarCheck className="w-5 h-5" />
                        </div>
                        <div className="text-xs text-gray-800 mt-2">
                          <div className="font-semibold text-sm">Daily Challenge</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )}
              {/* User profile or login buttons */}
              {id ? (
                <div
                  ref={userProfileRef}
                  className="relative"
                  onMouseEnter={handleUserProfileMouseEnter}
                  onMouseLeave={handleUserProfileMouseLeave}
                >
                  <button
                    className="flex items-center space-x-2 focus:outline-none"
                  >
                    <div className="relative w-10 h-10 overflow-hidden rounded-full hover:border-black transition-colors flex items-center justify-center text-white font-bold bg-gray-200">
                      {profile_image ? (
                        <img
                          src={getProfileImg()}
                          className="w-full h-full object-cover"
                          alt={username}
                        />
                      ) : (
                        <img
                          src="/assets/placeholder2.png"
                          className="w-full h-full object-cover"
                          alt={username}
                        />
                      )}
                      <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent"></div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 hover:text-indigo-500 transition-colors ${isUserDropdownOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                  {/* User dropdown menu */}
                  {isUserDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100"
                      onMouseEnter={handleUserProfileMouseEnter}
                      onMouseLeave={handleUserProfileMouseLeave}
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-forestGreen truncate">
                          {username}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {email}
                        </p>
                      </div>
                      {/* <Link
                        to="/user-profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary/10"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        My Profile
                      </Link> */}
                      {/* <Link
                        to="/user-enrolled-courses"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        My Courses
                      </Link>
                      <Link
                        to="/user-purchases"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary/10"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        My Purchases
                      </Link> */}
                      <Link
                        to="/user-profile-layout"
                        className="block px-4 py-2 text-sm text-forestGreen hover:bg-primary/10"
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/student-dashboard"
                        className="block px-4 py-2 text-sm text-forestGreen hover:bg-primary/10"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        My Dashboard
                      </Link>
                      {/* <Link
                        to="/user-wishlist"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        My Wishlist
                      </Link>
                      <Link
                        to="/my-challenges"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary/10"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        My Challenges
                      </Link> */}
                      <Link
                        to="/user-support-tickets"
                        className="block px-4 py-2 text-sm text-forestGreen hover:bg-primary/10"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        Support
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => openLogin()}
                    className="font-medium text-forestGreen transition-all duration-300 nav-link-animated text-sm"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => openSignup()}
                    className="text-sm flex items-center px-5 py-2 bg-forestGreen text-white rounded-md transition-all duration-300 shadow-md hover:shadow-lg group overflow-hidden"
                  >
                    <span>Sign Up</span>
                    <div className="relative ml-2 w-4 h-4 overflow-hidden">
                      <ArrowRight className="absolute inset-0 w-4 h-4 transition-transform duration-300 ease-in-out group-hover:translate-y-full" />
                      <ArrowRight className="absolute inset-0 w-4 h-4 -translate-y-full transition-transform duration-300 ease-in-out group-hover:translate-y-0" />
                    </div>
                  </button>
                </>
              )}
            </div>
            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center -mr-3">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-3 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none" // slightly larger touch area
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {/* Mobile navigation links */}
              <Link
                to="/"
                className="block px-3 py-2 rounded-md text-base font-medium text-forestGreen"
                onClick={handleMobileLinkClick}
              >
                Home
              </Link>
              <div className="border-t border-gray-200"></div>

              {/* Pages Dropdown */}

              {/* Explore Dropdown */}
              <Link
                to="/contests"
                className="block px-3 py-2 rounded-md text-base font-medium text-forestGreen"
                onClick={handleMobileLinkClick}
              >
                Contests
              </Link>
              <Link
                to="/challenges"
                className="block px-3 py-2 rounded-md text-base font-medium text-forestGreen"
                onClick={handleMobileLinkClick}
              >
                Challenges
              </Link>

              {/* AI Tools Dropdown */}
              <div className="border-t border-gray-200">
                <div
                  className="flex justify-between items-center px-3 py-2 text-base font-medium text-black cursor-pointer"
                  onClick={() => setOpenSection(openSection === 'ai' ? null : 'ai')}
                >
                  <span>Quick Tools</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${openSection === 'ai' ? 'rotate-180' : ''
                      }`}
                  />
                </div>
                {openSection === 'ai' && (
                  <div className="pl-6">
                    <Link
                      to="/cheat-sheets"
                      className="block px-3 py-2 text-sm text-gray-700"
                      onClick={handleMobileLinkClick}
                    >
                      Cheat Sheets
                    </Link>
                    <Link
                      to="/ai/crack-an-interview"
                      className="block px-3 py-2 text-sm text-gray-700"
                      onClick={handleProtectedMobileLinkClick}
                    >
                      Crack an Interview
                    </Link>
                    <Link
                      to="/ai/paragraph-typing"
                      className="block px-3 py-2 text-sm text-gray-700"
                      onClick={handleProtectedMobileLinkClick}
                    >
                      Paragraph Writing Tool
                    </Link>
                    <Link
                      to="/ai/maths-solver"
                      className="block px-3 py-2 text-sm text-gray-700"
                      onClick={handleProtectedMobileLinkClick}
                    >
                      Maths Solver
                    </Link>
                    <Link
                      to="/ai/do-your-own-course"
                      className="block px-3 py-2 text-sm text-gray-700"
                      onClick={handleProtectedMobileLinkClick}
                    >
                      Do Your Own Course
                    </Link>
                    <Link
                      to="/ai/learning-path"
                      className="block px-3 py-2 text-sm text-gray-700"
                      onClick={handleProtectedMobileLinkClick}
                    >
                      Learning Path
                    </Link>
                  </div>
                )}
              </div>
              {/* Auth buttons in mobile view */}
              {id ? (
                <div className="mt-2 border-gray border-t">
                  {/* Clickable Profile Header */}
                  <button
                    onClick={() => setOpenSection(openSection === "account" ? null : "account")}
                    className="w-full flex items-center justify-between px-3 py-3 text-left focus:outline-none"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative w-10 h-10 overflow-hidden rounded-full flex items-center justify-center text-white font-bold bg-gray-200">
                        {profile_image ? (
                          <img
                            src={getProfileImg()}
                            className="w-full h-full object-cover"
                            alt={username}
                          />
                        ) : (
                          <img
                            src="/assets/placeholder1.png"
                            className="w-full h-full object-cover"
                            alt={username}
                          />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{username}</div>
                        <div className="text-xs text-gray-500">{email}</div>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-600 transform transition-transform duration-300 ${openSection === "account" ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                  {/* Dropdown Items */}
                  {openSection === "account" && (
                    <div className="pl-10 space-y-3 text-sm">
                      <Link
                        to="/user-profile-layout"
                        className="block text-gray-700 hover:text-primary"
                        onClick={handleMobileLinkClick}
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/student-dashboard"
                        className="block text-gray-700 hover:text-primary"
                        onClick={handleMobileLinkClick}
                      >
                        My Dashboard
                      </Link>
                      <Link
                        to="/user-support-tickets"
                        className="block text-gray-700 hover:text-primary"
                        onClick={handleMobileLinkClick}
                      >
                        Support
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          handleMobileLinkClick();
                        }}
                        className="block text-left text-red-600 hover:text-red-700 w-full"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-4 pb-3 border-t border-gray-200">
                  <div className="flex items-center space-x-3 px-3">
                    <button
                      onClick={() => {
                        openLogin();
                        handleMobileLinkClick();
                      }}
                      className="flex-1 px-4 py-2 text-center text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => {
                        openSignup();
                        handleMobileLinkClick();
                      }}
                      className="flex-1 px-4 py-2 text-center text-white bg-primary rounded-lg shadow-md"
                    >
                      Sign Up
                    </button>
                  </div>
                </div>
              )}
              {/* Problem of the day and XP for mobile */}
              {id && (
                <div
                  className="flex items-center justify-between py-2 border-t border-gray-200 relative group" // Add group and relative
                  onMouseEnter={() => setIsTransactionDropdownOpen(true)}
                  onMouseLeave={() => {
                    // Set a timeout to close the dropdown after delay
                    setTimeout(() => {
                      setIsTransactionDropdownOpen(false);
                    }, 150); // Shorter delay for responsiveness
                  }}
                >
                  <div
                    className="flex items-center px-3 py-2 bg-lightGreen border border-primary/30 rounded-full shadow-sm hover:shadow transition-all duration-200"
                    onClick={() => navigate("/transactions")}
                  >
                    <Award className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-forestGreen font-medium mr-1">XP</span>
                    <span className="px-2 py-0.5 bg-primary text-white font-bold rounded-full text-xs">{pointsData?.userPoints?.points || 0}</span>
                    {/* <ChevronDown className={`w-3 h-3 ml-2 text-gray-500 transition-transform ${isTransactionDropdownOpen ? 'rotate-180' : ''}`} /> */}
                  </div>
                  <Link
                    to="/daily-challenge"
                    className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-primary to-leafGreen text-white rounded-lg"
                    onClick={handleMobileLinkClick}
                  >
                    <Lightbulb className="w-5 h-5 mr-2" />
                    <span>Daily Challenge</span>
                  </Link>
                  {/* Mobile Transaction Dropdown */}
                  {isTransactionDropdownOpen && (
                    <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Recent Transactions</h3>
                      </div>
                      {pointsData?.transactions?.length > 0 ? (
                        pointsData.transactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              {/* Icon */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${transaction.type === 'earn'
                                ? 'bg-lightGreen'
                                : 'bg-red-100'
                                }`}>
                                {transaction.type === 'earn' ? (
                                  <ArrowDownLeft className="w-4 h-4 text-primary" />
                                ) : (
                                  <ArrowUpRight className="w-4 h-4 text-red-600" />
                                )}
                              </div>
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-sm font-medium text-gray-900 truncate cursor-help relative group"
                                  title={transaction.description}
                                >
                                  {transaction.description}
                                  {/* Hover overlay with full text */}
                                  <span className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 left-0 top-full mt-1 bg-gray-800 text-white text-xs rounded-md px-3 py-2 z-[100] shadow-lg whitespace-normal break-words right-0">
                                    {transaction.description}
                                  </span>
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(transaction.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                              {/* Amount */}
                              <div className={`text-sm font-semibold ${transaction.type === 'earn' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {transaction.type === 'earn' ? '+' : '-'}{transaction.points}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-gray-500 text-sm">
                          No transactions yet
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
      {isLoginOpen && (
        <LoginModal
          userType="student"
          onClose={closeLogin}
          onSwitchToSignup={openSignup}
        />
      )}
      {isSignupOpen && (
        <SignupModal
          onClose={closeSignup}
          onSwitchToLogin={openLogin}
        />
      )}
    </>
  );
};
export default Navbar;