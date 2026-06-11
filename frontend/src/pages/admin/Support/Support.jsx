import { useState, useEffect, useRef } from "react";
import {
  LifeBuoy,
  Search,
  Filter,
  ChevronDown,
  RefreshCw,
  ChevronLeft,
  Send,
  Clock,
  User,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  Paperclip,
  X,
  Download,
  MessageSquare,
  AlertTriangle,
  ArrowLeft,
  ChevronUp
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetAllSupportTicketsQuery,
  useGetSupportTicketByIdQuery,
  useCreateSupportReplyMutation,
  useUpdateSupportTicketMutation,
  useDeleteSupportTicketMutation,
} from "../../../services/Support/supportAPI";
import AdminLoader from "../../../components/admin/AdminLoader";
import PermissionWrapper from "../../../context/PermissionWrapper";

import { useGetUserByIdQuery } from "../../../services/userAuthApi";

import { getAdminToken } from "../../../services/CookieService";
import { useNavigate } from "react-router-dom";

const AdminSupportPage = () => {
  const { access_token } = getAdminToken();

  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [ticketsView, setTicketsView] = useState("all"); // "all" or "detail"
  const [attachments, setAttachments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const limitOptions = [10, 20, 50, 100, 500];
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: () => { },
    isLoading: false,
  });
  const fileInputRef = useRef(null);

  const {
    data: tickets = [],
    isLoading,
    refetch: refetchTickets,
  } = useGetAllSupportTicketsQuery({ search_term: searchTerm, limit: limit, offset: limit !== "all" ? limit * (currentPage - 1) : 0, status: statusFilter, category: categoryFilter, access_token });

  // ------------------------------------------------------------------------------------------------

  // add Course Datials in it

  // ------------------------------------------------------------------------------------------------

  const {
    data: ticketDetails,
    isLoading: isLoadingDetails,
    refetch: refetchTicketDetails,
  } = useGetSupportTicketByIdQuery(
    { id: selectedTicket, access_token },
    { skip: !selectedTicket }
  );

  const [createReply] = useCreateSupportReplyMutation();
  const [updateTicket] = useUpdateSupportTicketMutation();
  const [deleteTicket] = useDeleteSupportTicketMutation();

  const adminToken = getAdminToken();
  const adminId = 1; // Replace with actual admin ID from your auth system

  // Refetch data when the component mounts
  useEffect(() => {
    refetchTickets();
  }, [refetchTickets]);

  // Filter tickets based on search term and filters
  const filteredTickets = tickets?.tickets?.filter((ticket) => {
    const matchesSearch =
      ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter ? ticket.status === statusFilter : true;
    const matchesCategory = categoryFilter
      ? ticket.category === categoryFilter
      : true;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const pagination = tickets?.pagination || { totalPages: 1, totalCount: 1 };

  // Handle ticket selection
  const handleTicketClick = (ticketId) => {
    setSelectedTicket(ticketId);
    setTicketsView("detail");
    refetchTicketDetails();
  };

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  // Handle file input change
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);

    const validFiles = newFiles.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds 5 MB limit`);
        return false;
      }
      return true;
    });

    // Update attachments with file previews
    const updatedAttachments = validFiles.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
    }));

    setAttachments([...attachments, ...updatedAttachments]);
  };

  // Handle file removal
  const handleRemoveFile = (indexToRemove) => {
    const updatedAttachments = attachments.filter(
      (_, index) => index !== indexToRemove
    );
    setAttachments(updatedAttachments);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  };

  // Handle reply submission with attachments
  const handleReplySubmit = async (e) => {
    e.preventDefault();

    if (!replyMessage.trim() && attachments.length === 0) {
      toast.error("Please enter a message or attach a file");
      return;
    }

    setIsReplying(true);

    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append("ticket_id", selectedTicket);
      formData.append("admin_id", adminId);
      formData.append("message", replyMessage);

      // Append each file to FormData
      attachments.forEach((attachment) => {
        formData.append("supportFile", attachment.file);
      });

      // Custom createReply with FormData
      // Note: RTK Query may need adjustments for FormData
      await createReply({ data: formData, access_token }).unwrap();

      toast.success("Reply sent successfully!");
      setReplyMessage("");
      setAttachments([]);
      refetchTicketDetails();
    } catch (error) {
      console.error("Failed to send reply:", error);
      toast.error(error?.data?.error || "Failed to send reply. Please try again.");
    } finally {
      setIsReplying(false);
    }
  };

  // Handle status update with confirmation
  const handleStatusUpdate = (newStatus) => {
    if (!ticketDetails.ticket) return

    const statusLabels = {
      OPEN: "Open",
      IN_PROGRESS: "In Progress",
      RESOLVED: "Resolved",
      CLOSED: "Closed",
    }

    const getStatusModalConfig = (status) => {
      switch (status) {
        case "CLOSED":
          return {
            type: "closed",
            title: "Close Ticket Permanently",
            message:
              "Are you sure you want to close this ticket? Once closed, the ticket will be permanently archived and the user will not be able to send any more replies. This action should only be taken when the issue is completely resolved and no further communication is needed.",
            confirmText: "Close Permanently",
          }
        case "RESOLVED":
          return {
            type: "success",
            title: "Mark as Resolved",
            message:
              "Are you sure you want to mark this ticket as resolved? This indicates that the issue has been successfully addressed. The user will still be able to reply if they need further assistance.",
            confirmText: "Mark Resolved",
          }
        case "IN_PROGRESS":
          return {
            type: "warning",
            title: "Set to In Progress",
            message:
              "Are you sure you want to change the status to 'In Progress'? This indicates that you are actively working on resolving this issue.",
            confirmText: "Set In Progress",
          }
        case "OPEN":
          return {
            type: "info",
            title: "Reopen Ticket",
            message:
              "Are you sure you want to reopen this ticket? This will change the status back to 'Open' and indicate that the issue still needs attention.",
            confirmText: "Reopen Ticket",
          }
        default:
          return {
            type: "info",
            title: "Update Ticket Status",
            message: `Are you sure you want to change the status to "${statusLabels[newStatus]}"?`,
            confirmText: "Update Status",
          }
      }
    }

    const modalConfig = getStatusModalConfig(newStatus)

    setConfirmModal({
      isOpen: true,
      type: modalConfig.type,
      title: modalConfig.title,
      message: modalConfig.message,
      confirmText: modalConfig.confirmText,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }))
        try {
          await updateTicket({
            id: ticketDetails.ticket.id,
            status: newStatus,
            access_token
          }).unwrap()
          toast.success(`Ticket status updated to ${statusLabels[newStatus]}`)
          refetchTicketDetails()
          refetchTickets()
          setConfirmModal({ ...confirmModal, isOpen: false, isLoading: false })
        } catch (error) {
          console.error("Failed to update status:", error)
          toast.error(error?.data?.error || "Failed to update ticket status")
          setConfirmModal((prev) => ({ ...prev, isLoading: false }))
        }
      },
      isLoading: false,
    })
  }

  // Handle ticket deletion with confirmation
  const handleDeleteTicket = () => {
    if (!ticketDetails.ticket) return

    setConfirmModal({
      isOpen: true,
      type: "danger",
      title: "Delete Ticket",
      message:
        "Are you sure you want to delete this ticket? This action cannot be undone and all associated replies and attachments will be permanently removed.",
      confirmText: "Delete Ticket",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }))
        try {
          await deleteTicket({
            id: ticketDetails?.ticket?.id,
            access_token
          }).unwrap()
          toast.success("Ticket deleted successfully")
          setTicketsView("all")
          setSelectedTicket(null)
          refetchTickets()
          setConfirmModal({ ...confirmModal, isOpen: false, isLoading: false })
        } catch (error) {
          console.error("Failed to delete ticket:", error)
          toast.error(error?.data?.error || "Failed to delete ticket")
          setConfirmModal((prev) => ({ ...prev, isLoading: false }))
        }
      },
      isLoading: false,
    })
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "OPEN":
        return <AlertCircle className="w-4 h-4" />;
      case "IN_PROGRESS":
        return <Loader className="w-4 h-4" />;
      case "RESOLVED":
        return <CheckCircle className="w-4 h-4" />;
      case "CLOSED":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Get file icon based on file type
  const getFileIcon = (attachment) => {
    if (attachment.file_type.startsWith("image/")) {
      return (
        <img
          src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${attachment.file_url || "/placeholder.png"
            }`}
          alt="File preview"
          className="w-8 h-8 object-cover rounded border border-gray-200"
        />
      );
    }
    return <MessageSquare className="w-5 h-5 text-gray-500" />;
  };

  function downloadFile(url) {
    const link = document.createElement("a");

    // Extract filename from URL if possible
    const urlParts = url.split("/");
    const filename = urlParts[urlParts.length - 1].split("?")[0]; // removes query params if any

    link.href = url;
    link.setAttribute("download", filename);
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            {/* Title Section - Centered on mobile, left on desktop */}
            <div className="flex items-center justify-between md:justify-start md:flex-1 mb-2 md:mb-0">
              {/* Empty space for mobile balance */}
              <div className="w-6 md:hidden"></div>

              {/* Centered Title for mobile */}
              <div className="text-center md:text-left flex-1 md:flex-none">
                <h1 className="text-xl md:text-2xl font-bold bg-forestGreen bg-clip-text text-transparent">
                  Support Tickets <span className='hidden sm:inline'>Management</span>
                </h1>
                <p className="text-gray-600 mt-1">Manage user support tickets</p>
              </div>

              {/* <button
                onClick={() => refetchTickets()}
                className="md:hidden bg-leafGreen hover:bg-leafGreen/90 text-white p-2 rounded-lg flex items-center gap-2 transition-all duration-300 font-medium shadow-sm"
              >
                <RefreshCw size={18} />
              </button> */}
              {/* Back Button - Right side on mobile */}
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="flex border items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
              >
                <ArrowLeft size={18} />
              </button>
            </div>

            {/* Filter Button - Below title on mobile, inline on desktop */}
            <div className="flex justify-center md:justify-start mb-3 md:mb-0 md:hidden">
              {ticketsView === "all" && (
                <button
                  onClick={() => setShowAllFilters(!showAllFilters)}
                  className="flex items-center gap-1 lg:gap-2 px-20 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                >
                  <Filter size={18} />
                  <span className="font-medium">Filters</span>
                  {showAllFilters ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              )}
            </div>

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center gap-2 lg:gap-4">
              {ticketsView === "all" && (
                <button
                  onClick={() => setShowAllFilters(!showAllFilters)}
                  className="flex items-center gap-1 lg:gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                >
                  <Filter size={18} />
                  <span className="font-medium">Filters</span>
                  {showAllFilters ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              )}

              {/* <button
                onClick={() => refetchTickets()}
                className="bg-leafGreen hover:bg-leafGreen/90 text-white px-4 lg:px-6 py-2 rounded-lg flex items-center gap-1 transition-all duration-300 font-medium shadow-sm"
              >
                <RefreshCw size={18} />
                Refresh<span className="hidden lg:inline-flex"> Tickets</span>
              </button> */}
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="flex border items-center gap-1 lg:gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={18} />
                <span>Back</span>
              </button>
            </div>
          </div>

          {/* Filters and Search */}
          {ticketsView === "all" && (
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${showAllFilters ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"}`}
            >
              <div className="bg-lightGreen/10 rounded-lg border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Tickets
                    </label>
                    <div className="relative">
                      <Search className="absolute top-3 left-3 text-gray-400" size={16} />
                      <input
                        type="search"
                        placeholder="Search by title, description"
                        className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="relative">
                      <select
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen appearance-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="">All Statuses</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen appearance-none"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                      >
                        <option value="">All Categories</option>
                        <option value="Technical">Technical</option>
                        <option value="Content">Content</option>
                        <option value="Billing">Billing</option>
                        <option value="Access">Access</option>
                        <option value="Achievement">Achievement</option>
                        <option value="Communication">Communication</option>
                        <option value="Other">Other</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
                {(searchTerm || statusFilter || categoryFilter) && (
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("");
                        setCategoryFilter("");
                      }}
                      className="text-sm text-leafGreen hover:text-forestGreen font-medium"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="w-full p-4 sm:p-6">
          {ticketsView === "all" ? (
            <>
              {/* Tickets Table */}
              <div className="md:bg-white rounded-lg md:border border-gray-200 overflow-hidden">
                {isLoading ? (
                  <AdminLoader message="Loading support tickets..." />
                ) : filteredTickets?.length > 0 ? (
                  <div>
                    {/* Table for medium screens and up */}
                    <div className="hidden md:block">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-lightGreen border-b border-gray-200 sticky top-0 z-20">
                            <tr>
                              <th
                                scope="col"
                                className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                              >
                                Ticket
                              </th>
                              <th
                                scope="col"
                                className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                              >
                                Student
                              </th>
                              <th
                                scope="col"
                                className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                              >
                                Content
                              </th>
                              <th
                                scope="col"
                                className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                              >
                                Category
                              </th>
                              <th
                                scope="col"
                                className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                              >
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTickets.map((ticket) => (
                              <tr
                                key={ticket.id}
                                className="hover:bg-lightGreen/20 cursor-pointer transition-colors"
                                onClick={() => handleTicketClick(ticket.id)}
                              >
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900 max-w-[360px] break-words whitespace-normal">
                                        {ticket.title}
                                      </div>
                                      <div className="text-sm text-gray-500 truncate max-w-md">
                                        {formatDate(ticket.created_at)}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <User className="h-4 w-4 text-gray-400 mr-2" />
                                    <span className="text-sm text-gray-900">
                                      {ticket?.User?.full_name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                  {ticket.related_id || ticket.related_type == "partner" ? (
                                    <div className="flex items-center">
                                      <div>
                                        <div className="truncate max-w-[216px]" title={ticket?.RelatedDetails?.title}>
                                          {ticket?.RelatedDetails?.title}
                                        </div>
                                        <div className="text-sm text-gray-500 truncate max-w-md">
                                          {ticket?.related_type
                                            ? ticket.related_type.charAt(0).toUpperCase() + ticket.related_type.slice(1)
                                            : ""}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-500">N/A</span>
                                  )}
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm text-gray-900">
                                    {ticket.category}
                                  </span>
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                      ticket.status
                                    )}`}
                                  >
                                    {getStatusIcon(ticket.status)}
                                    <span className="ml-1">
                                      {ticket.status.replace("_", " ")}
                                    </span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Card layout for small screens */}
                    <div className="block md:hidden space-y-4">
                      {filteredTickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="bg-white rounded-lg border border-gray-200 transition-shadow cursor-pointer p-4"
                          onClick={() => handleTicketClick(ticket.id)}
                        >
                          {/* First Row: Ticket Title */}
                          <div className="mb-3 grid grid-cols-1">
                            <h3 className="text-sm font-medium text-gray-900 break-words truncate">
                              {ticket.title}
                            </h3>
                          </div>

                          {/* Second Row: Student Name */}
                          <div className="flex items-center mb-3">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-700">
                              {ticket?.User?.full_name || "N/A"}
                            </span>
                          </div>

                          {/* Third Row: Content and Category */}
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <div className="text-xs text-gray-500 font-medium mb-1">Content</div>
                              <div className="text-sm text-gray-900 truncate">
                                {ticket.related_id ? (
                                  ticket?.RelatedDetails?.title || "N/A"
                                ) : (
                                  <span className="text-gray-500">N/A</span>
                                )}
                              </div>
                              {ticket.related_type && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {ticket.related_type.charAt(0).toUpperCase() + ticket.related_type.slice(1)}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 font-medium mb-1">Category</div>
                              <div className="text-sm text-gray-900">
                                {ticket.category}
                              </div>
                            </div>
                          </div>

                          {/* Fourth Row: Date and Status */}
                          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            <div className="text-sm text-gray-500">
                              {formatDate(ticket.created_at)}
                            </div>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                ticket.status
                              )}`}
                            >
                              {getStatusIcon(ticket.status)}
                              <span className="ml-1">
                                {ticket.status.replace("_", " ")}
                              </span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalCount > 10 && (
                      <div className="px-4 py-4 sm:px-6 border-t border-gray-200">
                        {/* Mobile Pagination */}
                        <div className="md:hidden">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-600 text-center">
                                Page {currentPage} of {pagination.totalPages}
                              </div>
                              <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-gray-700">Tickets per page:</label>
                                <select
                                  value={limit}
                                  onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setCurrentPage(1); // Reset to first page when limit changes
                                  }}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <div className="hidden md:flex md:items-center md:justify-between">
                          <div className="text-sm text-gray-700">
                            Showing {(currentPage - 1) * limit + 1} to{" "}
                            {Math.min(currentPage * limit, pagination.totalCount)} of{" "}
                            {pagination.totalCount} results
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center gap-3">
                              <label className="text-sm font-medium text-gray-700">Tickets per page:</label>
                              <select
                                value={limit}
                                onChange={(e) => {
                                  setLimit(Number(e.target.value));
                                  setCurrentPage(1); // Reset to first page when limit changes
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen"
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
                                    : "text-gray-500 bg-white border border-gray-300 hover:bg-lightGreen/20"
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
                ) : (
                  <div className="text-center py-16">
                    <LifeBuoy className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No tickets found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No support tickets match your current filters.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Ticket Detail View */
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="px-4 pt-4 pb-1 sm:p-6">
                <button
                  onClick={() => {
                    setTicketsView("all");
                    setSelectedTicket(null);
                  }}
                  className="hidden sm:inline-flex mb-4 sm:mb-6 items-center text-sm font-medium text-leafGreen hover:text-forestGreen"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back to all tickets
                </button>
                {/* Ticket Header */}

                {ticketDetails?.ticket && (
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between border-b border-gray-200 pb-6 mb-6">
                    <div className="flex-1">

                      <div className="grid grid-cols-12 sm:grid-cols-1">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 col-span-10 sm:col-span-1 truncate">
                          {ticketDetails?.ticket?.title}
                        </h2>

                        <button
                          onClick={() => {
                            setTicketsView("all");
                            setSelectedTicket(null);
                          }}
                          className="sm:hidden col-span-2 inline-flex items-center text-sm font-medium text-leafGreen hover:text-forestGreen"
                        >
                          <ChevronLeft className="mr-1 h-4 w-4" />
                          Back
                        </button>
                      </div>

                      <div className="mt-2 text-sm text-gray-500 space-y-2">
                        {/* First row: Course + Related Type */}
                        <div className="flex flex-wrap gap-4">
                          {ticketDetails?.ticket?.related_id && (
                            <div className="flex flex-col sm:gap-2">
                              {/* Main Related Item */}
                              <div className="grid grid-cols-1 sm:flex sm:items-center">
                                <span className="truncate">
                                  <span><BookOpen className="inline-flex mr-1 h-4 w-4" /></span>
                                  <span className="capitalize font-medium">
                                    {ticketDetails.ticket?.related_type}
                                  </span>
                                  :{" "}
                                  <span>{ticketDetails.ticket?.RelatedDetails?.title}</span>
                                </span>
                              </div>

                              {/* If it's quiz/assignment/topic, show hierarchy */}
                              {["quiz", "assignment", "topic"].includes(
                                ticketDetails.ticket?.related_type
                              ) && (
                                  <div className="ml-6 text-sm text-gray-700 space-y-1">
                                    <div>
                                      <span className="font-medium">Course:</span>{" "}
                                      {ticketDetails.ticket?.RelatedDetails?.course_title}
                                    </div>
                                    <div>
                                      <span className="font-medium">Session:</span>{" "}
                                      {ticketDetails.ticket?.RelatedDetails?.session_title}
                                    </div>
                                    <div>
                                      <span className="font-medium">Module:</span>{" "}
                                      {ticketDetails.ticket?.RelatedDetails?.module_title}
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}
                        </div>

                        {/* Second row: Student + Category + Created */}
                        <div className="flex flex-wrap gap-2 sm:gap-4">
                          <div className="flex items-center">
                            <User className="mr-1 h-4 w-4" />
                            <span>
                              <span className="font-medium">Student: </span>{ticketDetails.ticket?.User?.full_name}
                            </span>
                          </div>

                          <div className="flex items-center">
                            <span>
                              <span className="font-medium">Category: </span><span>{ticketDetails.ticket?.category}</span>
                            </span>
                          </div>

                          <div className="flex items-center">
                            <Clock className="mr-1 h-4 w-4" />
                            <span>
                              <span className="font-medium">Created:{" "}</span>
                              <span>{formatDate(ticketDetails.ticket?.created_at)}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 lg:mt-0 flex justify-between items-center sm:flex-wrap gap-2">
                      <PermissionWrapper section="Support" action="edit">
                        <select
                          className="w-full sm:w-auto px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen"
                          value={ticketDetails.ticket?.status}
                          onChange={(e) => handleStatusUpdate(e.target.value)}
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </PermissionWrapper>
                      <PermissionWrapper section="Support" action="delete">
                        <button
                          onClick={handleDeleteTicket}
                          className="w-full sm:w-auto px-3 py-2 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
                        >
                          Delete Ticket
                        </button>
                      </PermissionWrapper>
                    </div>
                  </div>
                )}

                {isLoadingDetails ? (
                  <AdminLoader message="Loading Ticket Details..." />
                ) : ticketDetails?.ticket ? (
                <div className="relative">
                  {/* Mobile Chat View (sm and below) */}
                  <div className="block sm:hidden">
                    <div className="space-y-4 pb-4">
                      {/* Ticket creation message */}
                      <div className="flex justify-start">
                        <div className="max-w-[85%] bg-lightGreen/10 p-3 rounded-lg shadow border border-lightGreen/30">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-semibold text-gray-800 text-sm">Ticket Created</h3>
                            <span className="text-xs text-gray-500 ml-2">
                              {formatDate(ticketDetails.ticket?.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-900 whitespace-pre-wrap text-sm font-medium">
                            {ticketDetails.ticket?.title}
                          </p>
                          <p className="text-gray-700 whitespace-pre-wrap text-sm mt-1">
                            {ticketDetails.ticket?.description}
                          </p>

                          {/* Ticket attachments */}
                          {ticketDetails.ticket?.SupportAttachments?.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <h4 className="text-xs font-medium text-gray-700 mb-1">
                                Attachments:
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                {ticketDetails.ticket.SupportAttachments.map(
                                  (attachment, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center bg-gray-50 border border-gray-200 rounded-md p-1 text-xs"
                                    >
                                      {getFileIcon(attachment)}
                                      <div className="ml-1 grid grid-cols-1">
                                        <div className="font-medium text-gray-700 truncate max-w-[120px]">
                                          {attachment.file_url.split("/").pop()}
                                        </div>
                                        <a
                                          onClick={() => downloadFile(`${import.meta.env.VITE_BACKEND_MEDIA_URL}${attachment.file_url}`)}
                                          className="text-leafGreen hover:text-forestGreen flex items-center cursor-pointer"
                                        >
                                          <Download className="h-3 w-3 mr-1" />
                                          Download
                                        </a>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Process and group timeline items for mobile */}
                      {(() => {
                        const allReplies = ticketDetails.ticket?.SupportReplies || [];
                        const allResolutionLogs = ticketDetails.ticket?.SupportResolutionLog || [];

                        const timelineItems = [
                          ...allReplies.map((reply) => ({
                            type: "reply",
                            isAdmin: reply.user_id ? false : true,
                            timestamp: reply.created_at,
                            data: reply,
                          })),
                          ...allResolutionLogs.map((log) => ({
                            type: "resolution",
                            timestamp: log.resolved_at,
                            data: log,
                          })),
                        ];

                        timelineItems.sort(
                          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
                        );

                        if (timelineItems.length === 0) return null;

                        const groupedTimelineItems = [];
                        let currentGroup = null;

                        for (let i = 0; i < timelineItems.length; i++) {
                          const item = timelineItems[i];

                          if (item.type === "resolution") {
                            if (currentGroup) {
                              groupedTimelineItems.push(currentGroup);
                              currentGroup = null;
                            }
                            groupedTimelineItems.push({
                              type: "resolution",
                              timestamp: item.timestamp,
                              data: item.data,
                            });
                          } else {
                            if (
                              !currentGroup ||
                              currentGroup.type !== "reply" ||
                              currentGroup.isAdmin !== item.isAdmin
                            ) {
                              if (currentGroup) {
                                groupedTimelineItems.push(currentGroup);
                              }
                              currentGroup = {
                                type: "reply",
                                isAdmin: item.isAdmin,
                                timestamp: item.timestamp,
                                replies: [item.data],
                              };
                            } else {
                              currentGroup.replies.push(item.data);
                            }
                          }
                        }

                        if (currentGroup) {
                          groupedTimelineItems.push(currentGroup);
                        }

                        const formatTimeOnly = (dateString) => {
                          const date = new Date(dateString);
                          return date.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                        };

                        return groupedTimelineItems.map((item, itemIndex) => {
                          if (item.type === "resolution") {
                            return (
                              <div
                                key={`resolution-mobile-${item.data.id}`}
                                className="flex justify-end"
                              >
                                <div className="max-w-[85%] bg-gray-50 p-3 rounded-lg shadow border border-gray-200">
                                  <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-semibold text-gray-800 text-sm">
                                      Status Update
                                    </h3>
                                    <span className="text-xs text-gray-500">
                                      {formatTimeOnly(item.data.resolved_at)}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 whitespace-pre-wrap text-sm">
                                    {item.data.resolution_note}
                                  </p>
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div key={`reply-group-mobile-${itemIndex}`} className="space-y-2">
                                {item.replies.map((reply, replyIndex) => (
                                  <div
                                    key={reply.id}
                                    className={`flex ${item.isAdmin ? "justify-end" : "justify-start"}`}
                                  >
                                    <div className="max-w-[85%] bg-gray-50 p-3 rounded-lg shadow border border-gray-200">
                                      <div className="flex justify-between items-center mb-1">
                                        <h3 className="font-semibold text-gray-800 text-sm">
                                          {item.isAdmin ? "You" : ticketDetails?.ticket?.User?.full_name || "User"}
                                        </h3>
                                        <span className="text-xs text-gray-500 ml-2">
                                          {formatTimeOnly(reply.created_at)}
                                        </span>
                                      </div>
                                      <p className="text-gray-700 whitespace-pre-wrap text-sm">
                                        {reply.message}
                                      </p>

                                      {/* Reply attachments */}
                                      {reply.SupportAttachments?.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                          <div className="flex flex-wrap gap-1">
                                            {reply.SupportAttachments.map(
                                              (attachment, attachIndex) => (
                                                <div
                                                  key={attachIndex}
                                                  className="flex items-center bg-white border border-gray-200 rounded-md p-1 text-xs"
                                                >
                                                  {getFileIcon(attachment)}
                                                  <div className="ml-1">
                                                    <div className="font-medium text-gray-700 truncate max-w-[120px]">
                                                      {attachment.file_url.split("/").pop()}
                                                    </div>
                                                    <a
                                                      onClick={() => downloadFile(`${import.meta.env.VITE_BACKEND_MEDIA_URL}${attachment.file_url}`)}
                                                      className="text-blue-600 hover:text-blue-800 flex items-center cursor-pointer"
                                                    >
                                                      <Download className="h-3 w-3 mr-1" />
                                                      Download
                                                    </a>
                                                  </div>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                        });
                      })()}
                    </div>
                  </div>

                  {/* Desktop Timeline View (sm and above) - Your existing code */}
                  <div className="hidden sm:block relative pb-8">
                    {/* Vertical line */}
                    <div className="absolute left-1/2 w-0.5 h-full bg-gray-300 transform -translate-x-1/2"></div>

                    {/* Ticket creation item - always on user side (left) */}
                    <div className="relative mb-8">
                      <div className="flex justify-between items-start">
                        {/* Left content (user side) */}
                        <div className="w-1/2 pr-8">
                          <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
                            <h3 className="font-semibold text-gray-800 mb-2">
                              Ticket Created
                            </h3>
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {ticketDetails.ticket?.title}
                            </p>
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {ticketDetails.ticket?.description}
                            </p>

                            {/* Ticket attachments */}
                            {ticketDetails.ticket?.SupportAttachments?.length >
                              0 && (
                                <div className="mt-3 pt-2 border-t border-gray-200">
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                                    Attachments:
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {ticketDetails.ticket.SupportAttachments.map(
                                      (attachment, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center bg-gray-50 border border-gray-200 rounded-md p-2"
                                        >
                                          {getFileIcon(attachment)}
                                          <div className="ml-2 grid grid-cols-1">
                                            <div className="text-xs font-medium text-gray-700 truncate max-w-xs">
                                              {attachment.file_url.split("/").pop()}
                                            </div>
                                            <a
                                              onClick={() =>
                                                downloadFile(`${import.meta.env.VITE_BACKEND_MEDIA_URL}${attachment.file_url}`)
                                              }
                                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center cursor-pointer"
                                            >
                                              <Download className="h-3 w-3 mr-1" />
                                              Download
                                            </a>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                        <div className="w-1/2 pl-8 text-left">
                          <div className="inline-block px-3 py-1 bg-lightGreen text-forestGreen rounded-full text-sm font-medium">
                            {formatDate(ticketDetails.ticket?.created_at)}
                          </div>
                        </div>
                      </div>

                      {/* Dot indicator */}
                      <div className="absolute top-4 left-1/2 w-3 h-3 bg-blue-500 rounded-full transform -translate-x-1/2 border-2 border-white shadow"></div>
                    </div>

                    {/* Process and group timeline items */}
                    {(() => {
                      // Combine replies and resolution logs into a single timeline
                      const allReplies =
                        ticketDetails.ticket?.SupportReplies || [];
                      const allResolutionLogs =
                        ticketDetails.ticket?.SupportResolutionLog || [];

                      // Create combined timeline items
                      const timelineItems = [
                        // Add replies with their timestamps
                        ...allReplies.map((reply) => ({
                          type: "reply",
                          isAdmin: reply.user_id ? false : true,
                          timestamp: reply.created_at,
                          data: reply,
                        })),

                        // Add resolution logs with their timestamps
                        ...allResolutionLogs.map((log) => ({
                          type: "resolution",
                          timestamp: log.resolved_at,
                          data: log,
                        })),
                      ];

                      // Sort all items chronologically
                      timelineItems.sort(
                        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
                      );

                      if (timelineItems.length === 0) return null;

                      // Group replies by sender (user or agent) and keep resolution logs as separate items
                      const groupedTimelineItems = [];
                      let currentGroup = null;

                      // Process all timeline items
                      for (let i = 0; i < timelineItems.length; i++) {
                        const item = timelineItems[i];

                        if (item.type === "resolution") {
                          // If we have an active reply group, add it to our timeline before adding resolution
                          if (currentGroup) {
                            groupedTimelineItems.push(currentGroup);
                            currentGroup = null;
                          }

                          // Add resolution log as its own item
                          groupedTimelineItems.push({
                            type: "resolution",
                            timestamp: item.timestamp,
                            data: item.data,
                          });
                        } else {
                          // Handle reply items
                          if (
                            !currentGroup ||
                            currentGroup.type !== "reply" ||
                            currentGroup.isAdmin !== item.isAdmin
                          ) {
                            // If no current group or different sender, start a new group
                            if (currentGroup) {
                              groupedTimelineItems.push(currentGroup);
                            }

                            currentGroup = {
                              type: "reply",
                              isAdmin: item.isAdmin,
                              timestamp: item.timestamp,
                              replies: [item.data],
                            };
                          } else {
                            // Same sender as current group, add to existing group
                            currentGroup.replies.push(item.data);
                          }
                        }
                      }

                      // Add the last group if exists
                      if (currentGroup) {
                        groupedTimelineItems.push(currentGroup);
                      }

                      // Helper to format just the date part without time
                      const formatDateOnly = (dateString) => {
                        const date = new Date(dateString);
                        return date.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        });
                      };

                      // Helper to format just the time part
                      const formatTimeOnly = (dateString) => {
                        const date = new Date(dateString);
                        return date.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      };

                      // Render all timeline items
                      return groupedTimelineItems.map((item, itemIndex) => {
                        // Get date for the item
                        const itemDate = formatDateOnly(item.timestamp);

                        if (item.type === "resolution") {
                          // Render resolution log
                          return (
                            <div
                              key={`resolution-${item.data.id}`}
                              className="flex justify-between items-start mb-4"
                            >
                              <div className="w-1/2 pr-8 text-right">
                                <div className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                                  {itemDate}
                                </div>
                              </div>
                              <div className="w-1/2 pl-8">
                                <div className="bg-gray-50 p-4 rounded-lg shadow border border-gray-200">
                                  <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-semibold text-gray-800">
                                      Status Update
                                    </h3>
                                    <span className="text-xs text-gray-500">
                                      {formatTimeOnly(item.data.resolved_at)}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 whitespace-pre-wrap text-sm">
                                    {item.data.resolution_note}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          // Render reply group
                          return (
                            <div
                              key={`reply-group-${itemIndex}`}
                              className="mb-10"
                            >
                              {/* Individual messages in the group */}
                              {item.replies.map((reply, replyIndex) => (
                                <div key={reply.id} className="relative mb-4">
                                  <div className="flex justify-between items-start">
                                    {item.isAdmin ? (
                                      // User replies on left side
                                      <>
                                        <div className="w-1/2 pr-8 text-right">
                                          <div className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                                            {itemDate}
                                          </div>
                                        </div>
                                        <div className="w-1/2 pl-8">
                                          <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
                                            <div className="flex justify-between items-center mb-1">
                                              <h3 className="font-semibold text-gray-800">
                                                You
                                              </h3>
                                              <span className="text-xs text-gray-500">
                                                {formatTimeOnly(reply.created_at)}
                                              </span>
                                            </div>
                                            <p className="text-gray-700 whitespace-pre-wrap text-sm">
                                              {reply.message}
                                            </p>

                                            {/* Reply attachments */}
                                            {reply.SupportAttachments?.length >
                                              0 && (
                                                <div className="mt-3 pt-2 border-t border-gray-200">
                                                  <div className="flex flex-wrap gap-2">
                                                    {reply.SupportAttachments.map(
                                                      (attachment, attachIndex) => (
                                                        <div
                                                          key={attachIndex}
                                                          className="flex items-center bg-white border border-gray-200 rounded-md p-2"
                                                        >
                                                          {getFileIcon(attachment)}
                                                          <div className="ml-2">
                                                            <div className="text-xs font-medium text-gray-700 truncate max-w-xs">
                                                              {attachment.file_url
                                                                .split("/")
                                                                .pop()}
                                                            </div>
                                                            <a
                                                              onClick={() =>
                                                                downloadFile(`${import.meta.env.VITE_BACKEND_MEDIA_URL}${attachment.file_url}`)
                                                              }
                                                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center cursor-pointer"
                                                            >
                                                              <Download className="h-3 w-3 mr-1" />
                                                              Download
                                                            </a>
                                                          </div>
                                                        </div>
                                                      )
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      // Admin replies on right side
                                      <>
                                        <div className="w-1/2 pr-8">
                                          <div className="bg-gray-50 p-4 rounded-lg shadow border border-gray-200">
                                            <div className="flex justify-between items-center mb-1">
                                              <h3 className="font-semibold text-gray-800">
                                                {ticketDetails?.ticket?.User
                                                  ?.full_name || "User"}
                                              </h3>
                                              <span className="text-xs text-gray-500">
                                                {formatTimeOnly(reply.created_at)}
                                              </span>
                                            </div>
                                            <p className="text-gray-700 whitespace-pre-wrap text-sm">
                                              {reply.message}
                                            </p>

                                            {/* Reply attachments */}
                                            {reply.SupportAttachments?.length >
                                              0 && (
                                                <div className="mt-3 pt-2 border-t border-gray-200">
                                                  <div className="flex flex-wrap gap-2">
                                                    {reply.SupportAttachments.map(
                                                      (attachment, attachIndex) => (
                                                        <div
                                                          key={attachIndex}
                                                          className="flex items-center bg-white border border-gray-200 rounded-md p-2"
                                                        >
                                                          {getFileIcon(attachment)}
                                                          <div className="ml-2">
                                                            <div className="text-xs font-medium text-gray-700 truncate max-w-xs">
                                                              {attachment.file_url
                                                                .split("/")
                                                                .pop()}
                                                            </div>
                                                            <a
                                                              onClick={() =>
                                                                downloadFile(`${import.meta.env.VITE_BACKEND_MEDIA_URL}${attachment.file_url}`)
                                                              }
                                                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center cursor-pointer"
                                                            >
                                                              <Download className="h-3 w-3 mr-1" />
                                                              Download
                                                            </a>
                                                          </div>
                                                        </div>
                                                      )
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                          </div>
                                        </div>
                                        <div className="w-1/2 pl-8">
                                          <div className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                                            {itemDate}
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  {/* Dot indicator only on the first message in each group */}
                                  {replyIndex === 0 && (
                                    <div className="absolute top-4 left-1/2 w-3 h-3 bg-blue-500 rounded-full transform -translate-x-1/2 border-2 border-white shadow"></div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        }
                      });
                    })()}
                  </div>

                  <PermissionWrapper section="Support Reply" action="create">
                    {/* Reply Form */}
                    {ticketDetails.ticket?.status !== "CLOSED" && (
                      <form onSubmit={handleReplySubmit}>
                        {/* Mobile-only chat input (hidden on larger screens) */}
                        <div className="block sm:hidden">
                          {/* Selected files preview */}
                          {attachments.length > 0 && (
                            <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                  {attachments.length} file(s) selected
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAttachments([]);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                  }}
                                  className="text-xs text-red-600 hover:text-red-800"
                                >
                                  Clear all
                                </button>
                              </div>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {attachments.map((file, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between bg-white p-2 rounded border border-gray-200"
                                  >
                                    <div className="flex items-center overflow-hidden flex-1 min-w-0">
                                      {file.preview ? (
                                        <img
                                          src={file.preview || `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`}
                                          alt="Preview"
                                          className="w-8 h-8 object-cover rounded border border-gray-200 flex-shrink-0"
                                        />
                                      ) : (
                                        <BookOpen className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                      )}
                                      <div className="ml-2 overflow-hidden min-w-0 flex-1">
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                          {file.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {formatFileSize(file.size)}
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFile(index)}
                                      className="text-gray-400 hover:text-red-500 ml-2 flex-shrink-0"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Chat input area */}
                          <div className="flex items-center gap-1 bg-white border-t border-gray-200 pt-3">
                            {/* Attachment button - Left side */}
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex-shrink-0 p-2 mb-1 text-gray-600 border border-gray-200 hover:text-leafGreen hover:bg-gray-100 rounded-full transition-colors"
                              title="Add attachment"
                            >
                              <Paperclip className="h-5 w-5 text-gray-500" />
                            </button>
                            <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              multiple
                              onChange={handleFileChange}
                            />

                            {/* Message textarea - Center */}
                            <div className="flex-1 min-w-0">
                              <textarea
                                id="reply-mobile"
                                rows="1"
                                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen resize-none custom-scrollbar"
                                placeholder="Type a message..."
                                value={replyMessage}
                                required
                                onChange={(e) => {
                                  setReplyMessage(e.target.value);
                                  // Auto-resize textarea
                                  const textarea = e.target;
                                  textarea.style.height = 'auto';
                                  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (replyMessage.trim() || attachments.length > 0) {
                                      handleReplySubmit(e);
                                    }
                                  }
                                }}
                              ></textarea>
                            </div>

                            {/* Send button - Right side */}
                            <button
                              type="submit"
                              disabled={
                                isReplying ||
                                (!replyMessage.trim() && attachments.length === 0)
                              }
                              className="flex-shrink-0 p-2 mb-1 bg-leafGreen text-white rounded-full focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:ring-offset-2 disabled:bg-leafGreen/30 disabled:cursor-not-allowed transition-colors"
                              title="Send message"
                            >
                              {isReplying ? (
                                <RefreshCw className="h-5 w-5 animate-spin" />
                              ) : (
                                <Send className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Desktop form (hidden on mobile) */}
                        <div className="hidden sm:block">
                          <div className="mb-4">
                            <label
                              htmlFor="reply"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Your Reply
                            </label>
                            <textarea
                              id="reply"
                              rows="4"
                              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen"
                              placeholder="Type your response here..."
                              required
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                            ></textarea>
                          </div>

                          {/* File Attachments */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Attachments
                              </label>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-sm text-leafGreen hover:text-forestGreen flex items-center"
                              >
                                <Paperclip className="h-4 w-4 mr-1" />
                                Add Files
                              </button>
                              <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple
                                onChange={handleFileChange}
                              />
                            </div>

                            {attachments.length > 0 && (
                              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                                <div className="text-sm text-gray-500 mb-2">
                                  {attachments.length} file(s) selected
                                </div>
                                <div className="space-y-2">
                                  {attachments.map((file, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between bg-white p-2 rounded border border-gray-200"
                                    >
                                      <div className="flex items-center overflow-hidden">
                                        {file.preview ? (
                                          <img
                                            src={file.preview || `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`}
                                            alt="Preview"
                                            className="w-8 h-8 object-cover rounded border border-gray-200"
                                          />
                                        ) : (
                                          <BookOpen className="w-5 h-5 text-gray-500" />
                                        )}
                                        <div className="ml-2 overflow-hidden grid grid-cols-1">
                                          <div className="text-sm font-medium text-gray-900 truncate">
                                            {file.name}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {formatFileSize(file.size)}
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveFile(index)}
                                        className="text-gray-400 hover:text-red-500 ml-2"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={
                                isReplying ||
                                (!replyMessage.trim() && attachments.length === 0)
                              }
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-leafGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lightGreen/50 disabled:bg-leafGreen/30 disabled:cursor-not-allowed"
                            >
                              {isReplying ? (
                                <>
                                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="mr-2 h-4 w-4" />
                                  Send Reply
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </PermissionWrapper>
                </div>
                ) : (
                <div className="text-center py-16">
                  <p className="text-gray-500">Ticket not found</p>
                </div>
                )}

              </div>
            </div>
          )}
        </div>
        <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        isLoading={confirmModal.isLoading}
      />
    </div >
  );
};

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
  isLoading = false,
}) {
  if (!isOpen) return null

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
          iconBg: "bg-red-100",
          confirmBtn: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
        }
      case "warning":
        return {
          icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
          iconBg: "bg-yellow-100",
          confirmBtn: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
        }
      case "success":
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          iconBg: "bg-green-100",
          confirmBtn: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
        }
      case "closed":
        return {
          icon: <X className="w-6 h-6 text-gray-600" />,
          iconBg: "bg-gray-100",
          confirmBtn: "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500",
        }
      default:
        return {
          icon: <CheckCircle className="w-6 h-6 text-leafGreen" />,
          iconBg: "bg-lightGreen",
          confirmBtn: "bg-leafGreen focus:ring-leafGreen",
        }
    }
  }

  const typeStyles = getTypeStyles()

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:ring-offset-2"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div
              className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${typeStyles.iconBg} sm:mx-0 sm:h-10 sm:w-10`}
            >
              {typeStyles.icon}
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className="text-base font-semibold leading-6 text-gray-900">{title}</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">{message}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${typeStyles.confirmBtn} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : confirmText}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSupportPage;
