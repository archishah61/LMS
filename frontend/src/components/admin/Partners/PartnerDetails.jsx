/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import AdminLoader from "../AdminLoader";
import {
  useGetPartnerByIdQuery,
  useUpdatePartnerStatusMutation,
} from "../../../services/Become_partner/becomePartnerApi";
import {
  X,
  Check,
  User,
  Building,
  Globe,
  Mail,
  Phone,
  Calendar,
  FileText,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PermissionWrapper from "../../../context/PermissionWrapper";

export default function PartnerDetails() {
  const { id } = useLocation().state;
  const navigate = useNavigate();
  const { access_token } = useSelector((state) => state.auth);
  const {
    data: partner,
    isLoading,
    isError,
    refetch,
  } = useGetPartnerByIdQuery({ id, access_token });
  const [updatePartnerStatus] = useUpdatePartnerStatusMutation();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setIsUpdatingStatus(true);
    try {
      await updatePartnerStatus({
        partnerId: id,
        status: newStatus,
        access_token,
      }).unwrap();
      toast.success(`Partner status updated to ${newStatus}`);
      refetch();
    } catch (error) {
      toast.error("Failed to update partner status");
      console.error("Status update error:", error);
    } finally {
      setIsUpdatingStatus(false);
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

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <AdminLoader message="Loading partner details..." />;
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 bg-red-50 rounded-lg">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
          <h3 className="text-lg font-medium text-red-800 mt-2">
            Error loading partner details
          </h3>
          <p className="text-red-600 mt-1">
            Failed to fetch partner information. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 bg-yellow-50 rounded-lg">
          <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto" />
          <h3 className="text-lg font-medium text-yellow-800 mt-2">
            Partner not found
          </h3>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <PermissionWrapper section="Partner" action="view">
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        {/* Back Button - Improved mobile spacing */}
        <div className="mb-4 md:mb-6 flex justify-end md:justify-start">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-forestGreen hover:text-forestGreen text-sm md:text-base"
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 mr-1" />
            Back to Partners
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header Section - Improved mobile layout */}
          <div className=" bg-lightGreen p-4 md:p-6 relative overflow-hidden">
            <div className="flex flex-col items-center text-center md:flex-row md:text-left md:items-start">
              <div className="mb-3 md:mb-0 md:mr-6">
                {partner.logo ? (
                  <img
                    src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${partner.logo || "/placeholder.png"}`}
                    alt={`${partner.name} logo`}
                    className="h-24 w-24 md:h-32 md:w-32 object-contain rounded-lg mx-auto md:mx-0"
                  />
                ) : (
                  <div className="h-24 w-24 md:h-32 md:w-32 bg-gradient-to-br bg-leafGreen rounded-lg flex items-center justify-center mx-auto md:mx-0">
                    <span className="text-2xl md:text-4xl font-bold uppercase text-white">
                      {partner.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 w-full">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div className="w-full">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 break-words">
                      {partner.name}
                    </h1>
                    <div className="flex flex-col sm:flex-row items-center mt-2 space-y-2 sm:space-y-0 sm:space-x-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium ${partner.partner_type === "Individual"
                          ? "bg-lightGreen text-forestGreen"
                          : "bg-lightGreen text-forestGreen"
                          } w-fit`}
                      >
                        {getPartnerTypeIcon(partner.partner_type)}
                        {partner.partner_type}
                      </span>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium ${getStatusColor(
                          partner.status
                        )} w-fit`}
                      >
                        {isUpdatingStatus ? (
                          <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-t-2 border-b-2 border-gray-500 mr-1"></div>
                        ) : (
                          <select
                            value={partner.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="bg-transparent border-none focus:outline-none text-xs md:text-sm"
                          >
                            <option value="Pending" disabled={partner.status === "Pending"}>Pending</option>
                            <option value="Approved" disabled={partner.status === "Approved"}>Approve</option>
                            <option value="Rejected" disabled={partner.status === "Rejected"}>Reject</option>
                          </select>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Single column on mobile */}
          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Contact Information */}
            <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
              <h2 className="text-base md:text-lg font-semibold mb-3 flex items-center">
                <Mail className="h-4 w-4 md:h-5 md:w-5 text-gray-500 mr-2" />
                Contact Information
              </h2>
              <div className="space-y-2 text-sm md:text-base">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-500">
                    Email
                  </label>
                  <p className="text-gray-900 break-all">{partner.email}</p>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-500">
                    Phone
                  </label>
                  <p className="text-gray-900">{partner.phone}</p>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-500">
                    Website
                  </label>
                  {partner.website ? (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-forestGreen hover:underline break-all"
                    >
                      {partner.website}
                    </a>
                  ) : (
                    <p className="text-gray-500 text-sm">Not provided</p>
                  )}
                </div>
              </div>
            </div>

            {/* Organization Details - Only show if organization */}
            {partner.partner_type === "Organization" && (
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                <h2 className="text-base md:text-lg font-semibold mb-3 flex items-center">
                  <Building className="h-4 w-4 md:h-5 md:w-5 text-gray-500 mr-2" />
                  Organization Details
                </h2>
                <div className="space-y-2 text-sm md:text-base">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-500">
                      Organization Type
                    </label>
                    <p className="text-gray-900">
                      {partner.organization_type || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-500">
                      Contact Person
                    </label>
                    <p className="text-gray-900">
                      {partner.contact_person_name || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-500">
                      Contact Person Email
                    </label>
                    <p className="text-gray-900 break-all">
                      {partner.contact_person_email || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-500">
                      Contact Person Phone
                    </label>
                    <p className="text-gray-900">
                      {partner.contact_person_phone || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
              <h2 className="text-base md:text-lg font-semibold mb-3 flex items-center">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-gray-500 mr-2" />
                Description
              </h2>
              <p className="text-gray-700 whitespace-pre-line text-sm md:text-base">
                {partner.description || "No description provided"}
              </p>
            </div>

            {/* User Account */}
            <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
              <h2 className="text-base md:text-lg font-semibold mb-3 flex items-center">
                <User className="h-4 w-4 md:h-5 md:w-5 text-gray-500 mr-2" />
                User Account
              </h2>
              <div className="space-y-2 text-sm md:text-base">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-500">
                    Username
                  </label>
                  <p className="text-gray-900">
                    {partner.user?.username || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-500">
                    Email
                  </label>
                  <p className="text-gray-900 break-all">
                    {partner.user?.email || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Application Details */}
            <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
              <h2 className="text-base md:text-lg font-semibold mb-3 flex items-center">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 text-gray-500 mr-2" />
                Application Details
              </h2>
              <div className="space-y-2 text-sm md:text-base">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-500">
                    Applied On
                  </label>
                  <p className="text-gray-900">
                    {new Date(partner.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-500">
                    Last Updated
                  </label>
                  <p className="text-gray-900">
                    {new Date(partner.updated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionWrapper>
  );
}