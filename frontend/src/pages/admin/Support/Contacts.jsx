import { useState } from "react"
import {
  useGetAllContactsQuery,
  useDeleteContactByIdMutation,
  useDeleteAllContactsMutation,
  useMarkContactAsReadByIdMutation,
  useMarkAllContactsAsReadMutation,
} from "../../../services/Support/contactApi"
import { getAdminToken } from "../../../services/CookieService"
import AdminLoader from "../../../components/admin/AdminLoader"
import { XCircle, CheckCircle, Trash2, Eye, X, AlertTriangle, Mail, Calendar, User, MessageSquare, ChevronLeft, ChevronRight, ArrowLeft, Filter, ChevronUp, ChevronDown, MoreVertical } from "lucide-react"
import PermissionWrapper from "../../../context/PermissionWrapper"
import { useNavigate } from "react-router-dom"

// Custom Modal Component
const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
        <div className="relative w-full max-w-2xl transform rounded-lg bg-white shadow-2xl transition-all">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

// Custom Alert Component
const Alert = ({ type = "error", message, onClose }) => {
  const styles = {
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    success: "bg-green-50 border-green-200 text-green-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  }
  const icons = {
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    info: <Eye className="h-5 w-5 text-blue-500" />,
  }
  return (
    <div className={`rounded-lg border p-4 ${styles[type]} mb-6`}>
      <div className="flex items-start space-x-3">
        {icons[type]}
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4 md:space-y-4">
        <p className="text-gray-600 text-sm md:text-base">{message}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2 justify-center"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{isLoading ? "Deleting..." : "Delete"}</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}

const Contacts = () => {
  const { access_token } = getAdminToken()
  const [selectedContact, setSelectedContact] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null, id: null })
  const [errorMessage, setErrorMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showFilters, setShowFilters] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate();

  // Fetch contacts with access_token
  const {
    data: contacts,
    isLoading,
    error,
  } = useGetAllContactsQuery(
    { limit: pageSize, offset: pageSize !== "all" ? pageSize * (currentPage - 1) : 0, read: filterStatus, access_token },
    {
      skip: !access_token,
    },
  )

  const isAnyFilterApplied = () => {
    return (
      filterStatus !== "all"
    )
  }

  // Initialize mutations with access_token
  const [deleteContactById, { isLoading: isDeleting }] = useDeleteContactByIdMutation()
  const [deleteAllContacts, { isLoading: isDeletingAll }] = useDeleteAllContactsMutation()
  const [markContactAsReadById, { isLoading: isMarking }] = useMarkContactAsReadByIdMutation()
  const [markAllContactsAsRead, { isLoading: isMarkingAll }] = useMarkAllContactsAsReadMutation()

  const handleRowClick = (contact) => {
    setSelectedContact(contact)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedContact(null)
    setErrorMessage(null)
  }

  const handleDeleteContact = async (id) => {
    if (!access_token) {
      setErrorMessage("Authentication required. Please log in.")
      return
    }
    try {
      await deleteContactById({ id, access_token }).unwrap()
      handleCloseModal()
      setConfirmModal({ open: false, type: null, id: null })
      // Reset to first page if current page becomes empty
      if (paginatedContacts.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }
    } catch (err) {
      setErrorMessage(err?.data?.error || "Failed to delete contact.")
    }
  }

  const handleDeleteAll = async () => {
    if (!access_token) {
      setErrorMessage("Authentication required. Please log in.")
      return
    }
    try {
      await deleteAllContacts(access_token).unwrap()
      setConfirmModal({ open: false, type: null, id: null })
      setCurrentPage(1)
    } catch (err) {
      setErrorMessage(err?.data?.error || "Failed to delete all contacts.")
    }
  }

  const handleMarkAsRead = async (id) => {
    if (!access_token) {
      setErrorMessage("Authentication required. Please log in.")
      return
    }
    try {
      await markContactAsReadById({ id, access_token }).unwrap()
      handleCloseModal()
    } catch (err) {
      setErrorMessage(err?.data?.error || "Failed to mark contact as read.")
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!access_token) {
      setErrorMessage("Authentication required. Please log in.")
      return
    }
    try {
      await markAllContactsAsRead(access_token).unwrap()
    } catch (err) {
      setErrorMessage(err?.data?.error || "Failed to mark all contacts as read.")
    }
  }

  const openConfirmModal = (type, id = null) => {
    setConfirmModal({ open: true, type, id })
  }

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, type: null, id: null })
  }

  const handleConfirmAction = () => {
    if (confirmModal.type === "deleteAll") {
      handleDeleteAll()
    } else if (confirmModal.type === "deleteOne") {
      handleDeleteContact(confirmModal.id)
    }
  }

  // Pagination and filter logic
  const handlePageSizeChange = (e) => {
    setPageSize(e.target.value === "all" ? 'all' : Number(e.target.value))
    setCurrentPage(1) // Reset to first page when page size changes
  }

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value)
    setCurrentPage(1) // Reset to first page when filter changes
  }

  const filteredContacts = contacts?.contacts.filter((contact) => {
    if (filterStatus === "all") return true
    return filterStatus === "read" ? contact.isRead : !contact.isRead
  }) || []

  const totalContacts = contacts?.totalCount;
  const totalPages = pageSize !== "all" ? Math.ceil(totalContacts / pageSize) : 1;
  const paginatedContacts = filteredContacts

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-0 sm:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full px-4 sm:px-6 py-4">
          {/* Mobile View */}
          <div className="md:hidden">
            {/* Top Row - Title and Back Button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1"></div> {/* Spacer for centering */}
              <div className="flex-1 flex justify-center">
                <h1 className="text-xl font-bold bg-forestGreen bg-clip-text text-transparent text-center">
                  Contacts
                </h1>
              </div>
              <div className="flex-1 flex justify-end">
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="flex items-center gap-1 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                >
                  <ArrowLeft size={14} />
                </button>
              </div>
            </div>

            {/* Bottom Row - Two Buttons in Columns */}
            <div className="grid grid-cols-2 gap-2">
              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-1.5 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors font-medium text-sm"
              >
                <Filter size={14} />
                <span>Filters</span>
                {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {/* Mobile Actions Menu */}
              <div className="relative">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex items-center justify-center gap-1.5 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors font-medium text-sm w-full"
                >
                  <MoreVertical size={14} />
                  <span>Actions</span>
                </button>

                {mobileMenuOpen && (
                  <div className="absolute top-12 right-0 z-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-48">
                    <PermissionWrapper section="Contact" action="edit">
                      <button
                        onClick={() => {
                          handleMarkAllAsRead();
                          setMobileMenuOpen(false);
                        }}
                        disabled={isMarkingAll || isLoading || !contacts?.contacts.length}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                      >
                        {isMarkingAll ? (
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {isMarkingAll ? "Marking..." : "Mark All as Read"}
                      </button>
                    </PermissionWrapper>
                    <PermissionWrapper section="Contact" action="delete">
                      <button
                        onClick={() => {
                          openConfirmModal("deleteAll");
                          setMobileMenuOpen(false);
                        }}
                        disabled={isDeletingAll || isLoading || !contacts?.contacts.length}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete All
                      </button>
                    </PermissionWrapper>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop View - Unchanged */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-forestGreen bg-clip-text text-transparent">
                  Contact Messages
                </h1>
                <p className="text-gray-600 mt-1">Manage and respond to customer inquiries</p>
              </div>

              <div className="flex items-center gap-3">

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 lg:px-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                >
                  <Filter size={18} />
                  <span className="font-medium lg:inline-flex hidden">Filters</span>
                  {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {access_token && (<PermissionWrapper section="Contact" action="edit|delete">
                  <PermissionWrapper section="Contact" action="edit">
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={isMarkingAll || isLoading || !contacts?.contacts.length}
                      className="bg-leafGreen hover:bg-leafGreen/90 text-white px-4 lg:px-6 p-2 rounded-lg flex items-center gap-2 transition-all duration-300 font-medium shadow-sm"
                    >
                      {isMarkingAll ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {isMarkingAll ? "Marking..." : <p><span className="lg:inline-flex hidden">Mark</span> All <span className="lg:inline-flex hidden">as</span> Read</p>}
                    </button>
                  </PermissionWrapper>

                  <PermissionWrapper section="Contact" action="delete">
                    <button
                      onClick={() => openConfirmModal("deleteAll")}
                      disabled={isDeletingAll || isLoading || !contacts?.contacts.length}
                      className="inline-flex items-center md:px-4 p-2 bg-red-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      <span className="lg:inline-flex hidden mr-1">Delete</span>All
                    </button>
                  </PermissionWrapper>
                </PermissionWrapper>)}

                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="flex items-center gap-2 md:px-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span className="font-medium hidden md:inline-flex">Back</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilters ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
              }`}
          >
            <div className="p-4 bg-lightGreen/10 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter By Status</label>
                  <select
                    value={filterStatus}
                    onChange={handleFilterChange}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen"
                  >
                    <option value="all">All Messages</option>
                    <option value="read">Read</option>
                    <option value="unread">Unread</option>
                  </select>
                </div>
              </div>

              {isAnyFilterApplied() && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setFilterStatus("all");
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

      <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6">

        {/* Authentication Error */}
        {!access_token && <Alert type="error" message="Please log in to view and manage contacts." />}
        {/* Error Message */}
        {errorMessage && <Alert type="error" message={errorMessage} onClose={() => setErrorMessage(null)} />}
        {/* Loading State */}
        {isLoading && access_token && (
          <AdminLoader message="Loading contacts..." />
        )}
        {/* API Error State */}
        {error && access_token && (
          <Alert type="error" message={`Failed to load contacts: ${error?.data?.error || "Unknown error"}`} />
        )}
        {/* Contacts Table */}
        {access_token && !isLoading && !error && contacts && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
                <p className="text-gray-500">When customers reach out, their messages will appear here.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-lightGreen border-b border-gray-200 sticky top-0 z-20">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedContacts?.map((contact) => (
                        <tr
                          key={contact.id}
                          onClick={() => handleRowClick(contact)}
                          className={`cursor-pointer hover:bg-lightGreen/20 transition-colors duration-150 ${!contact.isRead ? "bg-lightGreen/20 border-l-4 border-l-leafGreen" : ""
                            }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{contact.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="grid">
                              <div className="text-sm font-medium text-gray-900 truncate">{contact.fullName}</div>
                              <div className="text-sm text-gray-500 truncate">{contact.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 grid">
                            <span className="truncate">{contact.subject}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(contact.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {contact.isRead ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Read
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Unread
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile List */}
                <div className="sm:hidden divide-y divide-gray-100">
                  {paginatedContacts?.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => handleRowClick(contact)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${!contact.isRead ? "bg-blue-50/50 border-l-4 border-l-blue-500" : ""
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-gray-500">#{contact.id}</span>
                            {contact.isRead ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Read
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Unread
                              </span>
                            )}
                          </div>
                          <div className="grid">
                            <h3 className="text-sm font-medium text-gray-900 truncate">{contact.fullName}</h3>
                            <p className="text-xs text-gray-500 mt-1 truncate">{contact.email}</p>
                          </div>
                          <p className="text-sm text-gray-900 mt-2 line-clamp-2">{contact.subject}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(contact.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop Table Header */}
                {totalContacts > 10 && <div className="hidden sm:flex justify-between items-center px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Show</span>
                    <select
                      value={pageSize}
                      onChange={handlePageSizeChange}
                      className="border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-lightGreen/50 focus:border-leafGreen"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value="all">All</option>
                    </select>
                    <span className="text-sm text-gray-600">entries</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>}

                {/* Mobile Pagination */}
                {totalContacts > 10 && <div className="sm:hidden flex justify-between items-center p-4 border-b border-gray-200">
                  <div className="text-sm text-gray-600">
                    {totalContacts} message{totalContacts !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-600">
                      {currentPage}/{totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>}
              </>
            )}
          </div>
        )}
        {/* Contact Details Modal */}

        {modalOpen &&
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={handleCloseModal} />
            <div className="z-[100] bg-white rounded-lg w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  Contact Details
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="space-y-4 md:space-y-6">
                  {errorMessage && <Alert type="error" message={errorMessage} onClose={() => setErrorMessage(null)} />}

                  {/* Mobile: Stack layout, Desktop: Grid layout */}
                  <div className="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-start space-x-3">
                        <User className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs md:text-sm font-medium text-gray-500">Full Name</p>
                          <p className="text-gray-900 text-sm md:text-base break-all">{selectedContact.fullName}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Mail className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs md:text-sm font-medium text-gray-500">Email</p>
                          <p className="text-gray-900 text-sm md:text-base break-all">{selectedContact.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Calendar className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs md:text-sm font-medium text-gray-500">Created At</p>
                          <p className="text-gray-900 text-sm md:text-base">{new Date(selectedContact.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                      <div>
                        <p className="text-xs md:text-sm font-medium text-gray-500 mb-1">ID</p>
                        <p className="text-gray-900 text-sm md:text-base">#{selectedContact.id}</p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-medium text-gray-500 mb-1">Status</p>
                        {selectedContact.isRead ? (
                          <span className="inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Read
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Unread
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-medium text-gray-500 mb-1">Updated At</p>
                        <p className="text-gray-900 text-sm md:text-base">{new Date(selectedContact.updated_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-500 mb-2">Subject</p>
                    <p className="text-gray-900 font-medium text-sm md:text-base">{selectedContact.subject}</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      <p className="text-xs md:text-sm font-medium text-gray-500">Message</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 md:p-4 max-h-32 md:max-h-40 overflow-y-auto">
                      <p className="text-gray-900 whitespace-pre-wrap text-sm md:text-base break-all">{selectedContact.message}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex flex-col gap-2 sm:gap-3 p-4 sm:p-6 sm:flex-row sm:justify-end sticky bottom-0">
                {!selectedContact.isRead && (
                  <PermissionWrapper section="Contact" action="edit">
                    <button
                      onClick={() => handleMarkAsRead(selectedContact.id)}
                      disabled={isMarking || isDeleting || !access_token}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-leafGreen text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen/50 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isMarking ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      {isMarking ? "Marking..." : "Mark as Read"}
                    </button>
                  </PermissionWrapper>
                )}
                <PermissionWrapper section="Contact" action="delete">
                  <button
                    onClick={() => openConfirmModal("deleteOne", selectedContact.id)}
                    disabled={isDeleting || isMarking || !access_token}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </PermissionWrapper>
              </div>
            </div>
          </div>
        }

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmModal.open}
          onClose={closeConfirmModal}
          onConfirm={handleConfirmAction}
          title={confirmModal.type === "deleteAll" ? "Delete All Contacts" : "Delete Contact"}
          message={
            confirmModal.type === "deleteAll"
              ? "Are you sure you want to delete all contacts? This action cannot be undone."
              : "Are you sure you want to delete this contact? This action cannot be undone."
          }
          isLoading={confirmModal.type === "deleteAll" ? isDeletingAll : isDeleting}
        />
      </div>
    </div>
  )
}

export default Contacts