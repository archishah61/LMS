"use client"

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect } from "react"
import { ShoppingBag, ChevronRight, BookOpen, Clock, CreditCard, Calendar, FileText } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { useGetPaymentByUserIdQuery } from "../../services/Enrollment/enrollAPI"
import { getStudentToken } from "../../services/CookieService"
import { slugify } from "../../utils/slugify"
import { useGetPaidCheatSheetsQuery } from "../../services/CheatSheet/cheatSheetApi"
import { useGetFeatureStatusByNameQuery } from "../../services/Masters/featureStatusAPI"
import { jwtDecode } from "jwt-decode"
import PrimaryLoader from "../../components/ui/PrimaryLoader"

function UserPurchase() {
  const navigate = useNavigate()
  const { id: reduxId } = useSelector((state) => state.user)
  const { access_token } = getStudentToken()

  let userId = reduxId;
  if (!userId && access_token) {
    try {
      const decoded = jwtDecode(access_token);
      userId = decoded.id;
    } catch (error) {
      console.error("Failed to decode token:", error);
    }
  }

  // Fetch feature status for cheatsheet
  const {
    data: featureData,
    isLoading: featureDataLoading,
    error: featureDataError
  } = useGetFeatureStatusByNameQuery(
    { name: "cheatsheet" }
  )

  // Fetch course purchase data using the API query
  const {
    data: purchaseData,
    isLoading: isCoursesLoading,
    error: coursesError,
    isError: isCoursesError,
  } = useGetPaymentByUserIdQuery(
    { id: userId, access_token },
    {
      skip: !userId,
    },
  )

  // Fetch cheatsheet purchase data - only if feature is active
  const {
    data: purchasedCheatSheets,
    isLoading: isCheatSheetsLoading,
    refetch: refetchPurchasedCheatSheets,
    error: cheatSheetsError,
    isError: isCheatSheetsError,
  } = useGetPaidCheatSheetsQuery(
    { access_token },
    {
      skip: !access_token || featureData?.is_active === 0, // Skip if feature is inactive
    },
  )

  const isLoading = isCoursesLoading && isCheatSheetsLoading && featureDataLoading

  // Check if cheatsheet feature is active
  const isCheatSheetActive = featureData?.is_active !== 0

  // Format course purchase data for display
  const coursePurchaseHistory = purchaseData && !isCoursesError
    ? purchaseData.map((item) => ({
      id: item.payment_id,
      type: item.type === "course-enroll" || item.type === "course-generation" ? "course" : "contest",
      tier_name: item.tier_name,
      orderId: item.enrollment_id?.toString(),
      transactionId: item.transaction_id,
      date: new Date(item.transaction_date).toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      item: {
        id: item.course_id || item.contest_id,
        public_hash: item.public_hash,
        title: item.course_title || item.contest_name,
        description: item.course_description || item.contest_description,
        price: Number.parseFloat(item.amount),
        originalPrice: Number.parseFloat(item.course_price),
        discount: Number.parseFloat(item.course_discount),
        thumbnail: item.thumbnail || item.contest_banner,
        duration: `${Math.floor(item.duration_minutes / 60)} hr ${item.duration_minutes % 60} mins`,
        status: item.course_status,
      },
      payment: {
        method: item.payment_method,
        status: item.payment_status,
        currency: item.currency,
      },
      enrollment: {
        status: item.enrollment_status,
        date: new Date(item.enrollment_date).toLocaleDateString(),
        expiryDate: new Date(item.expiry_date).toLocaleDateString(),
        expiryDays: item.expiry_days,
      },
    }))
    : []

  // Format cheatsheet purchase data for display - only if feature is active
  const cheatsheetPurchaseHistory = isCheatSheetActive && purchasedCheatSheets?.cheatsheets && !isCheatSheetsError
    ? purchasedCheatSheets.cheatsheets.map((item) => ({
      id: item.payment_details.payment_id,
      type: "cheatsheet",
      orderId: item.payment_details.payment_id?.toString(),
      transactionId: item.payment_details.transaction_id,
      date: new Date(item.payment_details.transaction_date).toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      item: {
        id: item.cheatsheet_id,
        title: item.title,
        description: item.description,
        price: Number.parseFloat(item.final_price),
        originalPrice: Number.parseFloat(item.price),
        discount: Number.parseFloat(item.discount),
        thumbnail: item.imageUrl,
        status: item.isActive ? "active" : "inactive",
      },
      payment: {
        method: item.payment_details.payment_method,
        status: item.payment_details.payment_status,
        currency: item.payment_details.currency,
      },
      enrollment: {
        status: item.isActive ? "active" : "inactive",
        date: new Date(item.access_granted_at).toLocaleDateString(),
      },
    }))
    : []

  // Loading state
  const isPageLoading = isCoursesLoading || isCheatSheetsLoading || featureDataLoading

  // Combine and sort all purchases by date (newest first)
  const allPurchaseHistory = [...coursePurchaseHistory, ...cheatsheetPurchaseHistory].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  )

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Check if there are actual errors (not 404s)
  const hasRealError = () => {
    if (isCoursesError && coursesError?.status !== 404) return true
    if (isCheatSheetsError && cheatSheetsError?.status !== 404) return true
    if (featureDataError) return true
    return false
  }

  const getThumbnailUrl = (item) => {
    if (item.thumbnail) {
      if (item.thumbnail.startsWith("/api/placeholder") || item.thumbnail.startsWith("http")) {
        return item.thumbnail
      }
      return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${item.thumbnail}`
    }
    return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`;
  }

  // Format currency based on the currency code
  const formatCurrency = (amount, currency = "USD") => {
    const currencySymbols = {
      USD: "$",
      INR: "₹",
      EUR: "€",
      GBP: "£",
    }
    const symbol = currencySymbols[currency] || currencySymbols.USD
    return `${symbol}${amount.toFixed(2)}`
  }

  // Navigate to item based on type
  const navigateToItem = (purchaseItem) => {
    if (purchaseItem.type === "course") {
      navigate(`/course/${slugify(purchaseItem.item.title)}`, {
        state: { public_hash: purchaseItem.item.public_hash },
      })
    } else if (purchaseItem.type === "cheatsheet" && isCheatSheetActive) {
      navigate(`/cheat-sheets/${slugify(purchaseItem.item.title)}`, {
        state: { sheetId: purchaseItem.item.id },
      })
    } else if (purchaseItem.type === "contest") {
      navigate(`/contests/${slugify(purchaseItem.item.title)}`, {
        state: { id: purchaseItem.item.id },
      })
    }
  }

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <PrimaryLoader />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pt-4 pb-4">
      <div className="container mx-auto ">
        {/* Header Section */}
        <div className="w-full mx-auto rounded-2xl overflow-hidden shadow-sm mb-6 sm:mb-8">
          <div
            className="px-4 xs:px-6 sm:px-8 py-6 sm:py-8 relative bg-cover bg-center text-white"
            style={{ backgroundImage: "url('/assets/My_Profile_Heading_Background.png')" }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Purchase History <ShoppingBag className="inline ml-1 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white text-opacity-80" /></h1>
              </div>
              <p className="text-indigo-100 text-xs sm:text-sm md:text-base opacity-90 font-light max-w-xl">
                All your course purchases and learning resources
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <section className="w-full mx-auto">
          {/* Header - Mobile First Approach */}
          <div className="flex flex-col items-start justify-between gap-2 mb-4 
                sm:flex-row sm:items-center sm:gap-4 sm:mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 
                   sm:text-lg 
                   md:text-xl">
                Purchased Items
              </h2>
              <span className="flex items-center justify-center bg-gray-100 text-gray-600 
                     text-xs font-bold px-2 py-0.5 rounded-full min-w-[24px]">
                {allPurchaseHistory.length}
              </span>
            </div>

            <div className="flex flex-col min-[301px]:flex-row min-[301px]:items-center text-xs font-medium text-black sm:text-sm gap-1 min-[301px]:gap-0">
              {isCheatSheetActive && (
                <>
                  <div className="flex items-center">
                    <button
                      onClick={() => navigate("/cheat-sheets")}
                      className="whitespace-nowrap hover:text-blue-600 transition-colors
                     px-1 py-0.5 rounded hover:bg-gray-50
                     min-[301px]:px-0 min-[301px]:py-0"
                    >
                      Explore CheatSheet
                    </button>
                    <span className="mx-2 text-gray-300 hidden min-[301px]:inline">|</span>
                  </div>
                </>
              )}
              <button
                onClick={() => navigate("/courses")}
                className="inline-flex items-center whitespace-nowrap 
               hover:text-blue-600 transition-colors
               px-1 py-0.5 rounded hover:bg-gray-50
               min-[301px]:px-0 min-[301px]:py-0"
              >
                Explore Courses
                <ChevronRight className="w-3 h-3 ml-1 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-gray-500 animate-pulse text-sm sm:text-base">Loading purchase history...</p>
            </div>
          ) : allPurchaseHistory.length === 0 ? (
            <div className="text-center py-12 sm:py-16 rounded-lg border border-gray-100 px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-lightGreen rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-primary">
                <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No purchases yet</h2>
              <p className="text-gray-500 mb-4 sm:mb-6 max-w-md mx-auto text-xs sm:text-sm">
                Start building your skills with our wide range of courses and resources!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:gap-6">
              {allPurchaseHistory.map((purchaseItem) => (
                <div key={`${purchaseItem.type}-${purchaseItem.id}`} className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4 md:p-5 flex flex-col md:flex-row gap-4 sm:gap-5 md:gap-6">

                  {/* Thumbnail */}
                  <div className="w-full md:w-48 lg:w-64 flex-shrink-0">
                    <div className="aspect-video rounded-md overflow-hidden bg-gray-100 relative shadow-sm">
                      {purchaseItem.item.thumbnail ? (
                        <img
                          src={getThumbnailUrl(purchaseItem.item)}
                          alt={purchaseItem.item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "/assets/placeholder2.png";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <BookOpen size={24} sm:size={32} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="flex gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded border border-blue-100 uppercase tracking-wide">
                          {purchaseItem.type}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 leading-tight line-clamp-2">
                      {purchaseItem.item.title}
                    </h3>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-100">
                        Payment: {purchaseItem.payment.status}
                      </span>
                      {purchaseItem.type !== "contest" &&
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-100">
                          Enrollment: {purchaseItem.enrollment.status}
                        </span>
                      }
                    </div>

                    <p className="text-xs sm:text-sm text-black mb-3 sm:mb-4 line-clamp-2 overflow-hidden" dangerouslySetInnerHTML={{ __html: purchaseItem.item.description }} />

                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-y-2 text-xs text-gray-500 mt-auto">
                      {purchaseItem.type === "course" && (
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} sm:size={14} className="text-gray-500" />
                          <span className="truncate">Duration: {purchaseItem.item.duration}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} sm:size={14} className="text-gray-500" />
                        <span className="truncate">Purchase: {purchaseItem.date.split(',')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CreditCard size={12} sm:size={14} className="text-gray-500" />
                        <span className="truncate">Method: {purchaseItem.payment.method}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Price & Action */}
                  <div className="flex flex-row md:flex-col justify-between items-center md:items-end pt-3 md:pt-0 md:pl-4 lg:pl-6 md:w-36 lg:w-48 flex-shrink-0">
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2 mb-1">
                        <span className="text-lg sm:text-xl font-bold text-black">
                          {formatCurrency(purchaseItem.item.price, purchaseItem.payment.currency)}
                        </span>
                        {purchaseItem.item.originalPrice > purchaseItem.item.price && (
                          <span className="text-xs text-gray-400 line-through hidden sm:inline">
                            {formatCurrency(purchaseItem.item.originalPrice, purchaseItem.payment.currency)}
                          </span>
                        )}
                      </div>
                      {purchaseItem.item.discount > 0 && (
                        <span className="inline-block px-2 py-0.5 bg-red-50 text-red-600 text-xs font-bold rounded border border-red-100">
                          {purchaseItem.item.discount}% OFF
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => navigateToItem(purchaseItem)}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 border border-primary text-primary bg-lightGreen/50 rounded-lg text-xs font-bold uppercase tracking-wide md:w-full mt-auto whitespace-nowrap"
                    >
                      {purchaseItem.type === "course" ? "View Course" : purchaseItem.type === "contest" ? "View Contest" : "View CheatSheet"}
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default UserPurchase