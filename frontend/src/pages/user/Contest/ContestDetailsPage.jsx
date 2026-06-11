"use client"
import { useState, useEffect, useRef, forwardRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Trophy, Users, ArrowRight, HelpCircle, Code, DoorOpen, X, CheckCircle,
  ChevronRight, Clock, Calendar, Star, Target, Gift, Lock, PlayCircle,
  Medal, Coins, Menu, ChevronDown, MapPin
} from "lucide-react"
import { useGetContestByIdQuery } from "../../../services/Contest/contestAPI"
import { toast } from "react-hot-toast"
import { slugify } from "../../../utils/slugify"
import { getStudentToken } from "../../../services/CookieService"
import { useEnrollUserInContestMutation, useGetUserEnrollmentQuery } from "../../../services/Contest/userContestAPI"
import { useGetUserPointsByIdQuery } from "../../../services/Challenge/userChallenge"
import SupportModal from "../../../components/modal/SupportModal"
import { useAuthModal } from "../../../context/AuthModalContext"
import PrimaryLoader from "../../../components/ui/PrimaryLoader"
import RazorpayButton from "../../../components/razorpay/RazorpayButton"
import parse, { domToReact } from 'html-react-parser';

function Button({ children, variant = "primary", size = "md", className = "", onClick, disabled = false }) {
  const variants = {
    primary: "bg-primary text-white shadow-sm hover:bg-primary/90",
    secondary: "bg-white text-gray-900 border border-gray-200 hover:border-gray-300",
    outline: "bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50",
    ghost: "bg-transparent text-gray-700 border-0 hover:bg-gray-50",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm",
    md: "px-4 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base",
    lg: "px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg",
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-orange-100 text-orange-800",
    error: "bg-red-100 text-red-800",
    info: "bg-primary/10 text-primary",
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs sm:px-3 sm:py-1 sm:text-sm rounded-full font-medium transition-colors ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

const Card = forwardRef(function Card({ children, className = "", hover = false }, ref) {
  return (
    <div
      ref={ref}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-200 ${hover ? 'hover:shadow-md hover:border-gray-300' : ''} ${className}`}
    >
      {children}
    </div>
  )
})

function EnrollmentModal({ isOpen, onClose, contest, actionType, refetchUserEnrollmentData, userEnrollment, onEnrollmentSuccess }) {
  if (!isOpen) return null

  const { access_token } = getStudentToken();
  const [enrollUserInContest, { isLoading }] = useEnrollUserInContestMutation();
  const { refetch: refetchPoints } = useGetUserPointsByIdQuery(
    { access_token },
    { skip: !access_token }
  )

  const isAlreadyEnrolled = userEnrollment && userEnrollment.status === 'active';

  const handleConfirm = async () => {
    try {
      if (isAlreadyEnrolled) {
        toast.success("You are already enrolled in this contest!");
        onClose();
        return;
      }

      const res = await enrollUserInContest({
        contest_id: contest.id,
        access_token: access_token
      }).unwrap();

      await refetchPoints();

      const enrolledAt = new Date(res.userContest.enrolled_at);
      const now = new Date();
      const timeDiff = Math.abs(now - enrolledAt);
      const isNewEnrollment = timeDiff < 5000;

      if (isNewEnrollment) {
        toast.success(
          `Successfully ${actionType === "join" ? "joined" : "registered for"} the contest!`
        );
      } else {
        toast.success("You were already enrolled in this contest!");
      }

      onEnrollmentSuccess();
      onClose();
    } catch (error) {
      toast.error(error?.data?.message || "Enrollment failed. Please try again.");
      console.error("Enrollment error:", error);
    }
  };

  const handlePayment = (data) => {
    refetchUserEnrollmentData();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 md:p-8 relative shadow-2xl mx-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 p-2 rounded-lg hover:bg-gray-100"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="text-center pt-2">
          <div className="mb-4 sm:mb-5 md:mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-lightGreen rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-primary">
              <Trophy className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {isAlreadyEnrolled ? "Already Enrolled" : "Confirm Enrollment"}
            </h3>
            <p className="text-gray-600 text-sm sm:text-base px-4">
              {isAlreadyEnrolled
                ? "You are already enrolled in this contest!"
                : `Are you sure you want to ${actionType === "join" ? "join" : "register for"} this contest?`
              }
            </p>
          </div>

          <Card className="p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6">
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base line-clamp-2">{contest.title}</h4>
            <div className="space-y-2 sm:space-y-3">
              {contest.enroll_by === "free" ? (
                <div className="flex items-center justify-center text-green-600 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="font-medium">Free Entry</span>
                </div>
              ) : contest.enroll_by === "paid" ? (
                <div className="flex items-center justify-center text-primary text-sm sm:text-base">
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="font-medium">Registration Fee ₹{contest.enrollment_fee}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center text-primary text-sm sm:text-base">
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="font-medium">Use {contest.enrollment_fee} points</span>
                </div>
              )}
              {isAlreadyEnrolled && (
                <div className="flex items-center justify-center text-primary text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="font-medium">Already Enrolled</span>
                </div>
              )}
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1 text-sm sm:text-base border border-gray-200"
              size="sm"
            >
              {isAlreadyEnrolled ? "Close" : "Cancel"}
            </Button>

            {!isAlreadyEnrolled && (
              contest.enroll_by === "paid" ?
                (
                  <RazorpayButton onResult={handlePayment} detail={{ item: "contest", related_id: contest.id }} amount={contest.enrollment_fee} />
                )
                :
                (<Button
                  variant="primary"
                  onClick={handleConfirm}
                  className="flex-1 text-sm sm:text-base"
                  disabled={isLoading}
                  size="sm"
                >
                  {isLoading ? "Processing..." : contest.enroll_by === "free" ? "Confirm" : `Use ${contest.enrollment_fee} Points`}
                </Button>
                ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ContestDetails() {
  const location = useLocation()
  const navigate = useNavigate()
  const { id } = location.state || { id: 1 }
  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState("")
  const [showWinnerCelebration, setShowWinnerCelebration] = useState(false)
  const [hasShownCelebration, setHasShownCelebration] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [isSupportModalOpen, setSupportModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { openLogin } = useAuthModal();

  const overviewRef = useRef(null)
  const prizesRef = useRef(null)
  const rulesRef = useRef(null)
  const scheduleRef = useRef(null)
  const activitiesRef = useRef(null)

  const { data: contestsData, isLoading, error, refetch: refetchContestData } = useGetContestByIdQuery(id);

  const { access_token } = getStudentToken()
  const { data: enrollmentData, isLoading: enrollmentLoading, refetch: refetchUserEnrollmentData } = useGetUserEnrollmentQuery(
    { contest_id: id, access_token },
    { skip: !access_token, refetchOnMountOrArgChange: true }
  )

  const contest = contestsData?.contest

  useEffect(() => {
    if (enrollmentData && !hasShownCelebration) {
      const { userContest } = enrollmentData
      if (userContest?.is_winner === 1) {
        const timer = setTimeout(() => {
          setShowWinnerCelebration(true)
          setHasShownCelebration(true)
        }, 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [enrollmentData, hasShownCelebration])

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100
      const sections = [
        { id: 'overview', ref: overviewRef },
        { id: 'prizes', ref: prizesRef },
        { id: 'rules', ref: rulesRef },
        { id: 'schedule', ref: scheduleRef }
      ]
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        if (section.ref.current && section.ref.current.offsetTop <= scrollPosition) {
          setActiveTab(section.id)
          break
        }
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const processDescriptionWithTags = (html) => {
    if (!html) return null
    // Trim full-document wrappers
    if (/<!?DOCTYPE|<html/i.test(html)) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      if (bodyMatch?.[1]) html = bodyMatch[1]
      html = html.replace(/<head[\s\S]*?<\/head>/i, "")
    }

    const hasLists = /<(ul|ol)[^>]*>/i.test(html)

    const tagRegex = /#[^#\s]+#/g

    const occurrenceTracker = {}
    const isImageExt = (p) => /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(p || "")

    const createTagElement = (tagObj, key) => {
      if (!tagObj)
        return (
          <span key={key} className="text-gray-400">
            #missing-tag#
          </span>
        )
      const fileUrl = `${mediaBase}${tagObj.tag_file_path || "/placeholder.png"}`
      switch (tagObj.tag_file_type) {
        case "image":
          return (
            <img
              key={key}
              src={fileUrl || "/placeholder.svg"}
              alt={tagObj.tag}
              className={
                hasLists
                  ? "my-4 max-w-xs max-h-64 w-auto rounded-lg border object-contain shadow-sm block"
                  : "float-left mr-4 mb-4 max-w-xs max-h-64 w-auto rounded-lg border object-contain shadow-sm"
              }
            />
          )
        case "code":
          return (
            <div
              key={key}
              className="relative my-4 border rounded-xl overflow-hidden bg-gray-900 shadow not-prose clear-both"
            >
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tagObj.tag_file_path || "")
                  setCopiedKey(key)
                  setTimeout(() => setCopiedKey(null), 1500)
                }}
                className={`absolute top-2 right-2 text-[11px] px-2 py-1 rounded-md font-medium transition-all ${copiedKey === key ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-100 hover:bg-gray-600"
                  }`}
              >
                {copiedKey === key ? "Copied" : "Copy"}
              </button>
              <SyntaxHighlighter
                language={tagObj.code_language || "javascript"}
                style={dracula}
                customStyle={{ margin: 0, padding: "1rem", fontSize: "13px" }}
              >
                {tagObj.tag_file_path || ""}
              </SyntaxHighlighter>
            </div>
          )
        default:
          if (isImageExt(tagObj.tag_file_path)) {
            return (
              <img
                key={key}
                src={fileUrl || "/placeholder.svg"}
                alt={tagObj.tag}
                className={
                  hasLists
                    ? "my-4 max-w-xs max-h-64 w-auto rounded-lg border object-contain shadow-sm block"
                    : "float-left mr-4 mb-4 max-w-xs max-h-64 w-auto rounded-lg border object-contain shadow-sm"
                }
              />
            )
          }
          return (
            <button
              key={key}
              onClick={() => window.open(fileUrl, "_blank", "noopener")}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium transition-colors mr-2 mb-2"
            >
              View File
            </button>
          )
      }
    }

    // Add element-level styling so TinyMCE HTML (lists, headings, links, etc.) renders properly.
    const options = {
      replace: (node) => {
        // Style HTML element tags
        if (node.type === "tag") {
          const { name, children, attribs = {} } = node
          const commonText = "text-gray-800"
          if (name === "p") {
            return <p className={`mb-3 leading-relaxed ${commonText}`}>{domToReact(children, options)}</p>
          }
          if (name === "h1") {
            return <h1 className="mt-4 mb-3 text-2xl font-semibold text-gray-900">{domToReact(children, options)}</h1>
          }
          if (name === "h2") {
            return <h2 className="mt-4 mb-2 text-xl font-semibold text-gray-900">{domToReact(children, options)}</h2>
          }
          if (name === "h3") {
            return <h3 className="mt-3 mb-2 text-lg font-semibold text-gray-900">{domToReact(children, options)}</h3>
          }
          if (name === "ul") {
            return <ul className="my-3 list-disc pl-5 space-y-2">{domToReact(children, options)}</ul>
          }
          if (name === "ol") {
            return <ol className="my-3 list-decimal pl-5 space-y-2">{domToReact(children, options)}</ol>
          }
          if (name === "li") {
            return <li className={`${commonText}`}>{domToReact(children, options)}</li>
          }
          if (name === "a") {
            const href = attribs.href || "#"
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700"
              >
                {domToReact(children, options)}
              </a>
            )
          }
          if (name === "blockquote") {
            return (
              <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-3">
                {domToReact(children, options)}
              </blockquote>
            )
          }
          if (name === "pre") {
            return (
              <pre className="my-4 rounded-lg bg-gray-900 text-gray-100 p-4 overflow-auto text-xs">
                {domToReact(children, options)}
              </pre>
            )
          }
          if (name === "code") {
            return (
              <code className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800">{domToReact(children, options)}</code>
            )
          }
          if (name === "table") {
            return (
              <div className="my-4 overflow-auto">
                <table className="w-full border-collapse text-sm">{domToReact(children, options)}</table>
              </div>
            )
          }
          if (name === "th") {
            return (
              <th className="border border-gray-200 bg-gray-50 px-3 py-2 text-left font-medium text-gray-900">
                {domToReact(children, options)}
              </th>
            )
          }
          if (name === "td") {
            return (
              <td className="border border-gray-200 px-3 py-2 align-top text-gray-800">
                {domToReact(children, options)}
              </td>
            )
          }
          if (name === "img") {
            const src = attribs.src || "/placeholder.svg"
            const alt = attribs.alt || "image"
            return (
              <img
                src={src || "/placeholder.svg"}
                alt={alt}
                className={
                  hasLists
                    ? "my-4 max-w-xs max-h-64 w-auto rounded-lg border object-contain shadow-sm block"
                    : "float-left mr-4 mb-4 max-w-xs max-h-64 w-auto rounded-lg border object-contain shadow-sm"
                }
              />
            )
          }
        }

        // Existing tag token replacement against text nodes
        if (node.type !== "text") return undefined
        const text = node.data
        const matches = [...text.matchAll(tagRegex)]
        if (!matches.length) return undefined
        const parts = []
        let cursor = 0
        matches.forEach((m) => {
          const match = m[0]
          const offset = m.index
          if (offset > cursor) parts.push(text.slice(cursor, offset))
          occurrenceTracker[match] = (occurrenceTracker[match] || 0) + 1
          const list = []
          const tagObj = list[occurrenceTracker[match] - 1] || list[0]
          parts.push(createTagElement(tagObj, `${match}-${occurrenceTracker[match]}`) || match)
          cursor = offset + match.length
        })
        if (cursor < text.length) parts.push(text.slice(cursor))
        return <>{parts.map((p, i) => (typeof p === "string" ? <span key={i}>{p}</span> : p))}</>
      },
    }

    return parse(html, options)
  }

  const scrollToSection = (sectionId) => {
    const refs = {
      overview: overviewRef,
      prizes: prizesRef,
      rules: rulesRef,
      schedule: scheduleRef
    }
    const targetRef = refs[sectionId]
    if (targetRef.current) {
      const offsetTop = targetRef.current.offsetTop - 80
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      })
    }
    setActiveTab(sectionId)
    setIsMobileMenuOpen(false)
  }

  const checkLoginAndProceed = (callback) => {
    if (!access_token) {
      toast.error("Login required to enroll in contest")
      openLogin();
      return false
    }
    callback()
    return true
  }

  const handleEnrollmentSuccess = () => {
    refetchUserEnrollmentData();
    refetchContestData();
  }

  const handleJoinNow = () => {
    if (!isEnrollmentOpen) {
      toast.error("Enrollment period is closed for this contest.")
      return
    }
    if (isMaxParticipantsReached) {
      toast.error("Max participants reached.")
      return
    }
    if (contestStatus === "ended") {
      toast.error("This contest has already ended.")
      return
    }
    checkLoginAndProceed(() => {
      setModalAction("join")
      setShowModal(true)
    })
  }

  const handleRegisterNow = () => {
    if (!isEnrollmentOpen) {
      toast.error("Enrollment period is closed for this contest.")
      return
    }
    if (isMaxParticipantsReached) {
      toast.error("Max participants reached.")
      return
    }
    if (contestStatus === "ended") {
      toast.error("This contest has already ended.")
      return
    }
    checkLoginAndProceed(() => {
      setModalAction("register")
      setShowModal(true)
    })
  }

  const handleActivityClick = async (activity) => {
    if (!isUserEnrolled) {
      toast.error("You need to be enrolled in this contest to access activities")
      return
    }
    checkLoginAndProceed(async () => {
      if (activity.type === "quiz") {
        navigate(`/contests/${slugify(contest.title)}/quiz/${slugify(activity.title)}`, {
          state: { activity_id: activity.id, contest_id: contest.id },
        })
      } else if (activity.type === "coding") {
        navigate(`/contests/${slugify(contest.title)}/coding/${slugify(activity.title)}`, {
          state: { activity_id: activity.id, contest_id: contest.id },
        })
      }
    })
  }

  const handleShowLeaderboard = async () => {
    navigate(`/contests/${slugify(contest.title)}/leaderboard`, {
      state: { contest_id: contest.id },
    })
  }

  const handleScrollToActivities = () => {
    if (!activitiesRef.current) return
    const headerOffset = 96
    const targetY = activitiesRef.current.getBoundingClientRect().top + window.scrollY - headerOffset
    window.scrollTo({ top: Math.max(targetY, 0), behavior: "smooth" })
  }

  const getContestStatus = () => {
    const now = new Date().getTime()
    const startTime = new Date(contest?.start_time).getTime()
    const endTime = new Date(contest?.end_time).getTime()
    if (now < startTime) return "not_started"
    if (now >= startTime && now < endTime) return "active"
    return "ended"
  }

  const [contestStatus, setContestStatus] = useState(null)

  useEffect(() => {
    setContestStatus(getContestStatus())
  }, [contest, refetchContestData])

  const isUserEnrolled = enrollmentData?.userContest && enrollmentData.userContest.status === 'active';

  const getTypeIcon = (type) => {
    switch (type) {
      case "quiz": return <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
      case "coding": return <Code className="w-4 h-4 sm:w-5 sm:h-5" />
      case "escape_room": return <DoorOpen className="w-4 h-4 sm:w-5 sm:h-5" />
      default: return <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
    }
  }

  const renderActionButton = () => {
    if (contestStatus === "ended") {
      return (
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4">
            <Badge variant="error" className="text-xs sm:text-sm">Contest Ended</Badge>
            <span className="text-xs sm:text-sm md:text-base text-gray-500">
              {contest.total_participants}{contest.max_participants && "/"}{contest.max_participants} participants joined
            </span>
          </div>
        </div>
      )
    }

    if (contestStatus === "not_started") {
      if (isUserEnrolled) {
        return (
          <div className="mb-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              <Badge variant="success" className="text-xs sm:text-sm w-fit">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                Registered
              </Badge>
              <Countdown targetDate={contest?.start_time} onComplete={refetchContestData} />
            </div>
          </div>
        )
      } else if (Boolean(contest.is_limites_participants) && contest.total_participants == contest.max_participants) {
        return (
          <div className="mb-4">
            <Badge variant="warning" className="text-xs sm:text-sm">Max participants reached</Badge>
          </div>
        )
      } else {
        return (
          <div className="mb-4">
            <Button size="sm" onClick={handleRegisterNow} className="w-full sm:w-auto text-xs sm:text-sm font-semibold bg-primary border-none shadow-lg shadow-primary/20">
              Register Now
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
            </Button>
          </div>
        )
      }
    }

    if (contestStatus === "active") {
      if (isUserEnrolled) {
        return (
          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <Badge variant="success" className="bg-primary/10 text-primary border border-primary/20 text-xs sm:text-sm">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                Enrolled
              </Badge>
              {contest?.end_time && (
                <span className="text-xs sm:text-sm text-gray-500">
                  Result: {new Date(contest.end_time).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        )
      } else if (Boolean(contest.is_limites_participants) && contest.total_participants == contest.max_participants) {
        return (
          <div className="mb-4">
            <Badge variant="warning" className="text-xs sm:text-sm">Max participants reached</Badge>
          </div>
        )
      } else {
        return (
          <div className="mb-4">
            <Button size="sm" onClick={handleJoinNow} className="w-full sm:w-auto text-xs sm:text-sm font-semibold bg-primary border-none shadow-lg shadow-primary/20">
              Join Now
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
            </Button>
          </div>
        )
      }
    }
  }

  if (isLoading || enrollmentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PrimaryLoader />
      </div>
    )
  }

  if (error || !contest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm sm:text-base md:text-lg text-red-600 mb-4">Failed to load contest details</p>
          <Button variant="secondary" onClick={() => window.history.back()} size="sm">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const isLive = contestStatus === "active" && !isUserEnrolled;
  const nowMs = Date.now();
  const enrollmentStartMs = contest?.enrollment_start ? Date.parse(contest.enrollment_start) : null;
  const enrollmentEndMs = contest?.enrollment_end ? Date.parse(contest.enrollment_end) : null;
  const hasEnrollmentStarted = !Number.isFinite(enrollmentStartMs) || nowMs >= enrollmentStartMs;
  const isEnrollmentClosed = Number.isFinite(enrollmentEndMs) && nowMs > enrollmentEndMs;
  const isEnrollmentOpen = hasEnrollmentStarted && !isEnrollmentClosed;
  const isMaxParticipantsReached =
    Boolean(contest?.is_limites_participants) &&
    Number.isFinite(Number(contest?.max_participants)) &&
    Number(contest?.max_participants) > 0 &&
    Number(contest?.total_participants) >= Number(contest?.max_participants);
  const canRegisterNow = !isUserEnrolled && isEnrollmentOpen && contestStatus !== "ended" && !isMaxParticipantsReached;
  const totalParticipants = Number(contest?.total_participants) || 0;
  const hasParticipantLimit =
    Boolean(contest?.is_limites_participants) &&
    Number.isFinite(Number(contest?.max_participants)) &&
    Number(contest?.max_participants) > 0;
  const maxParticipants = hasParticipantLimit ? Number(contest.max_participants) : null;
  const remainingParticipants = hasParticipantLimit ? Math.max(maxParticipants - totalParticipants, 0) : null;
  const contestMode = (contest?.mode || "solo").toLowerCase();
  const modeLabel = contestMode === "team" ? "Team" : contestMode === "mixed" ? "Mixed" : "Solo";
  const registeredUnit = contestMode === "team" ? "Teams" : contestMode === "mixed" ? "Entries" : "Participants";
  const registrationCountText = hasParticipantLimit
    ? `${totalParticipants}/${maxParticipants} ${registeredUnit}`
    : `${totalParticipants} ${registeredUnit}`;
  const registrationMetaText = hasParticipantLimit
    ? `${remainingParticipants} slot${remainingParticipants === 1 ? "" : "s"} left`
    : "No participation cap";
  const firstPlacePrize = (contest?.prizes || []).find(
    (prize) => Number(prize?.position_start) === 1
  );
  const firstPlacePrizeText = firstPlacePrize
    ? `${Number(firstPlacePrize.prize_points) || 0} points`
    : "Not announced";
  const totalPrizePoints = (contest?.prizes || []).reduce(
    (sum, prize) => sum + (Number(prize?.prize_points) || 0),
    0
  );
  const totalPrizeText = totalPrizePoints > 0
    ? `${totalPrizePoints.toLocaleString("en-IN")} points`
    : firstPlacePrizeText;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
        {/* Main Grid - Responsive layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - 2/3 width on desktop, full width on mobile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Section - Mobile Optimized */}
            <Card className="p-5 sm:p-6 md:p-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-3 sm:mb-4">
                    {contest.title}
                  </h1>
                  {/* <p className="text-gray-700 text-sm sm:text-base lg:text-lg mb-6">{contest.description}</p> */}

                  {/* Mobile Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 lg:hidden mb-6">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-xs text-gray-600">Team Size</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {modeLabel === "Solo" ? "1 Member" : "4-5 Members"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-primary" />
                        <span className="text-xs text-gray-600">Prizes</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{totalPrizeText}</p>
                    </div>
                  </div>

                  {/* Desktop Stats - Hidden on mobile */}
                  <div className="hidden lg:block space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Team Size</p>
                        <p className="text-gray-700">{modeLabel === "Solo" ? "1 Member" : "4 - 5 Members"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                        <Trophy className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Prizes Worth</p>
                        <p className="text-gray-700">{totalPrizeText}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contest Image Card - Mobile Optimized */}
                <div className="w-full lg:w-[280px] shrink-0">
                  <div className="rounded-lg lg:rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="w-full h-40 sm:h-48 lg:h-36 rounded-lg lg:rounded-lg overflow-hidden">
                      <img
                        src={contest.banner_url ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${contest.banner_url}` : "/assets/placeholder1.png"}
                        alt={contest.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = "/assets/placeholder1.png" }}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-gray-50 border border-gray-200 px-2.5 py-2">
                        <p className="text-gray-500">Mode</p>
                        <p className="font-semibold text-gray-900">{modeLabel}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 border border-gray-200 px-2.5 py-2">
                        <p className="text-gray-500">Registered</p>
                        <p className="font-semibold text-gray-900 truncate" title={registrationCountText}>
                          {registrationCountText}
                        </p>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* About Section - All text from screenshot */}
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                All that you need to know about {contest.title}
              </h2>

              {processDescriptionWithTags(contest?.description)}

              {/* Registrations Section */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3 text-base sm:text-lg">Registrations</h3>
                <div className="bg-gray-50 rounded-lg p-4 sm:p-5">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Enrollment Period</p>
                  <p className="font-medium text-xs sm:text-sm text-gray-800 mb-3 break-words">
                    {contest.enrollment_start
                      ? new Date(contest.enrollment_start).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      : "Not specified"}{" "}
                    -{" "}
                    {contest.enrollment_end
                      ? new Date(contest.enrollment_end).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      : "Not specified"}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Registration Deadline</p>
                  <p className="font-semibold text-base sm:text-lg mb-2 break-words">
                    {contest.enrollment_end
                      ? new Date(contest.enrollment_end).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      : "Not specified"}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mb-3">Platform: Queekies</p>
                  <p className="text-xs sm:text-sm text-gray-600">All registered teams will be directly selected for online Hackathon.</p>
                </div>
              </div>

              {/* Contest Details Grid */}
              <div className="mt-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Contest Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 border border-gray-100">
                    <p className="text-xs sm:text-sm text-gray-700">Status</p>
                    <Badge variant={contest.status === 'active' ? 'success' : 'default'} className="text-xs capitalize">
                      {contest.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 border border-gray-100">
                    <p className="text-xs sm:text-sm text-gray-700">Entry Fee</p>
                    <p className="text-xs sm:text-sm font-semibold text-primary break-words text-right">
                      {contest.enroll_by === "free" ? "Free" :
                        contest.enroll_by === "points" ? `${contest.enrollment_fee} points` :
                          `₹${contest.enrollment_fee}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Prizes Section */}
              <div className="mt-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Prizes & Rewards</h3>
                {contest.prizes && contest.prizes.length > 0 ? (
                  <div className="space-y-2">
                    {contest.prizes.slice(0, 4).map((prize) => (
                      <div key={prize.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 border border-gray-100">
                        <p className="text-xs sm:text-sm text-gray-700">
                          {prize.prize_type === "position"
                            ? `${prize.position_start}${['st', 'nd', 'rd'][prize.position_start - 1] || 'th'} Place`
                            : `${prize.position_start}-${prize.position_end} Place`}
                        </p>
                        <p className="text-xs sm:text-sm font-semibold text-primary">{prize.prize_points} pts</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No prizes configured.</p>
                )}
              </div>

              {/* Rules Section */}
              <div className="mt-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Contest Rules</h3>
                {/* <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {contest.rules || "No rules added yet."}
                </p> */}

                {processDescriptionWithTags(contest?.rules)}

              </div>

              {/* Duration Section */}
              <div className="mt-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Contest Duration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
                    <p className="text-xs text-gray-500">Start</p>
                    <p className="text-sm font-medium text-gray-900 break-words">
                      {contest.start_time
                        ? new Date(contest.start_time).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                        : "Not specified"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
                    <p className="text-xs text-gray-500">End</p>
                    <p className="text-sm font-medium text-gray-900 break-words">
                      {contest.end_time
                        ? new Date(contest.end_time).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - 1/3 width on desktop, full width on mobile */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            {/* Registration Card - Mobile Optimized */}
            <Card className="p-5 sm:p-6">
              {isUserEnrolled ? (

                <div className="rounded-xl border border-green-200 bg-green-50 p-4 sm:p-5">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center border border-green-200 shrink-0">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">You are registered!</h2>
                        <p className="text-xs sm:text-sm text-gray-600">Your seat is confirmed for this contest.</p>
                      </div>
                    </div>
                    <div className="w-full">
                      {contestStatus === "active" ? (
                        <Button
                          onClick={handleScrollToActivities}
                          className="w-full text-xs sm:text-sm font-semibold bg-primary border-none shadow-lg shadow-primary/20 py-2"
                        >
                          Start Activities
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : contestStatus === "ended" ? (
                        <Button
                          onClick={handleShowLeaderboard}
                          className="w-full text-xs sm:text-sm font-semibold bg-primary border-none shadow-lg shadow-primary/20 py-2"
                        >
                          View Leaderboard
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          disabled
                          className="w-full text-xs sm:text-sm font-semibold bg-gray-300 cursor-not-allowed py-2"
                        >
                          Contest starts soon
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Hi Welcome!</h2>
                  <p className="text-sm sm:text-base text-gray-500 mb-6">
                    {isEnrollmentClosed
                      ? "You are late. Enrollment has closed."
                      : !hasEnrollmentStarted
                        ? "Enrollment has not started yet."
                        : isMaxParticipantsReached
                          ? "Registration is full for this contest."
                          : "Please register below."}
                  </p>

                  {/* Action Button - Only shows modal when live */}
                  {canRegisterNow ? (
                    <Button
                      size="sm"
                      onClick={handleJoinNow}
                      className="w-full text-sm sm:text-base font-semibold bg-primary border-none shadow-lg shadow-primary/20"
                    >
                      Register
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled
                      className="w-full text-sm sm:text-base font-semibold bg-gray-300 cursor-not-allowed"
                    >
                      {isEnrollmentClosed
                        ? "Registration Closed"
                        : !hasEnrollmentStarted
                          ? "Enrollment Not Started"
                          : isMaxParticipantsReached
                            ? "Slots Full"
                            : contestStatus === "ended"
                              ? "Contest Ended"
                              : "Register"}
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                    </Button>
                  )}

                  {isEnrollmentClosed && (
                    <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
                      <p className="text-xs sm:text-sm font-medium text-orange-700">
                        You are late. The enrollment period ended on{" "}
                        {contest.enrollment_end
                          ? new Date(contest.enrollment_end).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                          : "the scheduled deadline"}.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Prize and Registration Info */}
              <div className="mt-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />
                    <span className="font-semibold text-sm sm:text-base">1st Place: {firstPlacePrizeText}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600">{registrationCountText}</span>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-gray-500">
                  <span className="font-medium text-gray-600">{modeLabel} mode</span> - {registrationMetaText}
                </div>

                {/* Refer & Win */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-primary shrink-0" />
                      <span className="font-semibold text-sm sm:text-base">Refer & Win</span>
                    </div>
                    <Button variant="primary" size="sm" className="text-xs sm:text-sm">
                      Refer now
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Leaderboard CTA - Mobile Optimized */}
            {
              (contestStatus === 'ended' || contestStatus === 'active') && (
                <div
                  onClick={handleShowLeaderboard}
                  className="group bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-5 cursor-pointer hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex -space-x-2 shrink-0">
                        {[
                          "https://images.unsplash.com/photo-1502685104226-ee32379fefbe",
                          "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
                          "https://images.unsplash.com/photo-1544005313-94ddf0286df2"
                        ].map((img, i) => (
                          <div key={i} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white overflow-hidden bg-gray-100">
                            <img src={img} alt="user" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-900 truncate">View Leaderboard</h4>
                        <span className="text-xs text-gray-500 truncate block">See rankings and compete</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors shrink-0 ml-2" />
                  </div>
                  <div className="h-px w-full bg-gray-100 my-3" />
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-gray-600">Live Rankings</span>
                  </div>
                </div>
              )
            }

            {/* Activities Card - Mobile Optimized */}
            <Card className="p-5 sm:p-6" ref={activitiesRef}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Contest Activities</h3>
                <span className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-green-100 text-green-700 text-xs sm:text-sm font-bold rounded-full">
                  {contest.activities?.length || 0}
                </span>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {contest.activities && contest.activities.length > 0 ? (
                  contest.activities.map(activity => (
                    <div key={activity.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="text-gray-500 shrink-0">{getTypeIcon(activity.type)}</div>
                        <div className="min-w-0">
                          <p className="font-medium text-xs sm:text-sm text-gray-900 truncate">{activity.title}</p>
                          <p className="text-xs text-gray-500">{activity.points_reward} pts</p>
                        </div>
                      </div>
                      {isUserEnrolled ? (
                        <button
                          onClick={() => handleActivityClick(activity)}
                          className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors shrink-0 ml-2"
                        >
                          Start
                        </button>
                      ) : (
                        <div className="flex items-center text-xs text-amber-600 shrink-0 ml-2">
                          <Lock className="w-3 h-3 mr-1" />
                          Locked
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No activities available</p>
                )}
              </div>
            </Card>

            {/* Need Help Link */}
            <button
              onClick={() => setSupportModalOpen(true)}
              className="w-full text-xs sm:text-sm text-gray-500 hover:text-primary transition-colors text-center py-2"
            >
              Need help?
            </button>
          </div >
        </div >

        {/* Modals */}
        < EnrollmentModal
          isOpen={showModal}
          onClose={() => setShowModal(false)
          }
          contest={contest}
          actionType={modalAction}
          userEnrollment={enrollmentData?.userContest}
          refetchUserEnrollmentData={refetchUserEnrollmentData}
          onEnrollmentSuccess={handleEnrollmentSuccess}
        />

        <WinnerCelebrationModal
          isOpen={showWinnerCelebration}
          onClose={() => setShowWinnerCelebration(false)}
          contestTitle={contest?.title}
          points={enrollmentData?.userContest?.reward_points}
        />

        <SupportModal isOpen={isSupportModalOpen} onClose={() => setSupportModalOpen(false)} />
      </div >
    </div >
  )
}

function Countdown({ targetDate, onComplete }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const target = new Date(targetDate).getTime()
      const difference = target - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        })
      } else {
        if (onComplete) onComplete();
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate, onComplete])

  return (
    <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 border border-primary/20">
      <h3 className="text-gray-900 text-xs sm:text-sm font-medium mb-3 sm:mb-4 uppercase tracking-wider">Contest Starts In</h3>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div key={unit} className="text-center">
            <div className="bg-primary/5 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-primary/10">
              <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-primary">
                {value.toString().padStart(2, "0")}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 uppercase mt-1 tracking-wide">{unit}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function WinnerCelebrationModal({ isOpen, onClose, points, contestTitle }) {
  const [visible, setVisible] = useState(true)
  const [confetti, setConfetti] = useState([])

  useEffect(() => {
    if (isOpen && visible) {
      const newConfetti = []
      for (let i = 0; i < 60; i++) {
        newConfetti.push({
          id: i,
          left: `${Math.random() * 100}%`,
          delay: Math.random() * 2,
          speed: Math.random() * 3 + 3,
          size: Math.random() * 8 + 4,
          color: getRandomSuccessColor(),
        })
      }
      setConfetti(newConfetti)

      const timer = setTimeout(() => {
        setVisible(false)
        if (onClose) onClose()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isOpen, visible, onClose])

  function getRandomSuccessColor() {
    const colors = [
      "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
      "#06B6D4", "#84CC16", "#F97316", "#EC4899", "#6366F1"
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  if (!isOpen || !visible) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center overflow-hidden backdrop-blur-sm p-4">
      {confetti.map((c) => (
        <div
          key={c.id}
          className="absolute animate-fall rounded-sm"
          style={{
            left: c.left,
            top: "-20px",
            width: `${c.size}px`,
            height: `${c.size * 0.4}px`,
            backgroundColor: c.color,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.speed}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
            opacity: 0.9,
          }}
        />
      ))}

      <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 max-w-sm w-full text-center z-10 scale-in shadow-2xl border border-gray-200 mx-auto">
        <div className="flex justify-center mb-4 sm:mb-5 md:mb-6">
          <div className="relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-yellow-100 rounded-full flex items-center justify-center">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-yellow-600" />
            </div>
            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Congratulations!</h2>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-5 sm:mb-6">
          You won the {contestTitle} contest!
        </p>

        <div className="flex justify-center mb-6 sm:mb-7 md:mb-8">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">{points}</div>
            <div className="text-xs sm:text-sm text-gray-500">Bonus Points</div>
          </div>
        </div>

        <Button
          onClick={() => {
            setVisible(false)
            if (onClose) onClose()
          }}
          className="w-full text-sm sm:text-base"
          size="sm"
        >
          Continue
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
        </Button>
      </div>

      <style>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0.3; }
        }
        .animate-fall {
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: 1;
        }
        .scale-in {
          animation: scaleIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes scaleIn {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          50% { transform: scale(1.05) rotate(-90deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  )
}