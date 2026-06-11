/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import AdminLoader from "../AdminLoader";
import {
  useGetPartnersQuery,
  useUpdatePartnerStatusMutation,
} from "../../../services/Become_partner/becomePartnerApi";
import {
  X,
  Check,
  Search,
  Filter,
  User,
  Building,
  ChevronRight,
  Clock,
  AlertTriangle,
  Globe,
  Mail,
  Phone,
  Calendar,
  FileText,
  ChevronLeft,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import PermissionWrapper from "../../../context/PermissionWrapper";
import { slugify } from "../../../utils/slugify";
import { useGetPartnerStatusByIdQuery, useTogglePartnerStatusMutation } from "../../../services/Become_partner/isPartnerActiveAPI";

export default function Partner() {
  const { access_token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [partnerTypeFilter, setPartnerTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const limitOptions = [10, 20, 50, 100, 500];

  const {
    data: partnersData,
    isLoading,
    isError,
  } = useGetPartnersQuery({ search_term: searchTerm, limit: limit, offset: limit !== "all" ? limit * (currentPage - 1) : 0, status: statusFilter, partner_type: partnerTypeFilter, access_token });

  const isAnyFilterApplied = () => {
    return (
      statusFilter !== "All" ||
      partnerTypeFilter !== "All" ||
      searchTerm !== ""
    );
  };

  // for pending partners
  const {
    data: pendingPartnersData,
    isLoading: pendingPartnersLoading,
    isError: pendingPartnersError
  } = useGetPartnersQuery({ limit: 'all', offset: 0, status: "Pending", access_token });

  const [updatePartnerStatus] = useUpdatePartnerStatusMutation();
  const [togglePartnerFeature, { isLoading: toggleLoading }] = useTogglePartnerStatusMutation();
  const [pendingPartners, setPendingPartners] = useState([]);
  const [approvedPartners, setApprovedPartners] = useState([]);
  const [showNotification, setShowNotification] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPendingPartner, setSelectedPendingPartner] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showAllFilters, setShowAllFilters] = useState(false);

  const { data: partnerFeatureStatus, isLoading: statusLoading, isError: statusError } = useGetPartnerStatusByIdQuery({
    id: 1,
  });

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleTogglePartnerFeature = async () => {
    try {
      await togglePartnerFeature({ id: 1, access_token }).unwrap();
      toast.success("Partner feature status toggled successfully.");
    } catch (error) {
      console.error("Failed to toggle partner feature:", error);
      toast.error(error?.data?.error || "Failed to toggle partner feature. Please try again.");
    }
  };

  useEffect(() => {
    if (pendingPartnersData?.partners) {
      setPendingPartners(pendingPartnersData?.partners);
      // setApprovedPartners(pendingPartnersData?.partners.filter((partner) => partner.status === "Approved"));
    }
  }, [pendingPartnersData?.partners]);

  // Filter partners by search term, partner type, and status
  // const filteredPartners = partnersData?.partners?.filter((partner) => {
  //   const matchesSearch =
  //     partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     partner.phone.includes(searchTerm);

  //   const matchesType =
  //     partnerTypeFilter === "All" || partner.partner_type === partnerTypeFilter;

  //   const matchesStatus =
  //     statusFilter === "All" || partner.status === statusFilter;

  //   return matchesSearch && matchesType && matchesStatus;
  // }) || [];

  const filteredPartners = partnersData?.partners || [];

  const pagination = partnersData?.pagination || { totalPages: 1, totalCount: 1 };

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setTimeout(() => {
      setSelectedPendingPartner(null);
    }, 300); // Wait for animation to complete
  };

  const viewPendingPartner = (partner) => {
    setSelectedPendingPartner(partner);
  };

  const handleApprovePartner = async (partnerId) => {
    try {
      setIsApproving(true);
      await updatePartnerStatus({
        partnerId,
        status: "Approved",
        access_token,
      }).unwrap();
      toast.success("Partner has been successfully approved.");
      closeSidebar();
    } catch (error) {
      console.error("Failed to approve partner:", error);
      toast.error(error?.data?.error || "Failed to approve partner. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectPartner = async (partnerId) => {
    try {
      setIsRejecting(true);
      await updatePartnerStatus({
        partnerId,
        status: "Rejected",
        access_token,
      }).unwrap();
      toast.error("Partner has been rejected.");
      closeSidebar();
    } catch (error) {
      console.error("Failed to reject partner:", error);
      toast.error(error?.data?.error || "Failed to reject partner. Please try again.");
    } finally {
      setIsRejecting(false);
    }
  };

  const getPartnerTypeIcon = (type) => {
    switch (type) {
      case "Individual":
        return <User className="mr-1 h-4 w-4" />;
      case "Organization":
        return <Building className="mr-1 h-4 w-4" />;
      default:
        return null;
    }
  };

  const getPartnerTypeColor = (type) => {
    switch (type) {
      case "Individual":
        return "bg-forestGreen bg-leafGreen text-forestGreen";
      case "Organization":
        return "bg-leafGreen bg-lightGreen text-forestGreen";
      default:
        return "from-gray-400 to-gray-600 bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <AdminLoader message="Loading partners data..." />;
  }

  if (isError) {
    return (
      <div className="p-6 text-center min-h-screen flex items-center justify-center bg-gradient-to-br from-lightGreen via-white to-lightGreen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 p-8 rounded-lg shadow-lg border-l-4 border-red-500 max-w-md"
        >
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center mb-4"
          >
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </motion.div>
          <h3 className="text-red-700 font-bold text-xl mb-3">
            Error Loading Data
          </h3>
          <p className="text-red-600 mb-4">
            There was a problem fetching the partners data. Please try again
            later or contact support.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
          >
            Retry
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full px-4 sm:px-6 py-4">
          {/* Mobile Header - Centered title with back button on right */}
          <div className="md:hidden flex items-center justify-between mb-3">
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold  text-forestGreen">
                Partners
              </h1>
            </div>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="p-2 border text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          </div>

          {/* Desktop Header - Original layout */}
          <div className="hidden md:flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold  text-forestGreen">Become Partner Feature</h1>
              <p className="text-gray-600 mt-1">
                {statusLoading ? (
                  "Loading..."
                ) : statusError ? (
                  "Error loading status"
                ) : (
                  partnerFeatureStatus?.isActive === 'Active' ? "Become A Partner Feature Is Active" : "Become A Partner Feature Is Inactive" || "Unknown"
                )}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* <PermissionWrapper section="Partner Active" action="toggle">
                <label
                  className="relative inline-flex items-center cursor-pointer"
                  title={partnerFeatureStatus?.isActive}
                >
                  <input
                    type="checkbox"
                    checked={partnerFeatureStatus?.isActive === 'Active'}
                    onChange={handleTogglePartnerFeature}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                  <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                </label>
              </PermissionWrapper> */}

              <button
                onClick={() => setShowAllFilters(!showAllFilters)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
              >
                <Filter size={18} />
                <span className="font-medium">Filters</span>
                {showAllFilters ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              <button
                onClick={() => navigate("/admin/dashboard")}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-300 rounded-lg shadow-sm"
              >
                <ArrowLeft size={18} />
                <span className="font-medium">Back</span>
              </button>
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="md:hidden flex items-center gap-2 mb-3">
            {/* <PermissionWrapper section="Partner Active" action="toggle">
              <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-gray-600 bg-gray-50 border border-gray-300 rounded-lg shadow-sm">
                <label
                  className="relative inline-flex items-center cursor-pointer"
                  title={partnerFeatureStatus?.isActive}
                >
                  <input
                    type="checkbox"
                    checked={partnerFeatureStatus?.isActive === 'Active'}
                    onChange={handleTogglePartnerFeature}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                  <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                </label>
                <span className="text-xs font-medium">
                  {partnerFeatureStatus?.isActive === 'Active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </PermissionWrapper> */}

            <button
              onClick={() => setShowAllFilters(!showAllFilters)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors font-medium text-sm"
            >
              <Filter size={16} />
              <span>Filters</span>
              {showAllFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Filters */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${showAllFilters ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
              }`}
          >
            <div className="p-3 bg-lightGreen/5 rounded-lg border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Search Input - Takes 1/2 width on medium screens and up */}
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Search Partners
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen/20 focus:border-leafGreen"
                    />
                  </div>
                </div>

                {/* Partner Type Filter - Takes 1/4 width */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen/20 focus:border-leafGreen"
                    value={partnerTypeFilter}
                    onChange={(e) => setPartnerTypeFilter(e.target.value)}
                  >
                    <option value="All">All Types</option>
                    <option value="Individual">Individual</option>
                    <option value="Organization">Organization</option>
                  </select>
                </div>

                {/* Status Filter - Takes 1/4 width */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Status</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {isAnyFilterApplied() && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setPartnerTypeFilter("All");
                      setStatusFilter("All");
                      setSearchTerm("")
                    }}
                    className="text-sm text-leafGreen hover:text-forestGreen font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-6">
        <PermissionWrapper section="Partner" action="toggle">
          {/* Pending Partners Notification */}
          <AnimatePresence>
            {showNotification && pendingPartnersData?.pagination?.totalCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-4 sm:mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 rounded-lg shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <motion.div
                      initial={{ rotate: 0 }}
                      animate={{ rotate: [0, 15, 0, 15, 0] }}
                      transition={{
                        repeat: Number.POSITIVE_INFINITY,
                        repeatDelay: 5,
                        duration: 0.8,
                      }}
                    >
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mr-2 sm:mr-3" />
                    </motion.div>
                    <div>
                      <h3 className="text-yellow-800 font-bold text-sm sm:text-base">
                        Pending Approvals
                      </h3>
                      <p className="text-yellow-700 text-xs sm:text-sm">
                        You have {pendingPartnersData?.pagination?.totalCount} partner
                        {pendingPartnersData?.pagination?.totalCount > 1 ? "s" : ""} waiting for
                        approval.
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1 sm:space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={openSidebar}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors duration-200 flex items-center text-xs sm:text-sm"
                    >
                      View <ChevronRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowNotification(false)}
                      className="p-1 sm:p-2 text-yellow-700 hover:text-yellow-900 transition-colors duration-200 rounded-full hover:bg-yellow-100"
                      aria-label="Dismiss"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </PermissionWrapper>

        {/* Mobile Card View */}
        <div className="lg:hidden">
          {filteredPartners.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center p-6 bg-white rounded-lg shadow-md"
            >
              <div className="flex flex-col items-center justify-center">
                <motion.div
                  initial={{ y: 10 }}
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    repeatDelay: 1,
                    duration: 1.5,
                  }}
                  className="p-4 bg-lightGreen rounded-full mb-4"
                >
                  <Search className="h-8 w-8 text-leafGreen" />
                </motion.div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  No partners found
                </h3>
                <p className="text-gray-600 text-sm">
                  No partners match your current search criteria.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filteredPartners.map((partner) => {
                const colorClasses = getPartnerTypeColor(partner.partner_type).split(" ");
                const gradientClasses = `bg-gradient-to-br ${colorClasses[0]} ${colorClasses[1]}`;
                const badgeClasses = `${colorClasses[2]} ${colorClasses[3]}`;
                return (
                  <motion.div
                    key={partner.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {partner.logo ? (
                            <img
                              src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${partner.logo || "/placeholder.png"}`}
                              alt={`${partner.name} logo`}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${gradientClasses}`}>
                              <span className="text-lg font-bold text-white">
                                {partner.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="grid">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {partner.name}
                          </h3>
                          <p className="text-xs text-gray-600 truncate">{partner.email}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${partner.status === "Approved"
                        ? "bg-green-100 text-green-800"
                        : partner.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                        }`}>
                        {partner.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 mr-1 text-gray-400" />
                        <span>{partner.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                        <span>{new Date(partner.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badgeClasses}`}>
                          {getPartnerTypeIcon(partner.partner_type)}
                          {partner.partner_type}
                        </span>
                        {partner.partner_type === "Organization" && partner.organization_type && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-lightGreen text-forestGreen">
                            {partner.organization_type}
                          </span>
                        )}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/admin/dashboard/partners/${slugify(partner.name)}`, {
                          state: { id: partner.id }
                        })}
                        className="text-forestGreen hover:text-leafGreen text-xs font-medium"
                      >
                        View Details
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          {filteredPartners.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center p-12 bg-white rounded-lg shadow-md"
            >
              <div className="flex flex-col items-center justify-center">
                <motion.div
                  initial={{ y: 10 }}
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    repeatDelay: 1,
                    duration: 1.5,
                  }}
                  className="p-5 bg-lightGreen rounded-full mb-5"
                >
                  <Search className="h-10 w-10 text-leafGreen" />
                </motion.div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  No partners found
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  No partners match your current search criteria. Try
                  adjusting your filters or search term.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-lightGreen border-b border-gray-200 sticky top-0 z-20">
                    <tr>
                      <th scope="col" className="px-3 xl:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Partner
                      </th>
                      <th scope="col" className="px-3 xl:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-3 xl:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      {/* Add Organization Type column for organization partners */}
                      <th scope="col" className="px-3 xl:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Org Type
                      </th>
                      <th scope="col" className="px-3 xl:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-3 xl:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Joined Date
                      </th>
                      <th scope="col" className="px-3 xl:px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPartners.map((partner) => {
                      const colorClasses = getPartnerTypeColor(partner.partner_type).split(" ");
                      const gradientClasses = `bg-gradient-to-br ${colorClasses[0]} ${colorClasses[1]}`;
                      const badgeClasses = `${colorClasses[2]} ${colorClasses[3]}`;
                      return (
                        <motion.tr
                          key={partner.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          whileHover={{ backgroundColor: "#f9fafb" }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-3 xl:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 hidden xl:inline">
                                {partner.logo ? (
                                  <img
                                    src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${partner.logo || "/placeholder.png"}`}
                                    alt={`${partner.name} logo`}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${gradientClasses}`}>
                                    <span className="text-lg font-bold text-white">
                                      {partner.name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="xl:ml-4 grid">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {partner.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 xl:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{partner.email}</div>
                            <div className="text-sm text-gray-500">{partner.phone}</div>
                          </td>
                          <td className="px-3 xl:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClasses}`}>
                              {getPartnerTypeIcon(partner.partner_type)}
                              {partner.partner_type}
                            </span>
                          </td>
                          {/* Show organization_type when partner_type is Organization */}
                          <td className="px-3 xl:px-6 py-4 whitespace-nowrap">
                            {partner.partner_type === "Organization" ?
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lightGreen text-forestGreen">
                                {partner.organization_type || "N/A"}
                              </span> :
                              <span className="text-gray-400">-</span>
                            }
                          </td>
                          <td className="px-3 xl:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${partner.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : partner.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                              }`}>
                              {partner.status}
                            </span>
                          </td>
                          <td className="px-3 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(partner.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-3 xl:px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => navigate(`/admin/dashboard/partners/${slugify(partner.name)}`, {
                                state: { id: partner.id }
                              })}
                              className="text-forestGreen hover:text-leafGreen"
                            >
                              View<span className="hidden xl:inline-flex ml-1">Details</span>
                            </motion.button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalCount > 10 && (
          <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-white">
            {/* Mobile Pagination */}
            <div className="lg:hidden">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 text-center">
                    Page {currentPage} of {pagination.totalPages}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Partners per page:</label>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setCurrentPage(1); // Reset to first page when limit changes
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    >
                      {limitOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <div className="text-xs text-gray-500 text-center">
                    Showing {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, pagination.totalCount)} of {pagination.totalCount}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    Next
                    <ChevronUp size={16} className="rotate-90" />
                  </button>
                </div>
              </div>
            </div>
            {/* Desktop Pagination */}
            <div className="hidden lg:flex lg:items-center lg:justify-between">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * limit + 1} to{" "}
                {Math.min(currentPage * limit, pagination.totalCount)} of{" "}
                {pagination.totalCount} results
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Partners per page:</label>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setCurrentPage(1); // Reset to first page when limit changes
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    {limitOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Previous
                </button>
                {[...Array(pagination.totalPages)].map((_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${currentPage === page
                        ? "bg-leafGreen text-white"
                        : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Right Sidebar for Pending Partners */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: sidebarOpen ? 0 : "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 overflow-hidden"
      >
        <div className="h-full flex flex-col">
          <div className="flex-shrink-0 p-4 border-b border-gray-200 flex items-center justify-between  from-lightGreen/5 to-lightGreen/10 bg-gradient-to-r">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-leafGreen" />
              Pending Partners
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={closeSidebar}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5 text-gray-600" />
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {selectedPendingPartner ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <div className="flex-1 overflow-y-auto">
                  <div className="bg-white">
                    <div className="p-4 border-b border-gray-200  from-lightGreen/5 to-lightGreen/10 bg-gradient-to-r">
                      <motion.button
                        whileHover={{ x: -3 }}
                        onClick={() => setSelectedPendingPartner(null)}
                        className="mb-4 py-1 px-3 text-sm flex items-center text-gray-600 hover:text-gray-800 rounded-md hover:bg-lightGreen/20"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back to list
                      </motion.button>
                      <div className="flex justify-center py-4">
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {selectedPendingPartner.logo ? (
                            <img
                              src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${selectedPendingPartner.logo || "/placeholder.png"
                                }`}
                              alt={`${selectedPendingPartner.name} logo`}
                              className="h-32 w-32 object-contain rounded-full"
                            />
                          ) : (
                            <div
                              className={`h-32 w-32 bg-gradient-to-br ${getPartnerTypeColor(
                                selectedPendingPartner.partner_type
                              ).split(" ")[0]
                                } ${getPartnerTypeColor(
                                  selectedPendingPartner.partner_type
                                ).split(" ")[1]
                                } rounded-full flex items-center justify-center`}
                            >
                              <span className="text-4xl font-bold text-white">
                                {selectedPendingPartner.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      </div>
                      <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl font-bold text-center mt-2 px-2"
                      >
                        {selectedPendingPartner.name}
                      </motion.h3>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex justify-center mt-2"
                      >
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full ${getPartnerTypeColor(
                            selectedPendingPartner.partner_type
                          ).split(" ")[2]
                            } ${getPartnerTypeColor(
                              selectedPendingPartner.partner_type
                            ).split(" ")[3]
                            } text-sm font-medium`}
                        >
                          {getPartnerTypeIcon(
                            selectedPendingPartner.partner_type
                          )}
                          {selectedPendingPartner.partner_type}
                        </span>
                      </motion.div>

                      {/* Show organization type if partner type is Organization */}
                      {selectedPendingPartner.partner_type === "Organization" && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 }}
                          className="flex justify-center mt-2"
                        >
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full bg-lightGreen text-forestGreen text-sm font-medium"
                          >
                            Organization Type: {selectedPendingPartner.organization_type || "Not specified"}
                          </span>
                        </motion.div>
                      )}
                    </div>
                    <div className="p-4 space-y-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <h4 className="text-sm font-medium text-gray-500 flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          Contact Information
                        </h4>
                        <div className="mt-2 space-y-2 pl-6">
                          <p className="text-sm break-words">
                            <span className="font-medium">Email:</span>{" "}
                            {selectedPendingPartner.email}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Phone:</span>{" "}
                            {selectedPendingPartner.phone}
                          </p>
                          {selectedPendingPartner.website && (
                            <p className="text-sm break-words">
                              <span className="font-medium">Website:</span>
                              <a
                                href={selectedPendingPartner.website}
                                className="text-leafGreen hover:underline ml-1"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {selectedPendingPartner.website}
                              </a>
                            </p>
                          )}
                        </div>
                      </motion.div>

                      {selectedPendingPartner.business_registration_number && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <h4 className="text-sm font-medium text-gray-500 flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-gray-400" />
                            Business Details
                          </h4>
                          <div className="mt-2 pl-6">
                            <p className="text-sm">
                              <span className="font-medium">
                                Registration Number:
                              </span>{" "}
                              {
                                selectedPendingPartner.business_registration_number
                              }
                            </p>
                          </div>
                        </motion.div>
                      )}

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <h4 className="text-sm font-medium text-gray-500 flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-gray-400" />
                          Description
                        </h4>
                        <div className="mt-2 pl-6">
                          <p className="text-sm text-gray-700 break-words">
                            {selectedPendingPartner.description ||
                              "No description provided."}
                          </p>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <h4 className="text-sm font-medium text-gray-500 flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          User Account
                        </h4>
                        <div className="mt-2 space-y-2 pl-6">
                          <p className="text-sm break-words">
                            <span className="font-medium">Username:</span>{" "}
                            {selectedPendingPartner.user.username}
                          </p>
                          <p className="text-sm break-words">
                            <span className="font-medium">User Email:</span>{" "}
                            {selectedPendingPartner.user.email}
                          </p>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        <h4 className="text-sm font-medium text-gray-500 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          Application Details
                        </h4>
                        <div className="mt-2 space-y-2 pl-6">
                          <p className="text-sm">
                            <span className="font-medium">Applied On:</span>{" "}
                            {new Date(
                              selectedPendingPartner.created_at
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Status:</span>
                            <span className="ml-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              {selectedPendingPartner.status}
                            </span>
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex-shrink-0 p-4 border-t border-gray-200 flex space-x-3"
                >
                  <motion.button
                    whileHover={{ scale: isApproving ? 1 : 1.05 }}
                    whileTap={{ scale: isApproving ? 1 : 0.95 }}
                    onClick={() => handleApprovePartner(selectedPendingPartner.id)}
                    disabled={isApproving || isRejecting}
                    className={`flex-1 py-2 bg-leafGreen text-white rounded-md   transition-colors duration-200 flex items-center justify-center ${isApproving ? "opacity-75 cursor-not-allowed" : ""
                      }`}
                  >
                    {isApproving ? (
                      <div className="flex items-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <>
                        <Check className="mr-1 h-4 w-4" /> Approve
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: isRejecting ? 1 : 1.05 }}
                    whileTap={{ scale: isRejecting ? 1 : 0.95 }}
                    onClick={() => handleRejectPartner(selectedPendingPartner.id)}
                    disabled={isApproving || isRejecting}
                    className={`flex-1 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 flex items-center justify-center ${isRejecting ? "opacity-75 cursor-not-allowed" : ""
                      }`}
                  >
                    {isRejecting ? (
                      <div className="flex items-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <>
                        <X className="mr-1 h-4 w-4" /> Reject
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto"
              >
                {pendingPartners.length === 0 ? (
                  <div className="p-6 text-center flex flex-col items-center justify-center h-full">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="bg-lightGreen/20 p-4 rounded-full mb-4"
                    >
                      <Check className="h-8 w-8 text-leafGreen" />
                    </motion.div>
                    <h3 className="text-lg font-medium text-gray-800">
                      No pending partners
                    </h3>
                    <p className="text-gray-600 mt-1">
                      All partner applications have been processed.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {pendingPartners.map((partner, index) => {
                      const colorClasses = getPartnerTypeColor(
                        partner.partner_type
                      ).split(" ");
                      const gradientClasses = `bg-gradient-to-br ${colorClasses[0]} ${colorClasses[1]}`;
                      const badgeClasses = `${colorClasses[2]} ${colorClasses[3]}`;
                      return (
                        <motion.li
                          key={partner.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-lightGreen/5 transition-colors duration-200"
                        >
                          <motion.button
                            whileHover={{ x: 5 }}
                            onClick={() => viewPendingPartner(partner)}
                            className="w-full text-left p-4 focus:outline-none"
                          >
                            <div className="flex items-center">
                              {partner.logo ? (
                                <img
                                  src={`${import.meta.env.VITE_BACKEND_MEDIA_URL
                                    }${partner.logo || "/placeholder.png"}`}
                                  alt={`${partner.name} logo`}
                                  className="h-12 w-12 object-cover rounded-full mr-4 flex-shrink-0"
                                />
                              ) : (
                                <div
                                  className={`h-12 w-12 rounded-full flex items-center justify-center ${gradientClasses} mr-4 flex-shrink-0`}
                                >
                                  <span className="text-lg font-bold text-white">
                                    {partner.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                  {partner.name}
                                </h4>
                                <p className="text-sm text-gray-500 truncate">
                                  {partner.email}
                                </p>
                                <div className="flex items-center mt-1 flex-wrap gap-1">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeClasses} flex-shrink-0`}
                                  >
                                    {getPartnerTypeIcon(partner.partner_type)}
                                    {partner.partner_type}
                                  </span>
                                  {partner.partner_type === "Organization" &&
                                    partner.organization_type && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-lightGreen text-forestGreen flex-shrink-0">
                                        {partner.organization_type}
                                      </span>
                                    )}
                                  <span className="text-xs text-gray-500 ml-1 flex-shrink-0">
                                    {new Date(
                                      partner.created_at
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            </div>
                          </motion.button>
                        </motion.li>
                      );
                    })}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}