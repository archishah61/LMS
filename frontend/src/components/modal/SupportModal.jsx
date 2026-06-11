import { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  LifeBuoy,
  ChevronLeft,
  MessageSquare,
  Clock,
  RefreshCw,
  Paperclip,
  Download,
  FileText
} from "lucide-react";
import PrimaryLoader from "../ui/PrimaryLoader";
import toast from "react-hot-toast";
import {
  useCreateSupportTicketMutation,
  useCreateSupportReplyMutation,
  useGetSupportTicketByIdQuery,
  useGetAllUserSupportTicketsQuery,
} from "../../services/Support/supportAPI";
import { getStudentToken } from "../../services/CookieService";
import { useSelector } from "react-redux";
import { useGetAccessibleAssignmentsQuery, useGetAccessibleModulesQuery, useGetAccessibleQuizzesQuery, useGetAccessibleSessionsQuery, useGetAccessibleTopicsQuery } from "../../services/progressTracking/newProgressTrackingApi";

const SupportModal = ({ isOpen, isCourseSupport = false, onClose, defaultCategory, relatedId, relatedName, defaultRelatedType }) => {
  const { access_token } = getStudentToken();
  const [activeTab, setActiveTab] = useState("new");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(defaultCategory || "Content");
  const [relatedType, setRelatedType] = useState(defaultRelatedType || "course")
  const [currentSession, setCurrentSession] = useState(null);
  const [currentModule, setCurrentModule] = useState(null);
  const [currentItem, setCurrentItem] = useState(null); // topic/quiz/assignment

  const [createTicket, { isLoading: isCreating }] = useCreateSupportTicketMutation();
  const user = useSelector((state) => state.user);

  const {
    data: tickets,
    isLoading: isLoadingTickets,
    refetch: refetchTickets,
  } = useGetAllUserSupportTicketsQuery({ access_token });

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [createReply, { isLoading: isReplying }] = useCreateSupportReplyMutation();

  const {
    data: ticketDetails,
    isLoading: isLoadingTicketDetails,
    refetch: refetchTicketDetails,
  } = useGetSupportTicketByIdQuery(
    { id: selectedTicket, access_token },
    { skip: !selectedTicket }
  );


  // For Support in Topic, Assignment, Quiz

  const { data: sessionData } = useGetAccessibleSessionsQuery({
    userId: Number(user.id),
    courseId: Number(relatedId),
    access_token
  }, { skip: !["topic", "quiz", "assignment"].includes(relatedType) || !relatedId });

  const { data: moduleData } = useGetAccessibleModulesQuery({
    userId: Number(user.id),
    courseId: Number(relatedId),
    sessionId: currentSession?.id,
    access_token
  }, { skip: !currentSession?.id });

  const { data: topicData } = useGetAccessibleTopicsQuery({
    userId: Number(user.id),
    courseId: Number(relatedId),
    sessionId: currentSession?.id,
    moduleId: currentModule?.id,
    access_token
  }, { skip: relatedType !== "topic" || !currentModule?.id });

  const { data: quizData } = useGetAccessibleQuizzesQuery({
    userId: Number(user.id),
    courseId: Number(relatedId),
    moduleId: currentModule?.id,
    access_token
  }, { skip: relatedType !== "quiz" || !currentModule?.id });

  const { data: assignmentData } = useGetAccessibleAssignmentsQuery({
    userId: Number(user.id),
    courseId: Number(relatedId),
    moduleId: currentModule?.id,
    access_token
  }, { skip: relatedType !== "assignment" || !currentModule?.id });

  // File attachment state variables
  const [attachments, setAttachments] = useState([]);
  const [ticketAttachments, setTicketAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const replyFileInputRef = useRef(null);

  // Filter tickets for this user
  const userTickets = tickets?.tickets?.filter((ticket) => ticket.user_id === user.id) || [];

  // Filter tickets related to this 
  const relatedTickets = relatedId || relatedType === 'partner'
    ? userTickets.filter((ticket) => (["topic", "quiz", "assignment"].includes(ticket.related_type) && isCourseSupport || ticket.related_type === relatedType))
    : userTickets;

  useEffect(() => {
    if (isOpen) {
      refetchTickets();
      if (selectedTicket) {
        refetchTicketDetails();
      }
    }
  }, [isOpen, refetchTickets, selectedTicket, refetchTicketDetails]);

  useEffect(() => {
    setRelatedType(defaultRelatedType);
    setCategory(defaultCategory);
  }, [defaultCategory, defaultRelatedType])

  // Reset form and attachments when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setAttachments([]);
      setTicketAttachments([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  };

  // Handle file input change for new ticket
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);

    // Filter valid files
    const validFiles = newFiles.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
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

    setTicketAttachments([...ticketAttachments, ...updatedAttachments]);
  };

  // Handle file input change for replies
  const handleReplyFileChange = (e) => {
    const newFiles = Array.from(e.target.files);

    // Filter valid files
    const validFiles = newFiles.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
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

  // Handle file removal for new ticket
  const handleRemoveTicketFile = (indexToRemove) => {
    const updatedAttachments = ticketAttachments.filter(
      (_, index) => index !== indexToRemove
    );
    setTicketAttachments(updatedAttachments);
  };

  // Handle file removal for replies
  const handleRemoveFile = (indexToRemove) => {
    const updatedAttachments = attachments.filter(
      (_, index) => index !== indexToRemove
    );
    setAttachments(updatedAttachments);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("user_id", user.id);
      formData.append("status", "OPEN");
      formData.append("related_type", relatedType);
      if (currentItem) {
        formData.append("related_id", currentItem.id);
      } else if (relatedId) {
        formData.append("related_id", relatedId);
      }

      // Append each file to FormData
      ticketAttachments.forEach((attachment) => {
        formData.append("supportFile", attachment.file);
      });

      await createTicket({ data: formData, access_token }).unwrap();

      toast.success("Support ticket created successfully!");
      setTitle("");
      setDescription("");
      setCategory("Content");
      setCurrentSession(null);
      setCurrentModule(null);
      setCurrentItem(null);
      setRelatedType(defaultRelatedType || "course")
      setTicketAttachments([]);
      refetchTickets();
      setActiveTab("existing");
    } catch (error) {
      const errorMessage = error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'Failed to delete role';
      toast.error(errorMessage);
    }
  };

  const handleTicketClick = (ticketId) => {
    setSelectedTicket(ticketId);
    setActiveTab("detail");
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
    setActiveTab("existing");
    setAttachments([]);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();

    if (!replyMessage.trim() && attachments.length === 0) {
      toast.error("Please enter a reply message or attach a file");
      return;
    }

    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append("ticket_id", selectedTicket);
      formData.append("user_id", user.id);
      formData.append("message", replyMessage);

      // Append each file to FormData
      attachments.forEach((attachment) => {
        formData.append("supportFile", attachment.file);
      });

      await createReply({ data: formData, access_token }).unwrap();

      toast.success("Reply sent successfully!");
      setReplyMessage("");
      setAttachments([]);
      refetchTicketDetails();
    } catch (error) {
      const errorMessage = error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'Failed to delete role';
      toast.error(errorMessage);
    }
  };

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get file icon based on file type
  const getFileIcon = (attachment) => {
    if (attachment.file_type?.startsWith("image/")) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg overflow-hidden w-full max-w-4xl mx-4 shadow-2xl flex flex-col h-[650px] max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-lightGreen border-b border-lightGreen sticky top-0 z-10">
          <h2 className="text-lg font-bold text-forestGreen">
            Support Center
          </h2>
          <button
            onClick={onClose}
            className="text-forestGreen/70 hover:text-forestGreen transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4">
          <div className="flex bg-gray-50 p-1 rounded-md border border-gray-100">
            <button
              className={`flex-1 py-1.5 text-xs font-medium rounded-sm transition-all duration-200 ${activeTab === "new"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
                }`}
              onClick={() => setActiveTab("new")}
            >
              New Ticket
            </button>
            <button
              className={`flex-1 py-1.5 text-xs font-medium rounded-sm transition-all duration-200 ${activeTab === "existing" || activeTab === "detail"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
                }`}
              onClick={() => {
                setActiveTab("existing");
                setSelectedTicket(null);
              }}
            >
              My Tickets
            </button>
          </div>
        </div>


        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {activeTab === "new" && (
            <form id="supportForm" onSubmit={handleSubmit} className="space-y-3">

              {relatedId && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Related {relatedType}
                  </label>
                  <input
                    type="text"
                    placeholder="Briefly describe your issue"
                    value={relatedName || `${relatedType} #${relatedId}`}
                    className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-0 focus:border-black"
                    disabled
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="Briefly describe your issue"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-0 focus:border-black"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-0 focus:border-black"
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
                </div>

                <div className="col-span-1 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Related To
                    </label>
                    <select
                      value={relatedType}
                      onChange={(e) => setRelatedType(e.target.value)}
                      disabled={!["course", "topic", "quiz", "assignment"].includes(defaultRelatedType)}
                      className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-0 focus:border-black"
                    >
                      <option value="">None</option>

                      {/* Show only course, topic, quiz, assignment if defaultRelatedType is one of them */}
                      {["course", "topic", "quiz", "assignment"].includes(defaultRelatedType) ? (
                        <>
                          <option value="course">Course</option>
                          <option value="topic">Topic</option>
                          <option value="quiz">Quiz</option>
                          <option value="assignment">Assignment</option>
                        </>
                      ) : (
                        /* Show only the specific defaultRelatedType for other cases */
                        defaultRelatedType && (
                          <option value={defaultRelatedType}>
                            {defaultRelatedType.split('-').map(word =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </option>
                        )
                      )}

                      {/* If no defaultRelatedType, show all options */}
                      {!defaultRelatedType && (
                        <>
                          <option value="course">Course</option>
                          <option value="topic">Topic</option>
                          <option value="quiz">Quiz</option>
                          <option value="assignment">Assignment</option>
                          <option value="daily-challenge">Daily Challenge</option>
                          <option value="challenge-quest">Challenge Quest</option>
                          <option value="contest">Contest</option>
                          <option value="cheatsheet">Cheatsheet</option>
                          <option value="partner">Partner</option>
                          <option value="user_auth">User Account</option>
                          <option value="enrollment">Enrollment</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>


              </div>

              {["topic", "quiz", "assignment"].includes(relatedType) && (<div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Session Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Select Session
                  </label>
                  <select
                    value={currentSession?.id || ""}
                    onChange={(e) => {
                      const selected = sessionData?.sessions?.find(s => s.id === Number(e.target.value));
                      setCurrentSession(selected);
                      setCurrentModule(null);
                      setCurrentItem(null);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-0 focus:border-black text-xs"
                  >
                    <option value="">-- Select Session --</option>
                    {sessionData?.sessions?.map((session) => (
                      <option key={session.id} value={session.id}>{session.title}</option>
                    ))}
                  </select>
                </div>

                {/* Module Dropdown */}
                {currentSession && <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Select Module
                  </label>
                  <select
                    value={currentModule?.id || ""}
                    onChange={(e) => {
                      const selected = moduleData?.modules?.find(m => m.id === Number(e.target.value));
                      setCurrentModule(selected);
                      setCurrentItem(null);
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-0 focus:border-black"
                  >
                    <option value="">-- Select Module --</option>
                    {moduleData?.modules?.map((module) => (
                      <option key={module.id} value={module.id}>{module.title}</option>
                    ))}
                  </select>
                </div>}

                {/* Related Item Dropdown */}
                {currentModule && <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {relatedType === "topic" ? "Select Topic" : relatedType === "quiz" ? "Select Quiz" : "Select Assignment"}
                  </label>
                  <select
                    value={currentItem?.id || ""}
                    onChange={(e) => {
                      let selected;
                      if (relatedType === "topic") {
                        selected = topicData?.topics?.find(t => t.id === Number(e.target.value));
                      } else if (relatedType === "quiz") {
                        selected = quizData?.quizzes?.find(q => q.id === Number(e.target.value));
                      } else {
                        selected = assignmentData?.assignments?.find(a => a.id === Number(e.target.value));
                      }
                      setCurrentItem(selected);
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-0 focus:border-black"
                  >
                    <option value="">-- Select {relatedType} --</option>
                    {(relatedType === "topic" ? topicData?.topics : relatedType === "quiz" ? quizData?.quizzes : assignmentData?.assignments)?.map((item) => (
                      <option key={item.id} value={item.id}>{item.title}</option>
                    ))}
                  </select>
                </div>}
              </div>)}

              {/* <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Related To
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={relatedType}
                    onChange={(e) => setRelatedType(e.target.value)}
                    disabled={!["course", "topic", "quiz", "assignment"].includes(defaultRelatedType)}
                  >
                    <option value="">None</option>

                    {["course", "topic", "quiz", "assignment"].includes(defaultRelatedType) ? (
                      <>
                        <option value="course">Course</option>
                        <option value="topic">Topic</option>
                        <option value="quiz">Quiz</option>
                        <option value="assignment">Assignment</option>
                      </>
                    ) : (
                      defaultRelatedType && (
                        <option value={defaultRelatedType}>
                          {defaultRelatedType.split('-').map(word =>
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </option>
                      )
                    )}

                    {!defaultRelatedType && (
                      <>
                        <option value="course">Course</option>
                        <option value="topic">Topic</option>
                        <option value="quiz">Quiz</option>
                        <option value="assignment">Assignment</option>
                        <option value="daily-challenge">Daily Challenge</option>
                        <option value="challenge-quest">Challenge Quest</option>
                        <option value="contest">Contest</option>
                        <option value="cheatsheet">Cheatsheet</option>
                        <option value="partner">Partner</option>
                        <option value="user_auth">User Account</option>
                        <option value="enrollment">Enrollment</option>
                      </>
                    )}
                  </select>
                </div>

                {["topic", "quiz", "assignment"].includes(relatedType) && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Session
                      </label>
                      <select
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        value={currentSession?.id || ""}
                        onChange={(e) => {
                          const selected = sessionData?.sessions?.find(s => s.id === Number(e.target.value));
                          setCurrentSession(selected);
                          setCurrentModule(null);
                          setCurrentItem(null);
                        }}
                      >
                        <option value="">-- Select Session --</option>
                        {sessionData?.sessions?.map((session) => (
                          <option key={session.id} value={session.id}>{session.title}</option>
                        ))}
                      </select>
                    </div>

                    {currentSession && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select Module
                        </label>
                        <select
                          className="w-full p-3 border border-gray-300 rounded-lg"
                          value={currentModule?.id || ""}
                          onChange={(e) => {
                            const selected = moduleData?.modules?.find(m => m.id === Number(e.target.value));
                            setCurrentModule(selected);
                            setCurrentItem(null);
                          }}
                        >
                          <option value="">-- Select Module --</option>
                          {moduleData?.modules?.map((module) => (
                            <option key={module.id} value={module.id}>{module.title}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {currentModule && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {relatedType === "topic" ? "Select Topic" : relatedType === "quiz" ? "Select Quiz" : "Select Assignment"}
                        </label>
                        <select
                          className="w-full p-3 border border-gray-300 rounded-lg"
                          value={currentItem?.id || ""}
                          onChange={(e) => {
                            let selected;
                            if (relatedType === "topic") {
                              selected = topicData?.topics?.find(t => t.id === Number(e.target.value));
                            } else if (relatedType === "quiz") {
                              selected = quizData?.quizzes?.find(q => q.id === Number(e.target.value));
                            } else {
                              selected = assignmentData?.assignments?.find(a => a.id === Number(e.target.value));
                            }
                            setCurrentItem(selected);
                          }}
                        >
                          <option value="">-- Select {relatedType} --</option>
                          {(relatedType === "topic" ? topicData?.topics : relatedType === "quiz" ? quizData?.quizzes : assignmentData?.assignments)?.map((item) => (
                            <option key={item.id} value={item.id}>{item.title}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div> */}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  placeholder="Please describe your issue in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-0 focus:border-black resize-none"
                  rows={3}
                />
              </div>

              {/* Attachments Section */}
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-700">
                    Attachments
                  </label>
                  <div className="flex flex-col items-end">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-medium text-primary hover:text-green-700 flex items-center transition-colors"
                    >
                      <Paperclip className="h-4 w-4 mr-1" />
                      Add Files
                    </button>
                    <div className="text-xs text-gray-500 mt-1">
                      Max 5 MB per file allowed
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                {ticketAttachments.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">
                      {ticketAttachments.length} file(s) selected
                    </div>
                    <div className="space-y-1">
                      {ticketAttachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                        >
                          <div className="flex items-center overflow-hidden">
                            {file.preview ? (
                              <img
                                src={file.preview}
                                alt="Preview"
                                className="w-8 h-8 object-cover rounded border border-gray-200"
                              />
                            ) : (
                              <MessageSquare className="w-5 h-5 text-gray-500" />
                            )}
                            <div className="ml-2 overflow-hidden">
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
                            onClick={() => handleRemoveTicketFile(index)}
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

            </form>
          )}

          {activeTab === "existing" && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-medium text-gray-800">
                  Your Support Tickets For This {relatedType}
                </h3>
                <button
                  onClick={() => refetchTickets()}
                  className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </button>
              </div>

              {isLoadingTickets ? (
                <div className="flex justify-center items-center h-40">
                  <PrimaryLoader />
                </div>
              ) : relatedTickets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                  {relatedTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="border border-gray-100 rounded-lg p-4 transition-all cursor-pointer bg-white flex flex-col justify-between group h-full"
                      onClick={() => handleTicketClick(ticket.id)}
                    >
                      <div className="mb-2">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-bold text-gray-900 text-sm line-clamp-1 flex-1">
                            {ticket.title}
                          </h4>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide whitespace-nowrap flex-shrink-0 ${getStatusColor(
                              ticket.status
                            )}`}
                          >
                            {ticket.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2 h-8">
                          {ticket.description}
                        </p>
                        <div className="text-xs text-gray-400 font-medium truncate">
                          <span className="capitalize">{ticket.category}</span> {ticket.related_type ? <span className="capitalize">{ticket.related_type}</span> : ''} {ticket.RelatedDetails?.title ? `- ${ticket.RelatedDetails.title}` : ''}
                        </div>
                      </div>

                      <div className="flex justify-end mt-auto pt-2">
                        <div className="flex items-center text-[10px] text-gray-400 font-medium">
                          <Clock className="w-3 h-3 mr-1.5" />
                          <span>{formatDate(ticket.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-1">
                    No tickets found
                  </h3>
                  <p className="text-gray-500">
                    You haven't created any support tickets yet
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "detail" && selectedTicket && (
            <div className="flex flex-col h-full bg-white relative">
              {/* Back Button */}
              <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
                <button
                  onClick={handleBackToList}
                  className="text-emerald-600 flex items-center text-sm font-medium hover:text-emerald-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back to tickets
                </button>
              </div>

              {/* Scrollable Content (Timeline + Reply Form) */}
              <div className="flex-1 overflow-y-auto p-5">

                {isLoadingTicketDetails ? (
                  <div className="flex justify-center items-center h-40">
                    <PrimaryLoader />
                  </div>
                ) : ticketDetails?.ticket ? (
                  <div className="relative max-w-4xl mx-auto">

                    {/* Central Timeline Line */}


                    <div className="space-y-6 relative pb-6">
                      {/* Vertical line */}
                      <div className="hidden md:block absolute left-1/2 top-4 bottom-0 w-0.5 bg-gray-200 transform -translate-x-1/2"></div>


                      {/* 1. Ticket Creation (Usually by User -> Right Side) */}
                      <TimelineItem
                        side="right"
                        title="Ticket Created"
                        date={ticketDetails.ticket.created_at}
                        content={ticketDetails.ticket.description}
                        attachments={ticketDetails.ticket.SupportAttachments}
                        isUser={true}
                        downloadFile={downloadFile}
                        getFileIcon={getFileIcon}
                        formatFileSize={formatFileSize}
                      />

                      {/* 2. Process Replies & Resolution Logs */}
                      {(() => {
                        const allReplies = ticketDetails.ticket?.SupportReplies || [];
                        const allResolutionLogs = ticketDetails.ticket?.SupportResolutionLog || [];

                        // Combine and sort
                        const timelineItems = [
                          ...allReplies.map((reply) => ({
                            type: "reply",
                            timestamp: reply.created_at,
                            data: reply,
                            isUser: reply.user_id === user.id,
                          })),
                          ...allResolutionLogs.map((log) => ({
                            type: "resolution",
                            timestamp: log.resolved_at,
                            data: log,
                          })),
                        ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                        return timelineItems.map((item, idx) => {
                          if (item.type === "resolution") {
                            // Resolution Log - Center or Neutral
                            return (
                              <TimelineItem
                                key={`res-${idx}`}
                                side="left" // Or center special style
                                title={`Status Updated`}
                                date={item.timestamp}
                                content={item.data.resolution_note}
                                isSystem={true}
                                downloadFile={downloadFile}
                                getFileIcon={getFileIcon}
                                formatFileSize={formatFileSize}
                              />
                            );
                          } else {
                            // Reply
                            const isUserReply = item.isUser;
                            // Design Choice: User on Right, Admin on Left to match "zigzag" or standard chat
                            // Image shows: "Ticket Created" (Right), "New ticket 3" (Left). 
                            // Assuming "New ticket 3" is Admin reply.

                            return (
                              <TimelineItem
                                key={`reply-${item.data.id}`}
                                side={isUserReply ? "right" : "left"}
                                title={isUserReply ? "You Replied" : "Support Agent"}
                                date={item.timestamp}
                                content={item.data.message}
                                attachments={item.data.SupportAttachments}
                                isUser={isUserReply}
                                downloadFile={downloadFile}
                                getFileIcon={getFileIcon}
                                formatFileSize={formatFileSize}
                              />
                            );
                          }
                        });
                      })()}
                    </div>

                    {/* Reply Section */}
                    {ticketDetails.ticket?.status !== "CLOSED" && (
                      <div className="mt-6 border-t border-gray-100 pt-6">
                        <h3 className="text-sm font-semibold text-gray-800 mb-4">Your Reply</h3>

                        <form onSubmit={handleReplySubmit} className="space-y-4" id="ticketReplyForm">
                          <div className="relative">
                            <textarea
                              className="w-full p-4 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-emerald-500 transition-all text-sm min-h-[120px] resize-none"
                              placeholder="Type your reply here..."
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                            />
                          </div>

                          {/* Attachments & Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <button
                                type="button"
                                onClick={() => replyFileInputRef.current?.click()}
                                className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                              >
                                <Paperclip className="w-4 h-4 mr-1.5" />
                                Add Files
                              </button>
                              <input
                                type="file"
                                ref={replyFileInputRef}
                                className="hidden"
                                multiple
                                onChange={handleReplyFileChange}
                              />
                              <div className="text-xs text-gray-500 mb-1">
                                Max 5 MB per file allowed
                              </div>

                              {attachments.length > 0 && (
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {attachments.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100 rounded-lg p-2">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        {file.preview ? (
                                          <img src={file.preview} alt="" className="w-6 h-6 object-cover rounded" />
                                        ) : (
                                          <FileText className="w-4 h-4 text-emerald-500" />
                                        )}
                                        <span className="text-xs text-gray-600 truncate max-w-[150px]">{file.name}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveFile(index)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="ml-4">
                              <button
                                type="submit"
                                disabled={isReplying || (!replyMessage.trim() && attachments.length === 0)}
                                className="inline-flex items-center px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg shadow-sm transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isReplying ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Reply
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
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-gray-900 font-medium mb-1">Ticket not found</h3>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {activeTab === "new" &&
          <div className="p-6 bg-white sticky bottom-0">


            <div className="flex justify-end pt-2">
              <button
                type="submit"
                form="supportForm"
                className="px-6 py-2 text-xs font-medium text-white bg-primary hover:bg-green-600 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Ticket"
                )}
              </button>
            </div>
          </div>}

      </div>
    </div>
  );
};

export default SupportModal;

const TimelineItem = ({
  side = "left",
  title,
  date,
  content,
  attachments = [],
  downloadFile,
  getFileIcon,
  formatFileSize,
  isUser = false,
  isSystem = false
}) => {
  // Format date
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  // Format time
  const formattedTime = new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const isRight = side === "right";

  return (
    <div className={`relative flex flex-col md:flex-row justify-between items-start md:gap-4 ${isRight ? 'items-end md:items-start' : 'items-start'}`}>
      {/* Axis Dot (Desktop Only) */}
      <div className="hidden md:block absolute left-1/2 top-6 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm transform -translate-x-1/2 z-10"></div>

      {/* Date displayed above bubble on mobile, or inside if preferred (Image shows inside/inline) */}
      {/* Actually image shows: Title [Date] inside the card. */}

      {/* Mobile Content Wrapper - Width auto/max-width on mobile */}
      <div className={`w-full md:w-1/2 ${isRight ? 'md:pl-8 flex justify-end' : 'md:pr-8 flex justify-start'} ${isRight ? 'order-1 md:order-2' : 'order-1 md:order-1'}`}>
        <div
          className={`
            relative max-w-[85%] md:max-w-full w-auto rounded-lg p-4 shadow-sm border
            ${isSystem
              ? 'bg-yellow-50 border-yellow-100'
              : 'bg-lightGreen border-emerald-100' // Keeping lightGreen for both, or white for Ticket Created if needed (handled by isUser check normally, but user requested lightGreen/yellowish)
            // Actually image shows White for Ticket Created (User?), Green for Agent, Yellow for Status.
            // Ticket Created is usually the first item.
            }
            ${title === "Ticket Created" ? "bg-white border-gray-100" : ""} 
            ${isRight ? 'rounded-tr-sm md:rounded-tl-none md:rounded-tr-2xl' : 'rounded-tl-sm md:rounded-tr-none md:rounded-tl-2xl'}
          `}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-1 gap-4">
            <span className={`text-xs font-bold ${isSystem ? 'text-yellow-800' : 'text-emerald-900'}`}>
              {title}
            </span>
            {/* Mobile Date/Time or Desktop Time */}
            <span className="text-[10px] text-gray-500 opacity-80 whitespace-nowrap">
              <span className="md:hidden mr-1">{formattedDate},</span> {formattedTime}
            </span>
          </div>

          {/* content */}
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </p>

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center p-2 bg-white/50 rounded border border-black/5 hover:bg-white transition-colors">
                  <div className="flex-shrink-0">
                    {getFileIcon(file)}
                  </div>
                  <div className="ml-2 min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {file.file_url ? file.file_url.split('/').pop() : file.name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {formatFileSize ? formatFileSize(file.file_size || 0) : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadFile(`${import.meta.env.VITE_BACKEND_MEDIA_URL}${file.file_url}`)}
                    className="ml-2 text-gray-500 hover:text-emerald-600 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Opposite Side Date (Desktop Only) */}
      <div className={`hidden md:block w-1/2 pt-3 ${isRight ? 'pr-8 text-right order-1' : 'pl-8 text-left order-2'}`}>
        <div className="inline-block px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-xs font-medium border border-gray-100">
          {formattedDate}
        </div>
      </div>

    </div>
  );
};
