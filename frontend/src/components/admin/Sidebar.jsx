"use client";

/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  Menu,
  LayoutDashboard,
  Users,
  DumbbellIcon as BicepsFlexed,
  ChevronDown,
  ChevronUp,
  LifeBuoy,
  LogOut,
  Award,
  BookMarked,
  NotebookPen,
  Waypoints,
  GraduationCap,
  Heart,
  ShieldQuestion,
  UserCog,
  Building,
  Trophy,
  MapPin,
  Globe,
  Map,
  Building2,
  MessageCircleQuestion,
  Sparkles,
  Star,
  Boxes,
  UserPen,
  UserSearch,
  FileText,
  Info,
  Gem,
  X,
  CreditCard,
  Search,
  Quote,
  Image,
  MessageSquareQuote,
  TrendingUp,
  Settings,
  Wrench,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import PermissionWrapper from "../../context/PermissionWrapper";
import { removeToken, getAdminToken } from "../../services/CookieService";
import { useDispatch } from "react-redux";
import { unsetUserInfo } from "../../features/userSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useLogoutAdminOrPartnerUserMutation } from "../../services/adminAuthApi";
import { useUpdateAdminMutation } from "../../services/adminAuthApi";
import ProfileModal from "./ProfileModal";

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const timeoutRef = useRef(null);
  const sidebarRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutAdminOrPartnerUser] = useLogoutAdminOrPartnerUserMutation();
  const [updateAdmin] = useUpdateAdminMutation();
  const { username, email, profile_image, role } = useSelector((state) => state.user);
  const { access_token } = getAdminToken();
  const location = useLocation();

  // Define route to dropdown mapping
  const routeToDropdown = {
    "/admin/dashboard/predefined-questions": "content",
    "/admin/dashboard/course-category-master": "content",
    "/admin/dashboard/cheat-sheets": "content",
    "/admin/dashboard/challenge-category-master": "challenges",
    "/admin/dashboard/contests/templates": "challenges",
    "/admin/dashboard/contests": "challenges",
    "/admin/dashboard/challenges": "challenges",
    "/admin/dashboard/challenges/quest": "challenges",
    "/admin/dashboard/users": "users",
    "/admin/dashboard/payments": "users",
    "/admin/dashboard/students": "users",
    "/admin/dashboard/admin-user": "users",
    "/admin/dashboard/roles": "users",
    "/admin/dashboard/partners": "users",
    "/admin/dashboard/faq-response": "users",
    "/admin/dashboard/extension-requests": "users",
    "/admin/dashboard/landing-management/faqs": "landing_page",
    "/admin/dashboard/landing-management/statistics": "landing_page",
    "/admin/dashboard/landing-management/features": "landing_page",
    "/admin/dashboard/testimonials/master": "landing_page",
    "/admin/dashboard/testimonials/list": "landing_page",
    "/admin/dashboard/ai-management/feature-settings": "ai_management",
    "/admin/dashboard/locations/countries": "location",
    "/admin/dashboard/locations/states": "location",
    "/admin/dashboard/locations/cities": "location",
    "/admin/dashboard/support": "services",
    "/admin/dashboard/contacts": "services",
    "/admin/dashboard/about": "services",
    "/admin/dashboard/blogs": "services",
    "/admin/dashboard/subscribe": "services",
    "/admin/dashboard/reviews": "services",
    "/admin/dashboard/tiers": "services",
    "/admin/dashboard/features": "services",
    "/admin/dashboard/features/interested": "services",
    "/admin/dashboard/terms-of-service": "legalPages",
    "/admin/dashboard/privacy-policy": "legalPages",
    "/admin/dashboard/social-media": "legalPages",
  };

  useEffect(() => {
    // If sidebar is open, check if current path matches any dropdown
    if (isOpen) {
      const currentPath = location.pathname;
      // Find the dropdown that should be open
      const dropdownToOpen = Object.entries(routeToDropdown).find(([route]) =>
        currentPath === route || currentPath.startsWith(route)
      );

      if (dropdownToOpen) {
        setOpenDropdown(dropdownToOpen[1]);
      }
    }
  }, [isOpen, location.pathname]);

  // Profile modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [formData, setFormData] = useState({
    name: username || '',
    email: email || '',
    profile_image: profile_image || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [imagePreview, setImagePreview] = useState(profile_image || '');

  // Handle mouse enter
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleLogout = async () => {
    try {
      const result = await logoutAdminOrPartnerUser(access_token).unwrap();

      sessionStorage.removeItem("chatHistory");
      dispatch(
        unsetUserInfo({
          id: "",
          email: "",
          username: "",
          profile_image: "",
          points: "",
          role: "",
        })
      );
      removeToken("admin");
      navigate("/admin/login");
    } catch (error) {
      console.error("Logout failed", error);
      const errorMessage = error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'An unexpected error occurred';
      toast.error(errorMessage);
    }
  };

  // Handle mouse leave with delay
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setOpenDropdown(null);
    }, 300);
  };

  // Clean up timeout on component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Close dropdowns when sidebar is closed
  useEffect(() => {
    if (!isOpen) {
      setOpenDropdown(null);
    }
  }, [isOpen]);

  // Update form data when user info changes
  useEffect(() => {
    setFormData({
      name: username || '',
      email: email || '',
      profile_image: profile_image || '',
    });
    setImagePreview(profile_image || '');
  }, [username, email, profile_image]);

  // Toggle a specific dropdown
  const toggleDropdown = (dropdown) => {
    if (openDropdown === dropdown) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(dropdown);
    }
  };

  // Manually toggle sidebar when clicking the button
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Profile modal handlers
  const handleProfileClick = () => {
    if (role != 'admin') return;
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setEditMode(false);
    setShowChangePassword(false);
    setFormData({
      name: username || '',
      email: email || '',
      profile_image: profile_image || '',
    });
    setImagePreview(profile_image || '');
    setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  };

  // Common styles for NavLinks with dynamic active and hover states
  const getNavLinkStyles = (isActive) => {
    const baseStyles = [
      "flex",
      "items-center",
      "w-full", // Add full width to prevent layout shift
      "px-4 py-3 gap-3", // Keep consistent horizontal layout to prevent jumps
      "rounded-lg",
      "transition-all",
      "duration-200",
      "ease-in-out",
      "border-l-4",
      isActive
        ? "bg-lightGreen/20 text-forestGreen font-semibold border-forestGreen"
        : "text-gray-700 border-transparent hover:bg-lightGreen/10 hover:text-forestGreen",
      "group",
    ];
    return baseStyles.filter(Boolean).join(" ");
  };

  // Get styles for dropdown buttons
  const getDropdownStyles = (isExpanded) => {
    const baseStyles = [
      "flex",
      "items-center",
      "w-full", // Add full width to prevent layout shift
      "px-4 py-3 gap-3", // Keep consistent horizontal layout to prevent jumps
      "rounded-lg",
      "transition-all",
      "duration-200",
      "ease-in-out",
      "group",
      isExpanded
        ? "bg-lightGreen/10 text-forestGreen font-semibold"
        : "text-gray-700 hover:bg-lightGreen/10 hover:text-forestGreen",
    ];
    return baseStyles.filter(Boolean).join(" ");
  };

  // Style for icons
  const iconStyle = "h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110";

  // Style for submenu NavLinks
  const getSubmenuLinkStyles = (isActive) => {
    const baseStyles = [
      "flex",
      "items-center",
      "gap-3",
      "ml-4",
      "pl-4",
      "py-2.5",
      "rounded-lg",
      "transition-all",
      "duration-200",
      "border-l-2",
      isActive
        ? "bg-lightGreen/20 text-forestGreen font-semibold border-forestGreen"
        : "text-gray-500 border-transparent hover:bg-lightGreen/10 hover:text-forestGreen",
      "group",
    ];
    return baseStyles.filter(Boolean).join(" ");
  };

  // Special styles for the AI Course Generator button
  const getAIGeneratorStyles = (isActive) => {
    const baseStyles = [
      "flex",
      "items-center",
      "w-full", // Add full width
      "px-4 py-3 gap-3", // Keep consistent horizontal layout to prevent jumps
      "rounded-lg",
      "transition-all",
      "duration-200",
      "ease-in-out",
      "group",
      "relative",
      "overflow-hidden",
      isActive
        ? "bg-gradient-to-r from-lightGreen/30 to-leafGreen/10 text-forestGreen font-semibold border-l-4 border-forestGreen shadow-md"
        : "bg-gradient-to-r from-lightGreen/10 to-leafGreen/5 text-leafGreen hover:from-lightGreen/30 hover:to-leafGreen/10 hover:text-forestGreen hover:shadow-md",
    ];
    return baseStyles.filter(Boolean).join(" ");
  };

  return (
    <>

      <div
        ref={sidebarRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={() => {
          if (!isOpen) {
            setIsOpen(true);
            // Auto close after 3 seconds on mobile
            setTimeout(() => {
              if (isOpen) {
                setIsOpen(false);
              }
            }, 3000);
          }
        }}
        className={`fixed top-0 left-0 h-full 
  ${isOpen ? "w-72" : "w-20"} 
  bg-white z-40 transition-all duration-300 ease-in-out shadow-md border-r border-gray-200 hover:shadow-lg overflow-x-hidden overflow-y-hidden flex flex-col`}
      >
        <nav className={`flex flex-col h-full overflow-x-hidden ${isOpen ? "p-4" : "py-4 px-2"}`}>
          {/* Header with Logo */}
          <div className={`flex items-center mb-6 ${isOpen ? "gap-3 pl-2" : "justify-center"}`}>
            <div className="h-10 w-10 bg-gradient-to-br from-forestGreen to-leafGreen rounded-lg flex items-center justify-center transition-transform duration-200 hover:scale-105 shadow-sm shrink-0">
              <span className="text-xl font-bold text-white">{role === "admin" ? "A" : role === "partner" ? "P" : null}</span>
            </div>
            <h2 className={`text-lg font-semibold text-gray-800 whitespace-nowrap transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 w-0 h-0 overflow-hidden text-[0px]"}`}>
              {role === "admin" ? "Admin Panel" : role === "partner" ? "Partner Panel" : null}
            </h2>
            {/* DESKTOP CLOSE BUTTON */}
            <button
              onClick={toggleSidebar}
              className={`${isOpen ? "block" : "hidden"} ml-auto p-2 rounded-full hover:bg-lightGreen/20 text-gray-700 hover:text-forestGreen transition-all duration-200`}
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          {/* AI Course Generator - Featured Button */}
          <PermissionWrapper section="AI Course Generator">
            <div className="mb-4 px-2">
              <NavLink
                to="/generate-course"
                className={({ isActive }) => getAIGeneratorStyles(isActive)}
              >
                <div className={`flex items-center gap-3 relative z-10 ${!isOpen && "justify-center w-full"}`}>
                  <div className="p-1.5 bg-white bg-opacity-20 rounded-lg shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  {isOpen && (
                    <div className="flex flex-col whitespace-nowrap">
                      <span className="font-semibold text-sm whitespace-nowrap">
                        AI Course Generator
                      </span>
                      <span className="text-xs opacity-80 whitespace-nowrap">Create with AI</span>
                    </div>
                  )}
                  {!isOpen && (
                    <span className="sr-only">AI Course Generator</span>
                  )}
                </div>
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-leafGreen/20 to-lightGreen/20 opacity-0 group-hover:opacity-30 transition-opacity duration-200 rounded-lg"></div>
              </NavLink>
            </div>
          </PermissionWrapper>

          {/* Scrollable Navigation Links */}
          <div
            ref={scrollContainerRef}
            className="flex-grow overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <ul className="space-y-1 pb-6">
              {/* Dashboard Section */}
              <li>
                <NavLink
                  to="/admin/dashboard"
                  end
                  className={({ isActive }) => getNavLinkStyles(isActive)}
                >
                  <LayoutDashboard className={iconStyle} />
                  {isOpen && <span className="font-medium whitespace-nowrap">Dashboard</span>}
                </NavLink>
              </li>

              <PermissionWrapper section="Course">
                <li>
                  <NavLink
                    to="/admin/dashboard/course"
                    className={({ isActive }) => getNavLinkStyles(isActive)}
                  >
                    <GraduationCap className={iconStyle} />
                    {isOpen && <span className="font-medium whitespace-nowrap">Courses</span>}
                  </NavLink>
                </li>
              </PermissionWrapper>

              {/* ... Rest of the navigation items remain the same ... */}
              <PermissionWrapper section="Predefined Questions|Course Category|Cheat Sheet">
                {/* Divider */}
                <hr className={`my-3 border-gray-200 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-50"}`} />
                {/* Content Management Dropdown */}
                <li>
                  <button
                    onClick={() => toggleDropdown("content")}
                    className={getDropdownStyles(openDropdown === "content")}
                    title={!isOpen ? "Content Management" : ""}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <NotebookPen className={`shrink-0 ${iconStyle}`} />
                      {isOpen && (
                        <>
                          <span className="font-medium flex-grow text-left whitespace-nowrap">
                            Content Management
                          </span>
                          {openDropdown === "content" ? (
                            <ChevronUp className="shrink-0" size={16} />
                          ) : (
                            <ChevronDown className="shrink-0" size={16} />
                          )}
                        </>
                      )}
                    </div>
                  </button>
                  {isOpen && openDropdown === "content" && (
                    <div
                      id="content-management-submenu"
                      className="ml-3 mt-1 space-y-1 animate-[fadeIn_0.2s_ease-in-out]"
                    >
                      <PermissionWrapper section="Predefined Questions">
                        <NavLink
                          to="/admin/dashboard/predefined-questions"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <ShieldQuestion
                                size={16}
                                className={isActive ? "text-forestGreen" : "text-gray-400"}
                              />
                              <span className="font-medium">Question Bank</span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Course Category">
                        <NavLink
                          to="/admin/dashboard/course-category-master"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <Waypoints size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">
                                Course Categories
                              </span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Cheat Sheet">
                        <NavLink
                          to="/admin/dashboard/cheat-sheets"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <BookMarked size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">Cheat Sheets</span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                    </div>
                  )}
                </li>
              </PermissionWrapper>

              <PermissionWrapper section="Challenge Category|Daily Challenge|Challenge Quest|Contest|Contest Template">
                {/* Divider */}
                <hr className={`my-3 border-gray-200 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-50"}`} />

                {/* Challenges Dropdown */}
                <li>
                  <button
                    onClick={() => toggleDropdown("challenges")}
                    className={getDropdownStyles(
                      openDropdown === "challenges"
                    )}
                    aria-expanded={openDropdown === "challenges"}
                    aria-controls="challenges-submenu"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Award className={iconStyle} />
                      {isOpen && (
                        <>
                          <span className="font-medium flex-grow text-left whitespace-nowrap">
                            Challenges
                          </span>
                          {openDropdown === "challenges" ? (
                            <ChevronUp className="shrink-0" size={16} />
                          ) : (
                            <ChevronDown className="shrink-0" size={16} />
                          )}
                        </>
                      )}
                    </div>
                  </button>
                  {isOpen && openDropdown === "challenges" && (
                    <div
                      id="challenges-submenu"
                      className="ml-3 mt-1 space-y-1 animate-[fadeIn_0.2s_ease-in-out]"
                    >
                      <PermissionWrapper section="Challenge Category">
                        <NavLink
                          to="/admin/dashboard/challenge-category-master"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <Waypoints size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">
                                Challenge Categories
                              </span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Contest Template">
                        <NavLink
                          to="/admin/dashboard/contests/templates"
                          end
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <FileText size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">
                                Contest Templates
                              </span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Contest">
                        <NavLink
                          to="/admin/dashboard/contests"
                          end
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <Trophy size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">
                                Contest
                              </span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Daily Challenge">
                        <NavLink
                          to="/admin/dashboard/challenges"
                          end
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <BicepsFlexed size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">Daily Challenge</span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Challenge Quest">
                        <NavLink
                          to="/admin/dashboard/challenges/quest"
                          end
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <Heart size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">Challenge Quest</span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                    </div>
                  )}
                </li>
              </PermissionWrapper>

              <PermissionWrapper section="User|Admin|Role|Partner|Student FAQ Responses|User Detail|Assignment Extension">
                {/* Divider */}
                <hr className={`my-3 border-gray-200 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-50"}`} />
                {/* User Management Dropdown */}
                <li>
                  <button
                    onClick={() => toggleDropdown("users")}
                    className={getDropdownStyles(openDropdown === "users")}
                    title={!isOpen ? "User Management" : ""}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <UserCog className={`shrink-0 ${iconStyle}`} />
                      {isOpen && (
                        <>
                          <span className="font-medium flex-grow text-left whitespace-nowrap">
                            User Management
                          </span>
                          {openDropdown === "users" ? (
                            <ChevronUp className="shrink-0" size={16} />
                          ) : (
                            <ChevronDown className="shrink-0" size={16} />
                          )}
                        </>
                      )}
                    </div>
                  </button>
                  {isOpen && openDropdown === "users" && (
                    <div
                      id="user-management-submenu"
                      className="ml-3 mt-1 space-y-1 animate-[fadeIn_0.2s_ease-in-out]"
                    >
                      <PermissionWrapper section="User">
                        <NavLink
                          to="/admin/dashboard/users"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <Users size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">Users</span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Payment">
                        <NavLink
                          to="/admin/dashboard/payments"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <CreditCard size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">Payments</span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="User Detail">
                        <NavLink
                          to="/admin/dashboard/students"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <UserPen size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">Students</span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Admin">
                        <NavLink
                          to="/admin/dashboard/admin-user"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <UserCog size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">Admin Users</span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Role">
                        <NavLink
                          to="/admin/dashboard/roles"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <ShieldQuestion
                                size={16}
                                className={isActive ? "text-forestGreen" : "text-gray-400"}
                              />
                              <span className="font-medium">
                                Roles & Permissions
                              </span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Partner">
                        <NavLink
                          to="/admin/dashboard/partners"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <Building size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">Partners</span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Student FAQ Responses">
                        <NavLink
                          to="/admin/dashboard/faq-response"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <MessageCircleQuestion
                                size={16}
                                className={isActive ? "text-forestGreen" : "text-gray-400"}
                              />
                              <span className="font-medium">FAQ Response</span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Assignment Extension">
                        <NavLink
                          to="/admin/dashboard/extension-requests"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <FileText
                                size={16}
                                className={isActive ? "text-forestGreen" : "text-gray-400"}
                              />
                              <span className="font-medium">Extension Requests</span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                    </div>
                  )}
                </li>
              </PermissionWrapper>

              {/* Landing Page Management Dropdown */}
              <PermissionWrapper section="Landing Page FAQ | Landing Page Statistics | Landing Page Features | Landing Page Testimonials">
                {/* Divider */}
                <hr className={`my-3 border-gray-200 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-50"}`} />

                <li>
                  <button
                    onClick={() => toggleDropdown("landing_page")}
                    className={getDropdownStyles(openDropdown === "landing_page")}
                    aria-expanded={openDropdown === "landing_page"}
                    aria-controls="landing-page-submenu"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Boxes className={iconStyle} />
                      {isOpen && (
                        <>
                          <span className="font-medium flex-grow text-left whitespace-nowrap">
                            Landing Management
                          </span>
                          {openDropdown === "landing_page" ? (
                            <ChevronUp className="shrink-0" size={16} />
                          ) : (
                            <ChevronDown className="shrink-0" size={16} />
                          )}
                        </>
                      )}
                    </div>
                  </button>
                  {isOpen && openDropdown === "landing_page" && (
                    <div
                      id="landing-page-submenu"
                      className="ml-3 mt-1 space-y-1 animate-[fadeIn_0.2s_ease-in-out]"
                    >
                      <PermissionWrapper section="Landing Page FAQ" action="view">
                        <NavLink
                          to="/admin/dashboard/landing-management/faqs"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <MessageSquareQuote size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">
                                FAQ Management
                              </span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Landing Page Statistics" action="view">
                        <NavLink
                          to="/admin/dashboard/landing-management/statistics"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <TrendingUp size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">
                                Statistics Management
                              </span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Landing Page Features" action="view">
                        <NavLink
                          to="/admin/dashboard/landing-management/features"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <Sparkles size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">
                                Features Management
                              </span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Landing Page Testimonials" action="view">
                        <NavLink
                          to="/admin/dashboard/testimonials/master"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <Image size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">
                                Logo Master
                              </span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Landing Page Testimonials" action="view">
                        <NavLink
                          to="/admin/dashboard/testimonials/list"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <MessageSquareQuote size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">
                                Testimonials
                              </span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                    </div>
                  )}
                </li>
              </PermissionWrapper>

              <PermissionWrapper section="AI Interview Settings">
                {/* Divider */}
                <hr className={`my-3 border-gray-200 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-50"}`} />
                {/* AI Management Dropdown */}
                <li>
                  <button
                    onClick={() => toggleDropdown("ai_management")}
                    className={getDropdownStyles(openDropdown === "ai_management")}
                    aria-expanded={openDropdown === "ai_management"}
                    aria-controls="ai-management-submenu"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Sparkles className={iconStyle} />
                      {isOpen && (
                        <>
                          <span className="font-medium flex-grow text-left whitespace-nowrap">
                            AI Management
                          </span>
                          {openDropdown === "ai_management" ? (
                            <ChevronUp className="shrink-0" size={16} />
                          ) : (
                            <ChevronDown className="shrink-0" size={16} />
                          )}
                        </>
                      )}
                    </div>
                  </button>
                  {isOpen && openDropdown === "ai_management" && (
                    <div
                      id="ai-management-submenu"
                      className="ml-3 mt-1 space-y-1 animate-[fadeIn_0.2s_ease-in-out]"
                    >
                      <NavLink
                        to="/admin/dashboard/ai-management/feature-settings"
                        className={({ isActive }) =>
                          getSubmenuLinkStyles(isActive)
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Settings
                              size={16}
                              className={isActive ? "text-forestGreen" : "text-gray-400"}
                            />
                            <span className="font-medium">AI Feature Settings</span>
                          </>
                        )}
                      </NavLink>
                    </div>
                  )}
                </li>
              </PermissionWrapper>

              <PermissionWrapper section="Support|Reviews|Contact|Subscribe|About|Tier|Feature Status|Feature Interest">
                {/* Divider */}
                <hr className={`my-3 border-gray-200 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-50"}`} />

                {/* Support Services Dropdown */}
                <li>
                  <button
                    onClick={() => toggleDropdown("services")}
                    className={getDropdownStyles(openDropdown === "services")}
                    aria-expanded={openDropdown === "services"}
                    aria-controls="services-submenu"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Wrench className={iconStyle} />
                      {isOpen && (
                        <>
                          <span className="font-medium flex-grow text-left whitespace-nowrap">
                            Services
                          </span>
                          {openDropdown === "services" ? (
                            <ChevronUp className="shrink-0" size={16} />
                          ) : (
                            <ChevronDown className="shrink-0" size={16} />
                          )}
                        </>
                      )}
                    </div>
                  </button>
                  {isOpen && openDropdown === "services" && (
                    <div
                      id="services-submenu"
                      className="ml-3 mt-1 space-y-1 animate-[fadeIn_0.2s_ease-in-out]"
                    >
                      <PermissionWrapper section="Support">
                        <NavLink
                          to="/admin/dashboard/support"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <LifeBuoy size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">
                                Support Requests
                              </span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Contact" action="view">
                        <NavLink
                          to="/admin/dashboard/contacts"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <UserSearch size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">
                                Contacts
                              </span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="About" action="view">
                        <NavLink
                          to="/admin/dashboard/about"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <Info size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">
                                About
                              </span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Blogs" action="view">
                        <NavLink
                          to="/admin/dashboard/blogs"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <FileText size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">
                                Blogs
                              </span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Subscribe">
                        <NavLink
                          to="/admin/dashboard/subscribe"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <UserSearch size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">
                                Subscribe
                              </span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Reviews">
                        <NavLink
                          to="/admin/dashboard/reviews"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <Star size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">
                                Reviews
                              </span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Tier">
                        <NavLink
                          to="/admin/dashboard/tiers"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <Gem size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">
                                Tiers
                              </span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Feature Status">
                        <NavLink
                          to="/admin/dashboard/features"
                          end
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <Sparkles size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">
                                Features
                              </span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Feature Interest">
                        <NavLink
                          to="/admin/dashboard/features/interested"
                          end
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <Sparkles size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">
                                Features Interested
                              </span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                    </div>
                  )}
                </li>
              </PermissionWrapper>

              <PermissionWrapper section="City|State|Country">
                <hr className={`my-3 border-gray-200 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-50"}`} />
                {/* Location Management Dropdown */}
                <li>
                  <button
                    onClick={() => toggleDropdown("location")}
                    className={getDropdownStyles(openDropdown === "location")}
                    title={!isOpen ? "Location Management" : ""}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <MapPin className={`shrink-0 ${iconStyle}`} />
                      {isOpen && (
                        <>
                          <span className="font-medium flex-grow text-left whitespace-nowrap">
                            Location Management
                          </span>
                          {openDropdown === "location" ? (
                            <ChevronUp className="shrink-0" size={16} />
                          ) : (
                            <ChevronDown className="shrink-0" size={16} />
                          )}
                        </>
                      )}
                    </div>
                  </button>
                  {isOpen && openDropdown === "location" && (
                    <div
                      id="location-management-submenu"
                      className="ml-3 mt-1 space-y-1 animate-[fadeIn_0.2s_ease-in-out]"
                    >
                      <PermissionWrapper section="Country">
                        <NavLink
                          to="/admin/dashboard/locations/countries"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <Globe size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">Countries</span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="State">
                        <NavLink
                          to="/admin/dashboard/locations/states"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <Map size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">States</span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="City">
                        <NavLink
                          to="/admin/dashboard/locations/cities"
                          className={({ isActive }) =>
                            getSubmenuLinkStyles(isActive)
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <Building2 size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">Cities</span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                    </div>
                  )}
                </li>
              </PermissionWrapper>

              <PermissionWrapper section="Terms Of Services|Privacy Policy|Footer|Social Media">
                <hr className={`my-3 border-gray-200 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-50"}`} />
                <li>
                  <button
                    onClick={() => toggleDropdown("legalPages")}
                    className={getDropdownStyles(openDropdown === "legalPages")}
                    aria-expanded={openDropdown === "legalPages"}
                    aria-controls="legal-pages-submenu"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className={iconStyle} />
                      {isOpen && (
                        <>
                          <span className="font-medium flex-grow text-left whitespace-nowrap">Legal Pages</span>
                          {openDropdown === "legalPages" ? (
                            <ChevronUp className="shrink-0" size={16} />
                          ) : (
                            <ChevronDown className="shrink-0" size={16} />
                          )}
                        </>
                      )}
                    </div>
                  </button>

                  {isOpen && openDropdown === "legalPages" && (
                    <div
                      id="legal-pages-submenu"
                      className="ml-3 mt-1 space-y-1 animate-[fadeIn_0.2s_ease-in-out]"
                    >
                      <PermissionWrapper section="Terms Of Services" action="view">
                        <NavLink
                          to="/admin/dashboard/terms-of-service"
                          className={({ isActive }) => getSubmenuLinkStyles(isActive)}
                        >
                          {({ isActive }) => (
                            <>
                              <FileText size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">Terms of Service</span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Privacy Policy" action="view">
                        <NavLink
                          to="/admin/dashboard/privacy-policy"
                          className={({ isActive }) => getSubmenuLinkStyles(isActive)}
                        >
                          {({ isActive }) => (
                            <>
                              <FileText size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">Privacy Policy</span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                      <PermissionWrapper section="Footer|Social Media">
                        <NavLink
                          to="/admin/dashboard/social-media"
                          className={({ isActive }) => getSubmenuLinkStyles(isActive)}
                        >
                          {({ isActive }) => (
                            <>
                              <Globe size={16} className={isActive ? "text-forestGreen" : "text-gray-400"} />
                              <span className="font-medium">Footer & Social Media</span>
                            </>
                          )}
                        </NavLink>
                      </PermissionWrapper>
                    </div>
                  )}
                </li>
              </PermissionWrapper>

              <PermissionWrapper section="SEO Meta">
                <li>
                  <NavLink
                    to="/admin/dashboard/seo-meta"
                    className={({ isActive }) => getNavLinkStyles(isActive)}
                  >
                    <Search className={iconStyle} />
                    {isOpen && <span className="font-medium whitespace-nowrap">SEO Meta</span>}
                  </NavLink>
                </li>
              </PermissionWrapper>

              {/* Profile Section for Partners */}
              {role === "partner" && (
                <div className="border-t border-gray-200">
                  <NavLink
                    to="/admin/dashboard/profile"
                    className={({ isActive }) => getNavLinkStyles(isActive)}
                  >
                    <UserCog className={iconStyle} />
                    {isOpen && <span className="font-medium">Profile</span>}
                  </NavLink>
                </div>
              )}
            </ul>
          </div>

          {/* Profile and Logout Section at Bottom */}
          <div className="pt-1  border-t border-gray-200 shrink-0">
            <div
              onClick={handleProfileClick}
              className={`flex ${isOpen
                ? "items-center gap-3 px-4 py-3 w-full"
                : "justify-center py-3 px-2 w-full"
                } rounded-lg hover:bg-lightGreen/20 transition-all duration-200 ease-in-out text-gray-700 hover:text-forestGreen ${role === "partner" ? "" : "cursor-pointer"}`}
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-leafGreen to-forestGreen flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-sm overflow-hidden shrink-0">
                {profile_image ? (
                  <img
                    src={profile_image || `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-white">
                    {username?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              {isOpen && (
                <div className="flex flex-col flex-grow min-w-0">
                  <span className="text-sm font-medium truncate">
                    {username?.charAt(0)?.toUpperCase() + username?.slice(1) || "User"}
                  </span>
                  <span className="text-xs text-gray-500 truncate">{role === 'partner' ? 'Partner' : 'Administrator'}</span>
                </div>
              )}
              {isOpen && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  className="ml-auto p-2 rounded-full hover:bg-red-50 text-gray-600 hover:text-red-600 transition-all duration-200 focus:outline-none shrink-0"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Imported Modals */}
        < ProfileModal
          showProfileModal={showProfileModal}
          closeProfileModal={closeProfileModal}
          setShowChangePassword={setShowChangePassword}
        />
      </div >
    </>

  );
}