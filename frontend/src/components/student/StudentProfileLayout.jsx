import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, User, BookOpen, ShoppingBag, Heart, Trophy, Headphones, CreditCard, ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getStudentToken } from '../../services/CookieService';
import { jwtDecode } from 'jwt-decode';
import { useGetUserByIdQuery } from '../../services/userAuthApi';
import PrimaryLoader from '../ui/PrimaryLoader';

function StudentProfileLayout() {
  let id, email, username;
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Responsive breakpoints
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isXs = windowWidth >= 344 && windowWidth < 640;
  const isSm = windowWidth >= 640 && windowWidth < 768;
  const isMd = windowWidth >= 768 && windowWidth < 1024;
  const isLg = windowWidth >= 1024 && windowWidth < 1280;
  const isXl = windowWidth >= 1280 && windowWidth < 1536;
  const is2xl = windowWidth >= 1536;
  
  // Determine if mobile (less than 1024px)
  const isMobile = windowWidth < 1024;

  // Responsive values
  const sidebarWidth = isXs ? '240px' : 
                      isSm ? '260px' : 
                      isMd ? '280px' : 
                      '300px';
                      
  const userInfoSize = {
    avatar: isXs ? '2.5rem' : 
            isSm ? '2.75rem' : 
            isMd ? '3rem' : 
            '3.25rem',
    fontSize: {
      name: isXs ? '0.875rem' : '1rem',
      email: isXs ? '0.625rem' : '0.75rem'
    }
  };

  const { access_token } = getStudentToken();
  if (access_token) {
    try {
      const decodedToken = jwtDecode(access_token);
      id = decodedToken.id;
      email = decodedToken.email;
      username = decodedToken.username;
    } catch (e) {
      // ignore decode errors; fallback UI will be shown
    }
  }

  const {
    data: profileData,
    isLoading
  } = useGetUserByIdQuery({ id, access_token }, { skip: !id });

  let profile_image = profileData?.profile_image;

  const getProfileImg = () => {
    if (profile_image) {
      return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${profile_image || "/assets/placeholder_mini.png"}`;
    }
    return "/assets/placeholder_mini.png";
  };

  const getInitial = (name) => {
    return name && name.length > 0 ? name.charAt(0).toUpperCase() : '?';
  };

  const menuItems = [
    { label: 'My Profile', to: '', icon: User },
    { label: 'Enrolled Courses', to: 'enrolled-courses', icon: BookOpen },
    { label: 'My Purchases', to: 'purchases', icon: ShoppingBag },
    { label: 'My Wishlist', to: 'wishlist', icon: Heart },
    // { label: 'My Challenges', to: 'challenges', icon: Trophy },
    { label: 'Transactions', to: 'transactions', icon: CreditCard }
  ];

  // Handle resize events
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-close sidebar on route change for mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [navigate, isMobile]);

  const openSidebar = () => {
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Responsive padding classes
  const getContainerPadding = () => {
    return 'px-3 xs:px-4 sm:px-6 md:px-8 lg:px-8 xl:px-10 2xl:px-12';
  };

  // Responsive text sizes
  const getTextSizes = () => ({
    heading: 'text-lg xs:text-xl sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl',
    body: 'text-sm xs:text-sm sm:text-base md:text-base lg:text-base',
    small: 'text-xs xs:text-xs sm:text-sm md:text-sm',
    tiny: 'text-[10px] xs:text-[11px] sm:text-xs',
    menu: 'text-sm xs:text-sm sm:text-sm md:text-base'
  });

  const textSizes = getTextSizes();

  if (isLoading) {
    return (
      <div className="flex h-screen bg-white items-center justify-center">
        <PrimaryLoader />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden flex-col">
      {/* Top Header - Responsive */}
      <div className={`w-full h-12 xs:h-14 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between ${getContainerPadding()} shrink-0 z-50 relative`}>
        {/* Left side: Menu button (mobile only) */}
        <div className={`${isMobile ? 'flex' : 'hidden'} items-center`}>
          <button
            onClick={toggleSidebar}
            className="p-1.5 xs:p-2 -ml-1 xs:-ml-2 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            {/* Show right arrow when sidebar is closed, left arrow when open */}
            {isSidebarOpen ? (
              <ChevronLeft size={isXs ? 20 : 24} />
            ) : (
              <ChevronRight size={isXs ? 20 : 24} />
            )}
          </button>
        </div>

        {/* Center/Right side: Back to Home button */}
        <div className={`${isMobile ? 'ml-auto' : ''}`}>
          <button
            onClick={() => navigate('/student-dashboard')}
            className="flex items-center gap-1.5 xs:gap-2 text-gray-700 font-medium hover:text-black transition-colors"
          >
            <ArrowLeft size={isXs ? 16 : 18} />
            <span className={`${textSizes.small} xs:${textSizes.body}`}>Back to Home</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Overlay */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}

        {/* Sidebar - Responsive */}
        <aside
          className={`
            bg-white border-r border-gray-100 flex flex-col absolute lg:static h-full z-40 
            transition-all duration-300 ease-in-out shadow-r-sm
            ${isMobile 
              ? (isSidebarOpen 
                ? 'translate-x-0 shadow-xl' 
                : '-translate-x-full') 
              : 'translate-x-0'}
          `}
          style={{ width: isMobile ? sidebarWidth : sidebarWidth }}
        >

          {/* Sidebar Header with Close Button - Top Right */}
          <div className={`px-4 xs:px-5 pt-4 xs:pt-5 pb-2 xs:pb-3 ${isMd ? 'pt-6' : ''} relative`}>
            {/* Close Button - Top Right (Mobile only) */}
            {/* {isMobile && (
              <div className="absolute top-2 xs:top-3 right-2 xs:right-3 p-1 xs:p-2 z-10">
                <button 
                  onClick={closeSidebar}
                  className="rounded-full p-1.5 hover:bg-gray-100 transition-colors flex items-center justify-center"
                  aria-label="Close sidebar"
                >
                  <ChevronLeft size={isXs ? 18 : 20} className="text-gray-500" />
                </button>
              </div>
            )} */}

            {/* User Info */}
            <div className="flex items-center gap-3 xs:gap-4 p-2.5 xs:p-3 border border-gray-100 rounded-lg xs:rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200 mt-2 xs:mt-0">
              <div 
                className="relative overflow-hidden rounded-full border border-gray-100 flex items-center justify-center bg-gray-50 shrink-0"
                style={{ 
                  width: userInfoSize.avatar, 
                  height: userInfoSize.avatar 
                }}
              >
                {profile_image ? (
                  <img 
                    src={getProfileImg()} 
                    alt={username} 
                    className="w-full h-full object-cover" 
                    onError={(e) => e.target.src = "/assets/placeholder_mini.png"}
                  />
                ) : (
                  <span 
                    className="font-semibold text-gray-700"
                    style={{ fontSize: `calc(${userInfoSize.avatar} * 0.4)` }}
                  >
                    {getInitial(username)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p 
                  className="font-bold text-gray-900 truncate"
                  style={{ fontSize: userInfoSize.fontSize.name }}
                >
                  {username || 'Student'}
                </p>
                <p 
                  className="text-gray-500 truncate"
                  style={{ fontSize: userInfoSize.fontSize.email }}
                >
                  {email || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation - Responsive */}
          <nav className="flex-1 overflow-y-auto px-3 xs:px-4 sm:px-5 py-2 xs:py-3">
            <ul className="space-y-0.5 xs:space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const iconSize = isXs ? 16 : isSm ? 17 : 18;
                
                return (
                  <li key={item.label}>
                    <NavLink
                      to={item.to}
                      end={item.to === ''}
                      onClick={closeSidebar}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 xs:gap-3 px-3 xs:px-4 py-2.5 xs:py-3 rounded-md transition-all duration-200 font-medium group ${
                          isActive
                            ? 'bg-lightGreen text-black shadow-sm'
                            : 'text-black hover:bg-gray-50 hover:shadow-sm'
                        }`
                      }
                      style={({ isActive }) => ({ 
                        borderRight: isActive ? '4px solid #00BB6E' : '4px solid transparent',
                        fontSize: isXs ? '0.875rem' : '0.9375rem'
                      })}
                    >
                      <Icon 
                        size={iconSize} 
                        className="group-hover:scale-105 transition-transform flex-shrink-0" 
                      />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sidebar Footer - Need Help - Responsive */}
          <div className={`p-3 xs:p-4 sm:p-5 mt-auto border-t border-gray-100 ${isMd ? 'pt-4' : ''}`}>
            <button
              onClick={() => {
                navigate('/user-profile-layout/support');
                closeSidebar();
              }}
              className="w-full bg-lightGreen px-3 xs:px-4 py-2.5 xs:py-3 rounded-lg xs:rounded-xl cursor-pointer text-left flex flex-col gap-1 xs:gap-1.5 border-2 border-primary/40 hover:border-primary/60 group transition-all duration-200 hover:shadow-sm"
            >
              <p className={`font-bold text-black ${textSizes.small} xs:${textSizes.body}`}>
                Need Help?
              </p>
              <p className={`text-gray-500 ${textSizes.tiny} xs:${textSizes.small}`}>
                Contact support for assistance
              </p>
            </button>
          </div>
        </aside>

        {/* Main Content Area - Responsive */}
        <main className="flex-1 overflow-y-auto bg-white scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <div className={`w-full mx-auto ${getContainerPadding()} py-4 xs:py-5 sm:py-6 md:py-8`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default StudentProfileLayout;