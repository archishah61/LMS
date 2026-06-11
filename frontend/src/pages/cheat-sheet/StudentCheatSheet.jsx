import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, Tag, Search, Filter, X, CheckCircle } from "lucide-react";
import { useGetActiveCheatSheetsQuery, useGetPaidCheatSheetsQuery } from "../../services/CheatSheet/cheatSheetApi";
import { useNavigate } from "react-router-dom";
import { getStudentToken } from "../../services/CookieService";
import { slugify } from "../../utils/slugify";
import ErrorBoundary from "../../components/common/ErrorBoundary";
import RazorpayButton from "../../components/razorpay/RazorpayButton";
import { usePayCheatSheetMutation } from "../../services/CheatSheet/cheatSheetApi";
import toast from "react-hot-toast";
import SupportModal from "../../components/modal/SupportModal";
import { useGetFeatureStatusByNameQuery } from "../../services/Masters/featureStatusAPI";
import ComingSoonModal2 from "../../components/modal/ComingSoonModal2";
import PrimaryLoader from "../../components/ui/PrimaryLoader";

export default function StudentCheatSheet() {
  return (
    <ErrorBoundary showDetails={false}>
      <StudentCheatSheetContent />
    </ErrorBoundary>
  );
}

function StudentCheatSheetContent() {
  const navigate = useNavigate();
  const { access_token } = getStudentToken();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingSheetId, setProcessingSheetId] = useState(null);
  const [selectedSupportItem, setSelectedSupportItem] = useState(null);
  const [isSupportModalOpen, setSupportModalOpen] = useState(false);

  const [payCheatSheet] = usePayCheatSheetMutation();
  const itemsPerPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset page on search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: activeSheetsData, isLoading, isFetching, error } = useGetActiveCheatSheetsQuery({
    search_term: debouncedSearch,
    filter: filterType,
    page: currentPage,
    limit: itemsPerPage,
    access_token
  });

  const cheatSheets = activeSheetsData?.cheatsheets || [];
  const totalPages = activeSheetsData?.total_pages || 1;
  const totalCount = activeSheetsData?.total_count || 0;
  const {
    data: purchasedCheatSheets,
    isLoading: isPurchasedLoading,
    refetch: refetchPurchasedCheatSheets,
  } = useGetPaidCheatSheetsQuery(
    { access_token },
    {
      skip: !access_token,
    }
  );

  const { data: featureData, isLoading: featureDataLoading, error: featureDataError } =
    useGetFeatureStatusByNameQuery(
      { name: "cheatsheet" }
    );

  const formatPrice = (price) => {
    const numPrice = Number(price);
    return isNaN(numPrice) ? 0 : numPrice;
  };

  const hasPurchased = (cheatSheetId) => {
    if (!purchasedCheatSheets?.cheatsheets) return false;
    return purchasedCheatSheets.cheatsheets.some((purchased) => purchased.cheatsheet_id === cheatSheetId);
  };

  const handleRazorpayPurchase = async (sheetId, razorpayResponse) => {
    setProcessingSheetId(sheetId);
    try {
      const sheetToPurchase = cheatSheets.find((s) => s.id === sheetId);
      if (!sheetToPurchase) {
        toast.error("Cheat sheet not found for purchase.");
        return;
      }

      const finalAmount = Number.parseFloat(
        sheetToPurchase.price * (1 - (sheetToPurchase.discount || 0) / 100)
      ).toFixed(2);

      const purchasePayload = {
        cheatsheet_id: sheetId,
        amount: razorpayResponse.data.amount / 100,
        currency: razorpayResponse.data.currency || "INR",
        payment_method: razorpayResponse.data.method,
        payment_gateway: "razorpay",
        gateway_response: razorpayResponse.data,
        transaction_id: razorpayResponse.data.id,
        reference_id: razorpayResponse.data.order_id,
        status: razorpayResponse.data.captured ? "completed" : "failed",
      };

      await payCheatSheet({
        purchase: purchasePayload,
        access_token,
        should_revalidate_tags: true
      }).unwrap();

      toast.success("Payment successful! You now have access to the cheat sheet.");
      // We don't usually need to manually refetch if tags are set up correctly, but keeping it for safety
      refetchPurchasedCheatSheets();
      setTimeout(() => {
        navigate(`/cheat-sheets/${slugify(sheetToPurchase.title)}`, {
          state: { sheetId: sheetToPurchase.id },
        });
      }, 3000);
    } catch (error) {
      console.error("Purchase failed:", error);
      toast.error(error?.data?.message || "Payment failed. Please try again.");
    } finally {
      setProcessingSheetId(null);
    }
  };

  const handleViewDetails = (sheet) => {
    navigate(`/cheat-sheets/${slugify(sheet.title)}`, {
      state: { sheetId: sheet.id },
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
    setCurrentPage(1); // Reset page on filter change
  };

  // Show coming soon page if feature is inactive

  // Show coming soon page if feature is inactive
  if (featureData?.is_active === 0) {
    return <ComingSoonModal2 featureData={featureData} />;
  }

  // Show loading state
  // Show loading state - Only on initial load or if we have no data and are loading
  // This prevents the "jerk" effect on search
  const isInitialLoad = (isLoading || isPurchasedLoading || featureDataLoading) && !cheatSheets.length;

  if (isInitialLoad)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <PrimaryLoader />
      </div>
    );

  // Show error state
  if (error || featureDataError)
    return (
      <div className="text-red-500 text-center p-4 bg-red-50 min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
          <p>Error loading cheat sheets: {error?.toString() || featureDataError?.toString()}</p>
        </div>
      </div>
    );

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-5 lg:px-8 py-4 md:py-6 lg:py-8 min-h-screen">
      {/* Header Section */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">Cheat Sheets</h1>
        <p className="text-gray-500 text-xs sm:text-sm md:text-base">
          Access a collection of quick reference guides to master complex topics.
          Filter by free, paid, or view your purchased sheets below.
        </p>
      </div>

      {/* Purchased Cheat Sheets Section */}
      {access_token && (
        <div className="mb-8 md:mb-10">
          <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4 flex items-center">
            <CheckCircle size={18} className="mr-2 text-leafGreen w-4 h-4 md:w-5 md:h-5" />
            My Purchased Cheat Sheets
          </h2>

          {purchasedCheatSheets?.cheatsheets?.length > 0 ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {purchasedCheatSheets.cheatsheets.map((sheet) => (
                <CheatSheetCard
                  key={sheet.cheatsheet_id}
                  sheet={{ ...sheet, id: sheet.cheatsheet_id }}
                  isPurchased={true}
                  formatPrice={formatPrice}
                  handleRazorpayPurchase={handleRazorpayPurchase}
                  handleViewDetails={handleViewDetails}
                  processingSheetId={processingSheetId}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 md:p-6 border border-dashed border-gray-300 text-center">
              <p className="text-gray-500 text-xs sm:text-sm">You haven't purchased any cheat sheets yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area: Search/Filter & Grid */}
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 border-b border-gray-200 pb-3 md:pb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2 md:mb-0">
            {filterType === 'all' ? 'All Cheat Sheets' :
              filterType === 'free' ? 'Free Cheat Sheets' :
                filterType === 'paid' ? 'Paid Cheat Sheets' : 'Filtered Results'}
          </h2>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-56 lg:w-64">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 md:pl-9 md:pr-8 py-1.5 md:py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-leafGreen focus:border-leafGreen text-xs md:text-sm"
              />
              <Search size={14} className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4" />
              {searchTerm && (
                <X
                  size={14}
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 md:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer w-3.5 h-3.5 md:w-4 md:h-4"
                />
              )}
            </div>

            <div className="relative md:w-36 lg:w-40">
              <select
                value={filterType}
                onChange={handleFilterChange}
                className="appearance-none w-full pl-2.5 md:pl-3 pr-7 md:pr-8 py-1.5 md:py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-leafGreen focus:border-leafGreen text-xs md:text-sm bg-white"
              >
                <option value="all">All Sheets</option>
                <option value="free">Free Only</option>
                <option value="paid">Paid Only</option>
              </select>
              <Filter
                size={14}
                className="absolute right-2.5 md:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-3.5 h-3.5 md:w-4 md:h-4"
              />
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="relative min-h-[200px]">
          {/* Loading Overlay for Search/Filter */}
          {isFetching && !isLoading && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-start justify-center pt-16 md:pt-20 backdrop-blur-[1px]">
              <div className="w-7 h-7 md:w-8 md:h-8 border-2 border-leafGreen border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {cheatSheets.length === 0 ? (
            <div className="text-center py-8 md:py-12 bg-gray-50 rounded-lg">
              <h3 className="text-base md:text-lg font-medium text-gray-600 mb-1 md:mb-2">No Cheat Sheets Found</h3>
              <p className="text-gray-500 text-xs md:text-sm">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              <AnimatePresence mode='wait'>
                {cheatSheets.map((sheet) => (
                  <CheatSheetCard
                    key={sheet.id}
                    sheet={sheet}
                    isPurchased={hasPurchased(sheet.id)}
                    formatPrice={formatPrice}
                    handleRazorpayPurchase={handleRazorpayPurchase}
                    handleViewDetails={handleViewDetails}
                    processingSheetId={processingSheetId}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {cheatSheets.length > 0 && totalPages > 1 && (
        <div className="mt-6 md:mt-8 flex justify-center items-center space-x-3 md:space-x-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 border border-gray-300"
              }`}
          >
            Previous
          </button>

          <span className="text-gray-600 text-xs md:text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 border border-gray-300"
              }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Support Modal */}
      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        defaultCategory={'Content'}
        relatedId={selectedSupportItem?.id}
        relatedName={selectedSupportItem?.title}
        defaultRelatedType={'cheatsheet'}
      />
    </div>
  );
}

// Reusable Card Component
const CheatSheetCard = ({ sheet, isPurchased = false, formatPrice, handleRazorpayPurchase, handleViewDetails, processingSheetId }) => {
  const showPurchaseButton = sheet.isPaid && !isPurchased;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-lg overflow-hidden border border-gray-200 flex flex-col h-full shadow-sm p-1.5 md:p-2"
    >
      {/* Image/Thumbnail Section - Responsive aspect ratio */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] bg-gray-50 flex items-center justify-center overflow-hidden rounded-md">
        <img
          src={sheet.imageUrl ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${sheet.imageUrl}` : "/assets/placeholder2.png"}
          alt={sheet.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = "/assets/placeholder2.png"
          }}
        />

        {/* Paid Badge */}
        {!!sheet.isPaid && (
          <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-forestGreen text-white px-2 py-0.5 md:px-3 rounded-full text-[10px] md:text-xs font-bold flex items-center shadow-sm">
            Paid
          </div>
        )}

        {/* Owned Badge */}
        {isPurchased && (
          <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 bg-leafGreen text-white px-2 py-0.5 md:px-3 rounded-full text-[10px] md:text-xs font-bold flex items-center shadow-sm">
            <CheckCircle size={10} className="mr-0.5 md:mr-1 w-2.5 h-2.5 md:w-3 md:h-3" />
            Owned
          </div>
        )}
      </div>

      {/* Content Section - Compact & Responsive */}
      <div className="p-2 md:p-3 flex flex-col flex-grow">
        {/* Title */}
        <h2 className="text-sm md:text-lg font-bold mb-0.5 md:mb-1 text-gray-800 line-clamp-1 flex items-center" title={sheet.title}>
          <Book size={12} className="mr-1 md:mr-1.5 text-leafGreen flex-shrink-0 w-3 h-3 md:w-4 md:h-4" />
          <span className="truncate">{sheet.title}</span>
        </h2>

        {/* Description */}
        <p className="text-gray-500 text-[10px] md:text-xs mb-2 md:mb-3 line-clamp-2 flex-grow">
          {sheet.description}
        </p>

        {/* Price and Action Button */}
        <div className="flex justify-between items-center mt-auto pt-1.5 md:pt-2 border-t border-gray-100">
          <div className="min-w-0">
            {sheet.isPaid ? (
              <div className="flex items-center min-w-0">
                <span className="mr-0.5 text-gray-700 text-[10px] md:text-xs">₹</span>
                {Number(sheet.discount) > 0 ? (
                  <div className="flex items-center flex-wrap min-w-0">
                    <span className="line-through text-gray-400 mr-1 md:mr-2 text-[10px] md:text-xs truncate">
                      {formatPrice(sheet.price).toFixed(2)}
                    </span>
                    <span className="font-bold text-gray-800 text-sm md:text-lg truncate">
                      {formatPrice(sheet.price * (1 - sheet.discount / 100)).toFixed(2)}
                    </span>
                    <span className="ml-1 md:ml-2 text-[9px] md:text-xs text-green-600 font-bold bg-green-50 px-1 py-0.5 md:px-2 rounded truncate">
                      {Math.round(sheet.discount)}% OFF
                    </span>
                  </div>
                ) : (
                  <span className="font-bold text-gray-800 text-sm md:text-lg truncate">
                    {formatPrice(sheet.price).toFixed(2)}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-leafGreen font-bold flex items-center text-xs md:text-sm truncate">
                <Tag size={10} className="mr-0.5 md:mr-1 w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                Free
              </div>
            )}
          </div>

          {/* Action Button - Responsive */}
          {showPurchaseButton ? (
            <RazorpayButton
              amount={formatPrice(sheet.price * (1 - (sheet.discount || 0) / 100)).toFixed(2)}
              onResult={(response) => handleRazorpayPurchase(sheet.id, response)}
              buttonText={processingSheetId === sheet.id ? "..." : "Buy"}
              disabled={processingSheetId === sheet.id}
              className="px-2 py-0.5 md:px-2 md:py-1 rounded-md bg-primary border border-white text-white text-xs md:text-sm font-bold min-w-[55px] md:min-w-[70px]"
            />
          ) : (
            <button
              onClick={() => handleViewDetails(sheet)}
              className="px-2 py-0.5 md:px-2 md:py-1 rounded-md border border-primary bg-primary/20 text-primary text-xs md:text-sm font-bold min-w-[55px] md:min-w-[70px]"
            >
              View
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};