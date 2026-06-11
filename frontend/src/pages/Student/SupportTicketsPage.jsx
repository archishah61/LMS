"use client"

import { useState, useEffect, useRef } from "react"
import {
    ArrowLeft,
    Send,
    LifeBuoy,
    ChevronLeft,
    MessageSquare,
    Clock,
    RefreshCw,
    Paperclip,
    Download,
    X,
    Filter,
    Search,
    Plus,
    Calendar,
    User,
    FileText,
    ChevronDown,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import {
    useGetAllUserSupportTicketsQuery,
    useCreateSupportTicketMutation,
    useCreateSupportReplyMutation,
    useGetSupportTicketByIdQuery,
} from "../../services/Support/supportAPI"
import { getStudentToken } from "../../services/CookieService"
import { useSelector } from "react-redux"
import { useLocation } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import { motion, AnimatePresence } from "framer-motion"
import PrimaryLoader from "../../components/ui/PrimaryLoader"

const SupportTicketsPage = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { access_token } = getStudentToken()
    const { id: reduxUserId } = useSelector((state) => state.user)

    let userId = reduxUserId

    // Fallback: If userId is missing from Redux (e.g., on refresh), try to decode it from the token
    if (!userId && access_token) {
        try {
            const decoded = jwtDecode(access_token)
            userId = decoded.id
        } catch (error) {
            console.error("Failed to decode token:", error)
        }
    }

    const isStandalone = location.pathname === '/user-support-tickets'

    const [currentView, setCurrentView] = useState("list") // "list", "create", "detail"
    const [selectedTicket, setSelectedTicket] = useState(null)
    const [replyMessage, setReplyMessage] = useState("")
    const [attachments, setAttachments] = useState([])
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    // New ticket form states
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [category, setCategory] = useState("Content")
    const [relatedType, setRelatedType] = useState(null)
    const [ticketAttachments, setTicketAttachments] = useState([])
    const [showFilters, setShowFilters] = useState(false)

    const replyFileInputRef = useRef(null)
    const ticketFileInputRef = useRef(null)

    const [createTicket, { isLoading: isCreatingTicket }] = useCreateSupportTicketMutation()
    const [createReply, { isLoading: isReplying }] = useCreateSupportReplyMutation()

    const {
        data: tickets,
        isLoading: isLoadingTickets,
        refetch: refetchTickets,
    } = useGetAllUserSupportTicketsQuery({ access_token })

    const {
        data: ticketDetails,
        isLoading: isLoadingTicketDetails,
        refetch: refetchTicketDetails,
    } = useGetSupportTicketByIdQuery({ id: selectedTicket, access_token }, { skip: !selectedTicket })

    // Filter tickets for this user
    const userTickets = tickets?.tickets?.filter((ticket) => ticket.user_id === userId) || []

    // Apply filters
    const filteredTickets = userTickets.filter((ticket) => {
        const matchesSearch =
            ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
        const matchesCategory = categoryFilter === "all" || ticket.category === categoryFilter

        return matchesSearch && matchesStatus && matchesCategory
    })

    useEffect(() => {
        window.scrollTo(0, 0)
        refetchTickets()
    }, [refetchTickets])

    useEffect(() => {
        if (selectedTicket) {
            refetchTicketDetails()
        }
    }, [selectedTicket, refetchTicketDetails])

    const resetFilters = () => {
        setSearchTerm("")
        setCategoryFilter("all")
        setStatusFilter("all")
        // Optionally hide filters after resetting
        setShowFilters(false)
    }

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + " B"
        else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB"
        else return (bytes / 1048576).toFixed(2) + " MB"
    }

    // Handle file input change for replies
    const handleReplyFileChange = (e) => {
        const newFiles = Array.from(e.target.files)
        const updatedAttachments = newFiles.map((file) => ({
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        }))
        setAttachments([...attachments, ...updatedAttachments])
    }

    // Handle file input change for new tickets
    const handleTicketFileChange = (e) => {
        const newFiles = Array.from(e.target.files)
        const updatedAttachments = newFiles.map((file) => ({
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        }))
        setTicketAttachments([...ticketAttachments, ...updatedAttachments])
    }

    // Handle file removal for replies
    const handleRemoveFile = (indexToRemove) => {
        const updatedAttachments = attachments.filter((_, index) => index !== indexToRemove)
        setAttachments(updatedAttachments)
    }

    // Handle file removal for new tickets
    const handleRemoveTicketFile = (indexToRemove) => {
        const updatedAttachments = ticketAttachments.filter((_, index) => index !== indexToRemove)
        setTicketAttachments(updatedAttachments)
    }

    const handleTicketClick = (ticketId) => {
        setSelectedTicket(ticketId)
        setCurrentView("detail")
    }

    const handleBackToList = () => {
        setSelectedTicket(null)
        setCurrentView("list")
        setAttachments([])
        setReplyMessage("")
    }

    const handleCreateNewTicket = () => {
        setCurrentView("create")
        // Reset form
        setTitle("")
        setDescription("")
        setCategory("Content")
        setTicketAttachments([])
    }

    const handleCancelCreate = () => {
        setCurrentView("list")
        // Reset form
        setTitle("")
        setDescription("")
        setCategory("Content")
        setTicketAttachments([])
    }

    const handleCreateTicketSubmit = async (e) => {
        e.preventDefault()

        if (!title.trim() || !description.trim()) {
            toast.error("Please fill in all required fields")
            return
        }

        try {
            const formData = new FormData()
            formData.append("title", title)
            formData.append("description", description)
            formData.append("category", category)
            formData.append("user_id", userId)
            formData.append("status", "OPEN")

            // Append each file to FormData
            ticketAttachments.forEach((attachment) => {
                formData.append("supportFile", attachment.file)
            })

            await createTicket({ data: formData, access_token }).unwrap()

            toast.success("Support ticket created successfully!")

            // Reset form and go back to list
            setTitle("")
            setDescription("")
            setCategory("Content")
            setTicketAttachments([])
            setCurrentView("list")
            refetchTickets()
        } catch (error) {
            const errorMessage = error?.data?.error ||
                error?.data?.message ||
                error?.error ||
                error?.message ||
                'Failed to delete role';
            toast.error(errorMessage);
        }
    }

    const handleReplySubmit = async (e) => {
        e.preventDefault()

        if (!replyMessage.trim() && attachments.length === 0) {
            toast.error("Please enter a reply message or attach a file")
            return
        }

        try {
            const formData = new FormData()
            formData.append("ticket_id", selectedTicket)
            formData.append("user_id", userId)
            formData.append("message", replyMessage)

            attachments.forEach((attachment) => {
                formData.append("supportFile", attachment.file)
            })

            await createReply({ data: formData, access_token }).unwrap()

            toast.success("Reply sent successfully!")
            setReplyMessage("")
            setAttachments([])
            refetchTicketDetails()
        } catch (error) {
            const errorMessage = error?.data?.error ||
                error?.data?.message ||
                error?.error ||
                error?.message ||
                'Failed to delete role';
            toast.error(errorMessage);
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case "OPEN":
                return "bg-blue-100 text-blue-800 border border-blue-200"
            case "IN_PROGRESS":
                return "bg-yellow-100 text-yellow-800 border border-yellow-200"
            case "RESOLVED":
                return "bg-green-100 text-green-800 border border-green-200"
            case "CLOSED":
                return "bg-gray-100 text-gray-800 border border-gray-200"
            default:
                return "bg-gray-100 text-gray-800 border border-gray-200"
        }
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    }

    const formatDateOnly = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    const formatTimeOnly = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getFileIcon = (attachment) => {
        if (attachment.file_type?.startsWith("image/")) {
            return (
                <img
                    src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${attachment.file_url || "/placeholder.png"}`}
                    alt="File preview"
                    className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 object-cover rounded-lg border border-gray-200"
                />
            )
        }
        return <FileText className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
    }

    function downloadFile(url) {
        const link = document.createElement("a")
        const urlParts = url.split("/")
        const filename = urlParts[urlParts.length - 1].split("?")[0]

        link.href = url
        link.setAttribute("download", filename)
        link.setAttribute("target", "_blank")
        link.setAttribute("rel", "noopener noreferrer")

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Get unique categories for filter
    // const uniqueCategories = [...new Set(userTickets.map((ticket) => ticket.category))]
    const uniqueCategories = ['Content', 'Technical', 'Access', 'Billing', 'Achievement', 'Communication', 'Other'];

    // Check if any filter is active
    const isFilterActive = categoryFilter !== "all" || statusFilter !== "all" || searchTerm.trim() !== ""

    // Loading State
    if (isLoadingTickets && currentView === "list") {
        return <PrimaryLoader />;
    }

    // Tickets List View
    if (currentView === "list" || currentView === "create") {
        return (
            <div className="min-h-screen bg-white pt-4 pb-4">
                <main className={`container mx-auto ${isStandalone ? 'px-4 sm:px-6 lg:px-8' : ''}`}>
                    {/* Header - Responsive Design */}
                    <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8">
                        <div className="bg-secondaryForestGreen rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8 text-white shadow-lg relative overflow-hidden">
                            {/* Decorative Pattern Overlay */}
                            <div
                                className="absolute inset-0 opacity-100 bg-cover bg-center"
                                style={{ backgroundImage: 'url("/assets/Rectangle 34627103.png")' }}
                            ></div>

                            <div className="relative z-10">
                                {/* Mobile Layout - Stacked */}
                                <div className="flex flex-col gap-4 sm:gap-4 md:hidden">
                                    {/* Title Section */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Support Tickets</h1>
                                            <LifeBuoy className="w-5 h-5 sm:w-6 sm:h-6 opacity-80" />
                                        </div>
                                        <p className="text-lightGreen text-sm sm:text-base opacity-90">
                                            View and manage all your support requests
                                        </p>
                                    </div>

                                    {/* Button Group - Mobile - Responsive buttons */}
                                    <div className="flex items-center justify-between gap-2">
                                        <button
                                            onClick={handleCreateNewTicket}
                                            className="flex-1 px-2 py-2.5 xs:px-3 sm:px-3 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg flex items-center justify-center gap-1.5 transition-all hover:bg-white/30 min-h-[44px]"
                                            title="Create New Ticket"
                                        >
                                            <Plus className="w-4 h-4 sm:w-4 sm:h-4" />
                                            <span className="text-xs font-medium hidden xs:inline">New</span>
                                        </button>

                                        <button
                                            onClick={() => refetchTickets()}
                                            className="flex-1 px-2 py-2.5 xs:px-3 sm:px-3 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg flex items-center justify-center gap-1.5 transition-all hover:bg-white/30 min-h-[44px]"
                                            title="Refresh Tickets"
                                        >
                                            <RefreshCw className="w-4 h-4 sm:w-4 sm:h-4" />
                                            <span className="text-xs font-medium hidden xs:inline">Refresh</span>
                                        </button>

                                        <button
                                            onClick={() => setShowFilters(!showFilters)}
                                            className={`flex-1 px-2 py-2.5 xs:px-3 sm:px-3 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg flex items-center justify-center gap-1.5 transition-all hover:bg-white/30 min-h-[44px] ${showFilters ? 'bg-white/40' : ''}`}
                                            title="Filter Tickets"
                                        >
                                            <Filter className="w-4 h-4 sm:w-4 sm:h-4" />
                                            <span className="text-xs font-medium hidden xs:inline">Filter</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Tablet Layout - Icons with Short Text */}
                                <div className="hidden md:flex lg:hidden md:items-center md:justify-between md:gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
                                            <LifeBuoy className="w-6 h-6 opacity-80" />
                                        </div>
                                        <p className="text-lightGreen text-base opacity-90">
                                            View and manage all your support requests
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleCreateNewTicket}
                                            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg flex items-center gap-2 transition-all text-sm font-medium hover:bg-white/30 h-10 min-w-[100px]"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>New Ticket</span>
                                        </button>

                                        <button
                                            onClick={() => refetchTickets()}
                                            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg flex items-center gap-2 transition-all text-sm font-medium hover:bg-white/30 h-10 min-w-[90px]"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            <span>Refresh</span>
                                        </button>

                                        <button
                                            onClick={() => setShowFilters(!showFilters)}
                                            className={`px-4 py-2 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg flex items-center gap-2 transition-all text-sm font-medium hover:bg-white/30 h-10 min-w-[80px] ${showFilters ? 'bg-white/40' : ''}`}
                                        >
                                            <Filter className="w-4 h-4" />
                                            <span>Filter</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Desktop Layout - Full Labels */}
                                <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
                                            <LifeBuoy className="w-6 h-6 opacity-80" />
                                        </div>
                                        <p className="text-lightGreen text-base opacity-90">
                                            View and manage all your support requests
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleCreateNewTicket}
                                            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg flex items-center gap-2 transition-all text-sm font-medium hover:bg-white/30 h-10"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span className="whitespace-nowrap">Create Your First Ticket</span>
                                        </button>

                                        <button
                                            onClick={() => refetchTickets()}
                                            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg flex items-center gap-2 transition-all text-sm font-medium hover:bg-white/30 h-10"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            <span>Refresh</span>
                                        </button>

                                        <button
                                            onClick={() => setShowFilters(!showFilters)}
                                            className={`p-2 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg transition-all hover:bg-white/30 h-10 w-10 flex items-center justify-center ${showFilters ? 'bg-white/40' : ''}`}
                                            title="Filters"
                                        >
                                            <Filter className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Animated Filter Container - Responsive */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden mb-4 sm:mb-6"
                            >
                                <div className="bg-white p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
                                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                                        <div className="relative xs:col-span-2 md:col-span-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search tickets..."
                                                className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>

                                        <select
                                            className="w-full px-3 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <option value="all">All Status</option>
                                            <option value="OPEN">Open</option>
                                            <option value="IN_PROGRESS">In Progress</option>
                                            <option value="RESOLVED">Resolved</option>
                                            <option value="CLOSED">Closed</option>
                                        </select>

                                        <select
                                            className="w-full px-3 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            value={categoryFilter}
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                        >
                                            <option value="all">All Categories</option>
                                            {uniqueCategories.map((category) => (
                                                <option key={category} value={category}>
                                                    {category}
                                                </option>
                                            ))}
                                        </select>

                                        <button
                                            onClick={resetFilters}
                                            className="px-3 sm:px-4 py-1.5 sm:py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 xs:col-span-2 md:col-span-1"
                                        >
                                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                            Clear Filters
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Stats Cards - Responsive Design */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
                        {/* Total Tickets */}
                        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-sm border border-gray-100 relative overflow-hidden flex items-center gap-3 sm:gap-4">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 sm:h-10 w-1.5 rounded-r-full bg-experience1"></div>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-purple-50 rounded-lg sm:rounded-2xl flex items-center justify-center flex-shrink-0 text-experience1">
                                <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Total Tickets</p>
                                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-none">{userTickets.length}</h3>
                            </div>
                        </div>

                        {/* Open */}
                        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-sm border border-gray-100 relative overflow-hidden flex items-center gap-3 sm:gap-4">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 sm:h-10 w-1.5 rounded-r-full bg-experience4"></div>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-50 rounded-lg sm:rounded-2xl flex items-center justify-center flex-shrink-0 text-experience4">
                                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Open</p>
                                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-none">{userTickets.filter((t) => t.status === "OPEN").length}</h3>
                            </div>
                        </div>

                        {/* In Progress */}
                        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-sm border border-gray-100 relative overflow-hidden flex items-center gap-3 sm:gap-4">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 sm:h-10 w-1.5 rounded-r-full bg-leafGreen"></div>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-emerald-50 rounded-lg sm:rounded-2xl flex items-center justify-center flex-shrink-0 text-leafGreen">
                                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">In Progress</p>
                                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-none">{userTickets.filter((t) => t.status === "IN_PROGRESS").length}</h3>
                            </div>
                        </div>

                        {/* Resolved */}
                        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-sm border border-gray-100 relative overflow-hidden flex items-center gap-3 sm:gap-4">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 sm:h-10 w-1.5 rounded-r-full bg-yellow-500"></div>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-yellow-50 rounded-lg sm:rounded-2xl flex items-center justify-center flex-shrink-0 text-yellow-600">
                                <LifeBuoy className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Resolved</p>
                                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-none">{userTickets.filter((t) => t.status === "RESOLVED").length}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Tickets List - Responsive */}
                    <div className={!isLoadingTickets && filteredTickets.length > 0 ? "mb-6 sm:mb-8 bg-transparent" : "bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-100 overflow-hidden"}>
                        {isLoadingTickets ? (
                            <PrimaryLoader />
                        ) : filteredTickets.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                                {filteredTickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="bg-white p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border border-gray-100 shadow-sm cursor-pointer flex flex-col h-full hover:shadow-md transition-shadow duration-200"
                                        onClick={() => handleTicketClick(ticket.id)}
                                    >
                                        <div className="flex justify-between items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                                            <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-2 leading-snug flex-1 min-w-0">
                                                {ticket.title}
                                            </h3>
                                            <div className={`flex-shrink-0 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-bold ${getStatusColor(ticket.status)}`}>
                                                {ticket.status === "IN_PROGRESS" ? "In Progress" : ticket.status.charAt(0) + ticket.status.slice(1).toLowerCase()}
                                            </div>
                                        </div>

                                        <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3 flex-grow leading-relaxed">
                                            {ticket.description}
                                        </p>

                                        <div className="pt-3 sm:pt-4 border-t border-gray-50 flex flex-col gap-2 sm:gap-3 mt-auto">
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span className="flex items-center font-medium truncate">
                                                    <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                                                    <span className="truncate">{formatDate(ticket.created_at)}</span>
                                                </span>
                                                <span className="flex items-center font-medium bg-gray-50 px-2 py-0.5 sm:px-2 sm:py-1 rounded-lg text-xs ml-2">
                                                    {ticket.category}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                {ticket.related_type && (
                                                    <span className="text-xs text-gray-400 capitalize truncate max-w-[60%]">
                                                        {ticket.related_type.toLowerCase()}
                                                    </span>
                                                )}
                                                <span className="text-primary text-xs sm:text-sm font-semibold ml-auto">
                                                    View Details →
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 sm:py-8 md:py-10 lg:py-16">
                                <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 text-gray-300 mx-auto mb-2 sm:mb-3 md:mb-4" />
                                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-1 sm:mb-2">No tickets found</h3>
                                <p className="text-gray-600 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 md:mb-6 max-w-xs sm:max-w-sm mx-auto px-2">
                                    {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                                        ? "Try adjusting your filters"
                                        : "You haven't created any support tickets yet"}
                                </p>
                                {!searchTerm && statusFilter === "all" && categoryFilter === "all" && (
                                    <button
                                        onClick={handleCreateNewTicket}
                                        className="inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3 bg-primary text-white rounded-lg sm:rounded-xl transition-all duration-200 font-semibold text-xs sm:text-sm md:text-base"
                                    >
                                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2" />
                                        Create Your First Ticket
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </main>

                {/* Create Ticket Modal - Responsive */}
                {currentView === "create" &&
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-3 md:p-4">
                        <div className="bg-white rounded-lg sm:rounded-xl w-full max-w-md sm:max-w-lg md:max-w-2xl mx-auto shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh]">
                            {/* Header - Responsive */}
                            <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-lightGreen sticky top-0 bg-lightGreen rounded-t-lg sm:rounded-t-xl z-10">
                                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-forestGreen truncate">
                                    Create New Support Ticket
                                </h3>
                                <button
                                    onClick={handleCancelCreate}
                                    className="text-forestGreen p-1 rounded-lg flex-shrink-0"
                                >
                                    <X size={18} className="sm:w-5 sm:h-5" />
                                </button>
                            </div>

                            {/* Create Ticket Form - Responsive */}
                            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
                                <form onSubmit={handleCreateTicketSubmit} id="supportTicketForm" className="space-y-3 sm:space-y-4">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                            Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                            placeholder="Briefly describe your issue"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                                Category <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                required
                                            >
                                                <option value="Technical">Technical Problem</option>
                                                <option value="Content">Content Issue</option>
                                                <option value="Billing">Billing Problem</option>
                                                <option value="Access">Access Issue</option>
                                                <option value="Achievement">Achievement Issue</option>
                                                <option value="Communication">Communication Issue</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                                Related To
                                            </label>
                                            <select
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                                value={relatedType}
                                                onChange={(e) => setRelatedType(e.target.value)}
                                            >
                                                <option value="">None</option>
                                                <option value="partner">Partner</option>
                                                <option value="user_auth">User Account</option>
                                                <option value="enrollment">Enrollment</option>
                                                <option value="course">Course</option>
                                                <option value="daily-challenge">Daily Challenge</option>
                                                <option value="challenge-quest">Challenge Quest</option>
                                                <option value="contest">Contest</option>
                                                <option value="cheatsheet">Cheatsheet</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                            Description <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none min-h-[100px] sm:min-h-[120px]"
                                            placeholder="Please describe your issue in detail..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {/* File Attachments - Responsive */}
                                    <div className="mb-4 sm:mb-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700">
                                                Attachments
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => ticketFileInputRef.current?.click()}
                                                className="text-xs sm:text-sm text-primary font-medium flex items-center"
                                            >
                                                <Paperclip className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                Add Files
                                            </button>
                                            <input
                                                type="file"
                                                ref={ticketFileInputRef}
                                                onChange={handleTicketFileChange}
                                                className="hidden"
                                                multiple
                                            />
                                        </div>

                                        {ticketAttachments.length > 0 && (
                                            <div className="bg-gray-50 p-2 sm:p-3 rounded-md border border-gray-200">
                                                <div className="text-xs sm:text-sm text-gray-500 mb-2">
                                                    {ticketAttachments.length} file(s) selected
                                                </div>
                                                <div className="space-y-2">
                                                    {ticketAttachments.map((file, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center justify-between bg-white p-2 sm:p-3 rounded border border-gray-200"
                                                        >
                                                            <div className="flex items-center overflow-hidden flex-1 min-w-0">
                                                                {file.preview ? (
                                                                    <img
                                                                        src={file.preview || "/placeholder.png"}
                                                                        alt="Preview"
                                                                        className="w-6 h-6 sm:w-8 sm:h-8 object-cover rounded border border-gray-200 flex-shrink-0"
                                                                    />
                                                                ) : (
                                                                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                                                                )}
                                                                <div className="ml-2 sm:ml-3 overflow-hidden">
                                                                    <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                                                        {file.name}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {formatFileSize(file.size)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveTicketFile(index)}
                                                                className="text-gray-400 ml-2 flex-shrink-0"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* Footer Buttons - Responsive */}
                            <div className="flex flex-row gap-2 sm:gap-3 p-3 sm:p-4 md:p-6 border-t border-gray-200 bg-white sticky bottom-0 rounded-b-lg sm:rounded-b-xl">
                                <button
                                    type="button"
                                    onClick={handleCancelCreate}
                                    className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-xs sm:text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="supportTicketForm"
                                    disabled={isCreatingTicket}
                                    className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 bg-primary hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCreatingTicket ? (
                                        <>
                                            <RefreshCw size={14} className="animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            Create Ticket
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                }
            </div>
        )
    }

    // Ticket Detail View
    return (
        <div className="min-h-screen bg-white">
            <main className={`container mx-auto ${isStandalone ? 'px-4 sm:px-6 lg:px-8 py-4' : 'px-4 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-4 md:py-5 lg:py-8'}`}>
                {/* Header - Responsive */}
                <div className="mb-4 sm:mb-4 md:mb-6 lg:mb-8">
                    <button
                        onClick={handleBackToList}
                        className="mb-2 sm:mb-2 md:mb-3 lg:mb-4 text-primary flex items-center text-xs sm:text-xs md:text-sm lg:text-sm font-semibold"
                    >
                        <ChevronLeft className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4 mr-1" />
                        Back to all tickets
                    </button>

                    {ticketDetails?.ticket && (
                        <div className="bg-secondaryForestGreen rounded-lg sm:rounded-lg md:rounded-xl lg:rounded-2xl p-4 sm:p-4 md:p-5 lg:p-8 text-white shadow-lg relative overflow-hidden">
                            {/* Decorative Pattern Overlay */}
                            <div
                                className="absolute inset-0 opacity-100 bg-cover bg-center"
                                style={{ backgroundImage: 'url("/assets/Rectangle 34627103.png")' }}
                            ></div>
                            <div className="absolute -right-4 -top-4 sm:-right-4 sm:-top-4 md:-right-6 md:-top-6 lg:-right-10 lg:-top-10 w-16 h-16 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-40 lg:h-40 bg-white opacity-5 rounded-full"></div>

                            <div className="relative z-10">
                                <div className="flex flex-col sm:flex-col md:flex-row lg:flex-row md:justify-between lg:justify-between md:items-start lg:items-start gap-2 sm:gap-2 md:gap-3 lg:gap-3">
                                    <div className="flex-1">
                                        <h1 className="text-sm sm:text-sm md:text-base lg:text-xl xl:text-2xl font-bold mb-1 sm:mb-1 md:mb-2 lg:mb-2 line-clamp-2">
                                            {ticketDetails.ticket.title}
                                        </h1>
                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-1.5 md:gap-2 lg:gap-2 text-xs sm:text-xs md:text-xs lg:text-xs">
                                            <span className="capitalize font-semibold bg-white/10 px-1.5 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 lg:px-2 lg:py-1 rounded-md sm:rounded-md md:rounded-md lg:rounded-md backdrop-blur-sm">
                                                {ticketDetails.ticket.category}
                                            </span>
                                            {ticketDetails.ticket.related_type && (
                                                <span className="capitalize font-medium text-emerald-100 text-xs sm:text-xs truncate">
                                                    {ticketDetails.ticket.related_type} - {ticketDetails.ticket.RelatedDetails?.title}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex sm:flex-row md:flex-col lg:flex-col items-center justify-between sm:justify-between md:items-end lg:items-end gap-2 sm:gap-2 md:gap-2 lg:gap-2 mt-2 sm:mt-2 md:mt-0 lg:mt-0">
                                        <span
                                            className={`text-xs sm:text-xs px-2 py-1 sm:px-2 sm:py-1 md:px-3 md:py-1.5 lg:px-3 lg:py-1.5 rounded-lg sm:rounded-lg md:rounded-xl lg:rounded-xl font-semibold bg-white/10 backdrop-blur-sm`}
                                        >
                                            {ticketDetails.ticket.status.replace("_", " ")}
                                        </span>
                                        <div className="flex items-center text-xs sm:text-xs text-emerald-100 font-medium">
                                            <Clock className="w-3 h-3 sm:w-3 sm:h-3 mr-1" />
                                            <span className="hidden sm:inline md:inline lg:inline">{formatDate(ticketDetails.ticket.created_at)}</span>
                                            <span className="sm:hidden md:hidden lg:hidden">{formatDateOnly(ticketDetails.ticket.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Ticket Detail Content */}
                {isLoadingTicketDetails ? (
                    <div className="flex justify-center items-center h-32 sm:h-32 md:h-40 lg:h-56 bg-white rounded-lg sm:rounded-lg md:rounded-xl lg:rounded-xl shadow-lg">
                        <PrimaryLoader />
                    </div>
                ) : ticketDetails?.ticket ? (
                    <div className="bg-white rounded-lg sm:rounded-lg md:rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-4 md:p-5 lg:p-8">
                        {/* Timeline Section - Hidden on mobile, shown on tablet+ */}
                        <div className="hidden sm:hidden md:block lg:block relative pb-4 md:pb-6 lg:pb-8">
                            {/* Vertical line */}
                            <div className="absolute left-3 md:left-3 lg:left-1/2 w-0.5 h-full bg-gray-200 transform lg:-translate-x-1/2"></div>

                            {/* Ticket creation item */}
                            <div className="relative mb-4 md:mb-4 lg:mb-6 xl:mb-8">
                                <div className="flex flex-col lg:flex-row xl:flex-row lg:justify-between xl:justify-between lg:items-start xl:items-start gap-3 md:gap-3 lg:gap-4 xl:gap-4">
                                    <div className="w-full lg:w-1/2 xl:w-1/2 lg:pr-4 xl:pr-6 lg:text-right xl:text-right order-2 lg:order-1">
                                        <div className="inline-block px-2 py-1 md:px-2 md:py-1 lg:px-3 lg:py-1.5 xl:px-4 xl:py-2 bg-lightGreen text-secondaryForestGreen rounded-lg sm:rounded-lg md:rounded-lg lg:rounded-xl xl:rounded-xl text-xs md:text-xs lg:text-sm xl:text-sm font-semibold border border-emerald-100">
                                            {formatDateOnly(ticketDetails.ticket?.created_at)}
                                        </div>
                                    </div>
                                    <div className="w-full lg:w-1/2 xl:w-1/2 lg:pl-4 xl:pl-6 order-1 lg:order-2">
                                        <div className="bg-white p-3 md:p-3 lg:p-4 rounded-lg sm:rounded-lg md:rounded-lg lg:rounded-xl shadow-sm border border-gray-200">
                                            <div className="flex flex-col md:flex-row lg:flex-row xl:flex-row md:justify-between lg:justify-between xl:justify-between md:items-center lg:items-center xl:items-center mb-1.5 md:mb-1.5 lg:mb-2 xl:mb-2 gap-1.5">
                                                <h3 className="font-bold text-gray-800 flex items-center text-sm md:text-sm lg:text-base xl:text-base">
                                                    <User className="w-3 h-3 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 mr-1 md:mr-1 lg:mr-1.5 text-primary" />
                                                    Ticket Created
                                                </h3>
                                                <span className="text-xs md:text-xs lg:text-sm xl:text-sm text-gray-500 font-medium">
                                                    {formatTimeOnly(ticketDetails.ticket?.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-gray-900 whitespace-pre-wrap text-sm md:text-sm lg:text-base xl:text-base font-medium leading-relaxed">
                                                {ticketDetails.ticket?.title}
                                            </p>

                                            {ticketDetails.ticket?.SupportAttachments?.length > 0 && (
                                                <div className="mt-2 md:mt-2 lg:mt-3 xl:mt-3 pt-2 border-t border-gray-100">
                                                    <h4 className="text-xs md:text-xs lg:text-sm xl:text-sm font-semibold text-gray-700 mb-1.5">Attachments:</h4>
                                                    <div className="flex flex-col gap-2 md:flex-row lg:flex-row xl:flex-row md:flex-wrap lg:flex-wrap xl:flex-wrap">
                                                        {ticketDetails.ticket.SupportAttachments.map((attachment, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-2 md:p-2 lg:p-2.5 hover:border-gray-300 transition-colors max-w-full"
                                                            >
                                                                {getFileIcon(attachment)}
                                                                <div className="ml-2 md:ml-2 lg:ml-3 flex-1 min-w-0">
                                                                    <div className="text-xs md:text-xs lg:text-sm xl:text-sm font-medium text-gray-700 truncate">
                                                                        {attachment.file_url.split("/").pop()}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => downloadFile(attachment.file_url)}
                                                                        className="text-xs text-primary flex items-center cursor-pointer font-medium mt-0.5"
                                                                    >
                                                                        <Download className="h-3 w-3 md:h-3 md:w-3 lg:h-3.5 lg:w-3.5 mr-1" />
                                                                        Download
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-4 md:top-4 lg:top-6 left-3 lg:left-1/2 w-2.5 h-2.5 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 xl:w-4 xl:h-4 bg-primary rounded-full transform lg:-translate-x-1/2 border-2 border-white shadow-lg"></div>
                            </div>

                            {/* Timeline items */}
                            {(() => {
                                const allReplies = ticketDetails.ticket?.SupportReplies || []
                                const allResolutionLogs = ticketDetails.ticket?.SupportResolutionLog || []

                                const timelineItems = [
                                    ...allReplies.map((reply) => ({
                                        type: "reply",
                                        isUser: reply.user_id === userId,
                                        timestamp: reply.created_at,
                                        data: reply,
                                    })),
                                    ...allResolutionLogs.map((log) => ({
                                        type: "resolution",
                                        timestamp: log.resolved_at,
                                        data: log,
                                    })),
                                ]

                                timelineItems.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

                                if (timelineItems.length === 0) return null

                                const groupedTimelineItems = []
                                let currentGroup = null

                                for (let i = 0; i < timelineItems.length; i++) {
                                    const item = timelineItems[i]

                                    if (item.type === "resolution") {
                                        if (currentGroup) {
                                            groupedTimelineItems.push(currentGroup)
                                            currentGroup = null
                                        }

                                        groupedTimelineItems.push({
                                            type: "resolution",
                                            timestamp: item.timestamp,
                                            data: item.data,
                                        })
                                    } else {
                                        if (!currentGroup || currentGroup.type !== "reply" || currentGroup.isUser !== item.isUser) {
                                            if (currentGroup) {
                                                groupedTimelineItems.push(currentGroup)
                                            }

                                            currentGroup = {
                                                type: "reply",
                                                isUser: item.isUser,
                                                timestamp: item.timestamp,
                                                replies: [item.data],
                                            }
                                        } else {
                                            currentGroup.replies.push(item.data)
                                        }
                                    }
                                }

                                if (currentGroup) {
                                    groupedTimelineItems.push(currentGroup)
                                }

                                return groupedTimelineItems.map((item, itemIndex) => {
                                    const itemDate = formatDateOnly(item.timestamp)

                                    if (item.type === "resolution") {
                                        return (
                                            <div key={`resolution-${item.data.id}`} className="flex flex-col lg:flex-row xl:flex-row lg:justify-between xl:justify-between lg:items-start xl:items-start gap-2 md:gap-2 lg:gap-3 xl:gap-3 mb-3 md:mb-3 lg:mb-4 xl:mb-4">
                                                <div className="w-full lg:w-1/2 xl:w-1/2 lg:pr-4 xl:pr-6 order-1 lg:order-1">
                                                    <div className="bg-yellow-50 p-3 md:p-3 lg:p-4 rounded-lg sm:rounded-lg md:rounded-lg lg:rounded-xl shadow-sm border border-yellow-200">
                                                        <div className="flex flex-col md:flex-row lg:flex-row xl:flex-row md:justify-between lg:justify-between xl:justify-between md:items-center lg:items-center xl:items-center mb-1.5 md:mb-1.5 lg:mb-2 xl:mb-2 gap-1.5">
                                                            <h3 className="font-bold text-yellow-900 text-sm md:text-sm lg:text-base xl:text-base flex items-center">
                                                                <RefreshCw className="w-3 h-3 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 mr-1.5" />
                                                                Status Update: {item.data.status?.replace('_', ' ')}
                                                            </h3>
                                                            <span className="text-xs md:text-xs lg:text-sm xl:text-sm text-yellow-700/80 font-medium">{formatTimeOnly(item.data.resolved_at)}</span>
                                                        </div>
                                                        <p className="text-yellow-900/90 whitespace-pre-wrap text-sm md:text-sm lg:text-base xl:text-base leading-relaxed">{item.data.resolution_note}</p>
                                                    </div>
                                                </div>
                                                <div className="w-full lg:w-1/2 xl:w-1/2 lg:pl-4 xl:pl-6 lg:text-left xl:text-left order-2 lg:order-2">
                                                    <div className="inline-block px-2 py-0.5 md:px-2 md:py-0.5 lg:px-3 lg:py-1 bg-gray-100 text-gray-600 rounded-lg text-xs md:text-xs lg:text-sm xl:text-sm font-semibold border border-gray-200">
                                                        {itemDate}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    } else {
                                        return (
                                            <div key={`reply-group-${itemIndex}`} className="mb-4 md:mb-4 lg:mb-6 xl:mb-8">
                                                {item.replies.map((reply, replyIndex) => (
                                                    <div key={reply.id} className="relative mb-3 md:mb-3 lg:mb-4 xl:mb-5">
                                                        <div className="flex flex-col lg:flex-row xl:flex-row lg:justify-between xl:justify-between lg:items-start xl:items-start gap-3 md:gap-3 lg:gap-4 xl:gap-4">
                                                            {item.isUser ? (
                                                                <>
                                                                    <div className="w-full lg:w-1/2 xl:w-1/2 lg:pr-4 xl:pr-6 lg:text-right xl:text-right order-2 lg:order-1">
                                                                        <div className="inline-block px-2 py-1 md:px-2 md:py-1 lg:px-3 lg:py-1.5 xl:px-4 xl:py-2 bg-gray-100 text-gray-800 rounded-lg sm:rounded-lg md:rounded-lg lg:rounded-xl xl:rounded-xl text-xs md:text-xs lg:text-sm xl:text-sm font-semibold border border-gray-200">
                                                                            {itemDate}
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-full lg:w-1/2 xl:w-1/2 lg:pl-4 xl:pl-6 order-1 lg:order-2">
                                                                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3 md:p-3 lg:p-4 rounded-lg sm:rounded-lg md:rounded-lg lg:rounded-xl xl:rounded-xl shadow-sm border border-emerald-100">
                                                                            <div className="flex flex-col md:flex-row lg:flex-row xl:flex-row md:justify-between lg:justify-between xl:justify-between md:items-center lg:items-center xl:items-center mb-1.5 md:mb-1.5 lg:mb-2 xl:mb-2 gap-1.5">
                                                                                <h3 className="font-bold text-gray-800 flex items-center text-sm md:text-sm lg:text-base xl:text-base">
                                                                                    <User className="w-3 h-3 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 mr-1 md:mr-1 lg:mr-1.5 text-primary" />
                                                                                    You
                                                                                </h3>
                                                                                <span className="text-xs md:text-xs lg:text-sm xl:text-sm text-gray-500 font-medium">
                                                                                    {formatTimeOnly(reply.created_at)}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-gray-700 whitespace-pre-wrap text-sm md:text-sm lg:text-base xl:text-base leading-relaxed">{reply.message}</p>

                                                                            {reply.SupportAttachments?.length > 0 && (
                                                                                <div className="mt-2 md:mt-2 lg:mt-3 xl:mt-3 pt-2 border-t border-emerald-100">
                                                                                    <div className="flex flex-col gap-2 md:flex-row lg:flex-row xl:flex-row md:flex-wrap lg:flex-wrap xl:flex-wrap">
                                                                                        {reply.SupportAttachments.map((attachment, attachIndex) => (
                                                                                            <div
                                                                                                key={attachIndex}
                                                                                                className="flex items-center bg-white border border-emerald-100 rounded-lg p-2 md:p-2 lg:p-2.5 max-w-full"
                                                                                            >
                                                                                                {getFileIcon(attachment)}
                                                                                                <div className="ml-2 md:ml-2 lg:ml-3 flex-1 min-w-0">
                                                                                                    <div className="text-xs md:text-xs lg:text-sm xl:text-sm font-medium text-gray-700 truncate">
                                                                                                        {attachment.file_url.split("/").pop()}
                                                                                                    </div>
                                                                                                    <button
                                                                                                        onClick={() => downloadFile(attachment.file_url)}
                                                                                                        className="text-xs text-primary flex items-center cursor-pointer font-medium mt-0.5"
                                                                                                    >
                                                                                                        <Download className="h-3 w-3 md:h-3 md:w-3 lg:h-3.5 lg:w-3.5 mr-1" />
                                                                                                        Download
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="w-full lg:w-1/2 xl:w-1/2 lg:pr-4 xl:pr-6 order-1 lg:order-1">
                                                                        <div className="bg-lightGreen p-3 md:p-3 lg:p-4 rounded-lg sm:rounded-lg md:rounded-lg lg:rounded-xl xl:rounded-xl shadow-sm border border-emerald-100">
                                                                            <div className="flex flex-col md:flex-row lg:flex-row xl:flex-row md:justify-between lg:justify-between xl:justify-between md:items-center lg:items-center xl:items-center mb-1.5 md:mb-1.5 lg:mb-2 xl:mb-2 gap-1.5">
                                                                                <h3 className="font-bold text-gray-800 flex items-center text-sm md:text-sm lg:text-base xl:text-base">
                                                                                    <LifeBuoy className="w-3 h-3 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 mr-1 md:mr-1 lg:mr-1.5 text-secondaryForestGreen" />
                                                                                    Support Agent
                                                                                </h3>
                                                                                <span className="text-xs md:text-xs lg:text-sm xl:text-sm text-gray-500 font-medium">
                                                                                    {formatTimeOnly(reply.created_at)}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-gray-700 whitespace-pre-wrap text-sm md:text-sm lg:text-base xl:text-base leading-relaxed">{reply.message}</p>

                                                                            {reply.SupportAttachments?.length > 0 && (
                                                                                <div className="mt-2 md:mt-2 lg:mt-3 xl:mt-3 pt-2 border-t border-emerald-100">
                                                                                    <div className="flex flex-col gap-2 md:flex-row lg:flex-row xl:flex-row md:flex-wrap lg:flex-wrap xl:flex-wrap">
                                                                                        {reply.SupportAttachments.map((attachment, attachIndex) => (
                                                                                            <div
                                                                                                key={attachIndex}
                                                                                                className="flex items-center bg-white border border-emerald-100 rounded-lg p-2 md:p-2 lg:p-2.5 max-w-full"
                                                                                            >
                                                                                                {getFileIcon(attachment)}
                                                                                                <div className="ml-2 md:ml-2 lg:ml-3 flex-1 min-w-0">
                                                                                                    <div className="text-xs md:text-xs lg:text-sm xl:text-sm font-medium text-gray-700 truncate">
                                                                                                        {attachment.file_url.split("/").pop()}
                                                                                                    </div>
                                                                                                    <button
                                                                                                        onClick={() => downloadFile(attachment.file_url)}
                                                                                                        className="text-xs text-primary flex items-center cursor-pointer font-medium mt-0.5"
                                                                                                    >
                                                                                                        <Download className="h-3 w-3 md:h-3 md:w-3 lg:h-3.5 lg:w-3.5 mr-1" />
                                                                                                        Download
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="w-full lg:w-1/2 xl:w-1/2 lg:pl-4 xl:pl-6 lg:text-left xl:text-left order-2 lg:order-2">
                                                                        <div className="inline-block px-2 py-0.5 md:px-2 md:py-0.5 lg:px-3 lg:py-1 bg-gray-100 text-gray-600 rounded-lg text-xs md:text-xs lg:text-sm xl:text-sm font-semibold border border-gray-200">
                                                                            {itemDate}
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        {replyIndex === 0 && (
                                                            <div className={`absolute top-3 md:top-3 lg:top-4 xl:top-5 left-3 lg:left-1/2 w-2.5 h-2.5 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 xl:w-4 xl:h-4 rounded-full transform lg:-translate-x-1/2 border-2 border-white shadow-lg ${item.isUser ? "bg-primary" : "bg-secondaryForestGreen"}`}></div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    }
                                })
                            })()}
                        </div>

                        {/* Mobile and Tablet Chat View (sm and md) */}
                        <div className="block md:hidden lg:hidden">
                            <div className="space-y-3 sm:space-y-3 pb-4">
                                {/* Ticket creation message */}
                                <div className="flex justify-end">
                                    <div className="max-w-[90%] sm:max-w-[85%] bg-white p-3 sm:p-3 rounded-lg shadow border border-gray-200">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-semibold text-gray-800 text-sm sm:text-sm">Ticket Created</h3>
                                            <span className="text-xs sm:text-xs text-gray-500 ml-2">
                                                {formatDateOnly(ticketDetails.ticket?.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-gray-900 whitespace-pre-wrap text-sm sm:text-sm font-medium">
                                            {ticketDetails.ticket?.title}
                                        </p>

                                        {/* Ticket attachments */}
                                        {ticketDetails.ticket?.SupportAttachments?.length > 0 && (
                                            <div className="mt-2 sm:mt-2 pt-2 border-t border-gray-100">
                                                <h4 className="text-xs sm:text-xs font-medium text-gray-700 mb-1">
                                                    Attachments:
                                                </h4>
                                                <div className="flex flex-wrap gap-1 sm:gap-1">
                                                    {ticketDetails.ticket.SupportAttachments.map(
                                                        (attachment, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center bg-gray-50 border border-gray-200 rounded-md p-1 sm:p-1 text-xs sm:text-xs max-w-full"
                                                            >
                                                                {getFileIcon(attachment)}
                                                                <div className="ml-1 sm:ml-1 flex-1 min-w-0">
                                                                    <div className="font-medium text-gray-700 truncate">
                                                                        {attachment.file_url.split("/").pop()}
                                                                    </div>
                                                                    <a
                                                                        onClick={() => downloadFile(`${import.meta.env.VITE_BACKEND_MEDIA_URL}${attachment.file_url}`)}
                                                                        className="text-primary flex items-center cursor-pointer mt-0.5"
                                                                    >
                                                                        <Download className="h-3 w-3 sm:h-3 sm:w-3 mr-1" />
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

                                {/* Process and group timeline items for mobile/tablet */}
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
                                                    className="flex justify-start"
                                                >
                                                    <div className="max-w-[90%] sm:max-w-[85%] bg-yellow-50 p-3 sm:p-3 rounded-lg shadow-sm border border-yellow-200">
                                                        <div className="flex justify-between items-center mb-1 gap-2">
                                                            <h3 className="font-semibold text-yellow-900 text-sm sm:text-sm flex items-center">
                                                                <RefreshCw className="w-3 h-3 sm:w-3 sm:h-3 mr-1.5" />
                                                                Status: {item.data.status?.replace('_', ' ')}
                                                            </h3>
                                                            <span className="text-xs sm:text-xs text-yellow-700/80">
                                                                {formatTimeOnly(item.data.resolved_at)}
                                                            </span>
                                                        </div>
                                                        <p className="text-yellow-900/90 whitespace-pre-wrap text-sm sm:text-sm leading-relaxed">
                                                            {item.data.resolution_note}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div key={`reply-group-mobile-${itemIndex}`} className="space-y-2 sm:space-y-2">
                                                    {item.replies.map((reply, replyIndex) => {
                                                        const isUser = !item.isAdmin;
                                                        return (
                                                            <div
                                                                key={reply.id}
                                                                className={`flex ${!isUser ? "justify-start" : "justify-end"}`}
                                                            >
                                                                <div className={`max-w-[90%] sm:max-w-[85%] p-3 sm:p-3 rounded-lg shadow border ${isUser ? "bg-sand border-emerald-100" : "bg-lightGreen border-emerald-100"}`}>
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <h3 className="font-semibold text-gray-800 text-sm sm:text-sm">
                                                                            {item.isAdmin ? "Support Agent" : "You"}
                                                                        </h3>
                                                                        <span className="text-xs sm:text-xs text-gray-500 ml-2">
                                                                            {formatTimeOnly(reply.created_at)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-sm">
                                                                        {reply.message}
                                                                    </p>

                                                                    {/* Reply attachments */}
                                                                    {reply.SupportAttachments?.length > 0 && (
                                                                        <div className={`mt-2 sm:mt-2 pt-2 border-t ${isUser ? "border-emerald-100" : "border-emerald-100"}`}>
                                                                            <div className="flex flex-wrap gap-1 sm:gap-1">
                                                                                {reply.SupportAttachments.map(
                                                                                    (attachment, attachIndex) => (
                                                                                        <div
                                                                                            key={attachIndex}
                                                                                            className="flex items-center bg-white border border-gray-200 rounded-md p-1 sm:p-1 text-xs sm:text-xs max-w-full"
                                                                                        >
                                                                                            {getFileIcon(attachment)}
                                                                                            <div className="ml-1 sm:ml-1 flex-1 min-w-0">
                                                                                                <div className="font-medium text-gray-700 truncate">
                                                                                                    {attachment.file_url.split("/").pop()}
                                                                                                </div>
                                                                                                <a
                                                                                                    onClick={() => downloadFile(`${import.meta.env.VITE_BACKEND_MEDIA_URL}${attachment.file_url}`)}
                                                                                                    className="text-primary flex items-center cursor-pointer mt-0.5"
                                                                                                >
                                                                                                    <Download className="h-3 w-3 sm:h-3 sm:w-3 mr-1" />
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
                                                        )
                                                    })}
                                                </div>
                                            );
                                        }
                                    });
                                })()}
                            </div>
                        </div>

                        {/* Reply Form - Responsive */}
                        {ticketDetails.ticket?.status !== "CLOSED" && (
                            <div className="mt-4 sm:mt-4 md:mt-5 lg:mt-8 border-t border-gray-200 pt-4 sm:pt-4 md:pt-5 lg:pt-8">
                                <h2 className="text-sm sm:text-sm md:text-base lg:text-xl font-bold text-gray-900 mb-3 sm:mb-3 md:mb-4 lg:mb-6">Reply to Ticket</h2>
                                <form onSubmit={handleReplySubmit}>
                                    <div className="mb-3 sm:mb-3 md:mb-4 lg:mb-6">
                                        <label htmlFor="replyMessage" className="sr-only">
                                            Your Reply
                                        </label>
                                        <textarea
                                            id="replyMessage"
                                            rows={3}
                                            className="w-full px-3 sm:px-3 md:px-4 py-2 sm:py-2 md:py-2.5 lg:py-3 border-2 border-gray-200 rounded-lg sm:rounded-lg md:rounded-lg lg:rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-sm sm:text-sm md:text-sm"
                                            placeholder="Type your reply here..."
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                        />
                                    </div>

                                    {/* File attachments preview - Responsive */}
                                    {attachments.length > 0 && (
                                        <div className="mb-3 sm:mb-3 md:mb-4 lg:mb-6">
                                            <div className="flex flex-col gap-2 sm:gap-2 md:gap-2 md:flex-row lg:flex-row md:flex-wrap lg:flex-wrap">
                                                {attachments.map((file, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center bg-sand border-2 border-emerald-100 rounded-lg sm:rounded-lg md:rounded-lg lg:rounded-xl p-2.5 sm:p-2.5 md:p-3 transition-all duration-200 max-w-full"
                                                    >
                                                        {file.preview ? (
                                                            <img
                                                                src={file.preview || "/placeholder.png"}
                                                                alt="Preview"
                                                                className="w-6 h-6 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <FileText className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-500 flex-shrink-0" />
                                                        )}
                                                        <div className="ml-2 sm:ml-2 md:ml-3 lg:ml-3 flex-1 min-w-0">
                                                            <div className="text-xs sm:text-xs md:text-sm lg:text-sm font-semibold text-gray-700 truncate">{file.name}</div>
                                                            <div className="text-xs sm:text-xs text-gray-500">{formatFileSize(file.size)}</div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveFile(index)}
                                                            className="ml-1.5 sm:ml-1.5 md:ml-4 lg:ml-4 text-gray-400 flex-shrink-0"
                                                        >
                                                            <X className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-4 lg:h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Updated 2-column layout for mobile to tablet */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:flex lg:flex gap-3 sm:gap-3 md:gap-3 lg:gap-3">
                                        {/* Attach File Button - Takes left column */}
                                        <div className="sm:col-span-1">
                                            <button
                                                type="button"
                                                onClick={() => replyFileInputRef.current.click()}
                                                className="inline-flex items-center justify-center px-3 py-2 sm:px-3 sm:py-2 md:px-4 md:py-2.5 lg:px-4 lg:py-2.5 border-2 border-gray-300 rounded-lg text-xs sm:text-xs md:text-sm lg:text-sm font-semibold text-gray-700 bg-white shadow-sm hover:bg-gray-50 transition-colors w-full"
                                            >
                                                <Paperclip className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 lg:h-4 lg:w-4 mr-1 sm:mr-1 md:mr-2 lg:mr-2 flex-shrink-0" />
                                                <span className="truncate">Attach File</span>
                                            </button>
                                            <input
                                                type="file"
                                                ref={replyFileInputRef}
                                                onChange={handleReplyFileChange}
                                                className="hidden"
                                                multiple
                                            />
                                        </div>

                                        {/* Send Reply Button - Takes right column */}
                                        <div className="sm:col-span-1 md:w-auto lg:w-auto">
                                            <button
                                                type="submit"
                                                disabled={isReplying || (!replyMessage.trim() && attachments.length === 0)}
                                                className="inline-flex items-center justify-center px-3 py-2 sm:px-3 sm:py-2 md:px-4 md:py-2.5 lg:px-6 lg:py-3 bg-primary text-white rounded-lg font-semibold shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary w-full"
                                            >
                                                {isReplying ? (
                                                    <>
                                                        <RefreshCw className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 lg:h-4 lg:w-4 mr-1 sm:mr-1 md:mr-2 lg:mr-2 animate-spin flex-shrink-0" />
                                                        <span className="truncate">Sending...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 lg:h-4 lg:w-4 mr-1 sm:mr-1 md:mr-2 lg:mr-2 flex-shrink-0" />
                                                        <span className="truncate">Send Reply</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-6 sm:py-6 md:py-8 lg:py-16 bg-white rounded-lg sm:rounded-lg md:rounded-xl lg:rounded-xl shadow-lg">
                        <MessageSquare className="w-6 h-6 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-12 lg:h-12 xl:w-16 xl:h-16 text-gray-300 mx-auto mb-2 sm:mb-2 md:mb-3 lg:mb-4" />
                        <h3 className="text-sm sm:text-sm md:text-base lg:text-xl font-bold text-gray-900 mb-1 sm:mb-1 md:mb-2 lg:mb-2">Ticket not found</h3>
                        <p className="text-gray-600 text-xs sm:text-xs md:text-sm lg:text-base mb-3 sm:mb-3 md:mb-4 lg:mb-6">The requested ticket could not be loaded.</p>
                        <button
                            onClick={handleBackToList}
                            className="inline-flex items-center justify-center px-3 py-1.5 sm:px-3 sm:py-1.5 md:px-4 md:py-2 lg:px-6 lg:py-3 bg-primary text-white rounded-lg sm:rounded-lg md:rounded-lg lg:rounded-xl font-semibold shadow-lg text-xs sm:text-xs md:text-sm lg:text-base"
                        >
                            <ArrowLeft className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-1 md:mr-2 lg:mr-2" />
                            Back to Tickets
                        </button>
                    </div>
                )}
            </main>
        </div>
    )
}

export default SupportTicketsPage