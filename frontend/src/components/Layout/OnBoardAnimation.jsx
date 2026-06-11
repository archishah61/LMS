/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom";
import useStudentAuthTokenRefresh from "../../hooks/useStudentAuthTokenRefresh";

const OnboardingAnimation = () => {
  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [motivation, setMotivation] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showRobot, setShowRobot] = useState(false)
  const [interest, setInterest] = useState("")
  const [showHearts, setShowHearts] = useState(false)
  const [robotMood, setRobotMood] = useState("normal") // normal, excited, love
  const navigate = useNavigate();

  useStudentAuthTokenRefresh();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
      setShowRobot(true)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Update robot mood based on step
  useEffect(() => {
    if (step === 3) {
      setRobotMood("excited")
    } else if (step === 5) {
      setRobotMood("love")
    } else {
      setRobotMood("normal")
    }
  }, [step])

  useEffect(() => {
    if (step === 5) {
      setTimeout(() => setShowHearts(true), 1000)
    } else {
      setShowHearts(false)
    }
  }, [step])

  // Auto-advance steps for demo purposes
  useEffect(() => {
    if (step === 0 && showRobot) {
      const timer = setTimeout(() => setStep(1), 2000)
      return () => clearTimeout(timer)
    }
  }, [step, showRobot])

  const motivationOptions = [
    { id: "skill", text: "I want to learn a new skill", icon: "📚" },
    { id: "career", text: "I want to advance my career", icon: "🚀" },
    { id: "exam", text: "I want to prepare for exams", icon: "🎓" },
    { id: "personal", text: "I enjoy learning new things", icon: "✨" },
  ]

  const interestOptions = [
    { id: "science", text: "Science", icon: "🔬" },
    { id: "math", text: "Mathematics", icon: "🧮" },
    { id: "languages", text: "Languages", icon: "🗣️" },
    { id: "history", text: "History", icon: "📜" },
    { id: "technology", text: "Technology", icon: "💡" },
    { id: "arts", text: "Arts", icon: "🎨" },
  ]

  const handleContinue = () => {
    setStep(step + 1)
  }

  const handleSkip = () => {
    navigate('/student-dashboard');
  };

  const handleSetMotivation = (option) => {
    setMotivation(option)
    setTimeout(() => setStep(step + 1), 300)
  }

  const handleSetInterest = (option) => {
    setInterest(option);
    setTimeout(() => setStep((prevStep) => prevStep + 1), 300);
  };

  const handleNameSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) {
      setStep(step + 1)
    }
  }

  // Enhanced animation variants
  const robotVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    floating: {
      y: [0, -15, 0],
      transition: { duration: 3, repeat: Number.POSITIVE_INFINITY, repeatType: "loop", ease: "easeInOut" },
    },
    excited: {
      rotate: [0, -5, 5, -5, 0],
      scale: [1, 1.05, 1],
      transition: { duration: 0.5, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY, repeatType: "loop" },
    },
    love: {
      y: [0, -10, 0],
      scale: [1, 1.03, 1],
      transition: { duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "loop", ease: "easeInOut" },
    },
  }

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.3, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3, ease: "easeIn" },
    },
  }

  const buttonVariants = {
    idle: { scale: 1 },
    hover: {
      scale: 1.05,
      boxShadow: "0px 5px 15px rgba(79, 70, 229, 0.4)",
      transition: { duration: 0.2, ease: "easeOut" },
    },
    tap: { scale: 0.95, transition: { duration: 0.1 } },
  }

  const optionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, delay: i * 0.1, ease: "easeOut" },
    }),
    hover: {
      scale: 1.02,
      backgroundColor: "rgba(79, 70, 229, 0.15)",
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.98, transition: { duration: 0.1 } },
  }

  // Particle animation for background
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 10,
  }))

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 px-4 py-8">
      {/* Background particles - Reduced count for mobile */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-indigo-500"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: 0.2,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main container - Adjusted for mobile */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md p-4 sm:p-6 mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border-2 border-indigo-500/30 shadow-2xl shadow-indigo-500/20"
      >
        {/* Animated background glow */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -inset-[100%] opacity-20 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          ></motion.div>
        </div>

        {/* Progress bar */}
        <div className="mb-6 w-full h-2 bg-gray-800/80 rounded-full overflow-hidden relative z-10">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 5) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          ></motion.div>
        </div>

        {/* Robot character - Reduced size for mobile */}
        {showRobot && (
          <motion.div
            className="flex justify-center mb-6 relative z-10"
            variants={robotVariants}
            animate={robotMood === "excited" ? "excited" : robotMood === "love" ? "love" : "floating"}
            style={{ display: "block", opacity: 1 }}
          >
            {/* Hearts animation - Adjusted positioning for mobile */}
            {showHearts && (
              <>
                <motion.div
                  className="absolute -top-2 -left-1 sm:-top-4 sm:-left-2"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-xl sm:text-2xl">❤️</div>
                </motion.div>
                <motion.div
                  className="absolute -top-2 -right-1 sm:-top-4 sm:-right-2"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="text-xl sm:text-2xl">❤️</div>
                </motion.div>
                <motion.div
                  className="absolute top-0 left-8 sm:left-10"
                  initial={{ opacity: 0, scale: 0, y: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.8], y: -20 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 0.5 }}
                >
                  <div className="text-lg sm:text-xl">💖</div>
                </motion.div>
                <motion.div
                  className="absolute -top-4 right-8 sm:right-10"
                  initial={{ opacity: 0, scale: 0, y: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.8], y: -20 }}
                  transition={{ duration: 2, delay: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 0.5 }}
                >
                  <div className="text-lg sm:text-xl">💕</div>
                </motion.div>
              </>
            )}
            <div className="relative w-24 h-24 sm:w-36 sm:h-36">
              <motion.div
                className="absolute -inset-3 sm:-inset-4 rounded-full opacity-30"
                style={{
                  background: `radial-gradient(circle, ${robotMood === "love" ? "rgba(255,105,180,0.4)" : "rgba(79,70,229,0.4)"} 0%, rgba(0,0,0,0) 70%)`,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="120" height="120" className="sm:w-36 sm:h-36">
                {/* Background glow effect */}
                <defs>
                  <radialGradient id="headGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" stopColor={robotMood === "love" ? "#FF6B9D" : "#4B5185"} stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#1E213A" stopOpacity="0" />
                  </radialGradient>

                  {/* Heart shape clip path */}
                  <clipPath id="heartClip">
                    <path d="M10,6 Q10,0 15,0 Q20,0 20,6 Q20,10 15,14 Q10,10 10,6 Z" />
                  </clipPath>

                  {/* Eye gradients */}
                  <linearGradient id="eyeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={robotMood === "love" ? "#FF4D8D" : "#00BFFF"} />
                    <stop offset="100%" stopColor={robotMood === "love" ? "#FF0066" : "#0099FF"} />
                  </linearGradient>

                  <filter id="eyeGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  <linearGradient id="headGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#232742" />
                    <stop offset="100%" stopColor="#1A1E38" />
                  </linearGradient>

                  <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#AEB5D0" />
                    <stop offset="100%" stopColor="#8A91AB" />
                  </linearGradient>
                </defs>

                <circle cx="150" cy="135" r="85" fill="url(#headGlow)" />

                {/* Robot Head */}
                <rect x="100" y="80" width="100" height="100" rx="22" fill="url(#headGradient)" strokeWidth="6">
                  <animate
                    attributeName="stroke"
                    values={robotMood === "love" ? "#FF6B9D;#FF9BBD;#FF6B9D" : "#FFFFFF;#E0E0FF;#FFFFFF"}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </rect>
                <rect
                  x="100"
                  y="80"
                  width="100"
                  height="100"
                  rx="22"
                  fill="none"
                  stroke={robotMood === "love" ? "#FF6B9D" : "#FFFFFF"}
                  strokeWidth="6"
                />
                <rect x="105" y="85" width="90" height="90" rx="18" fill="none" stroke="#2C3152" strokeWidth="1" />

                {/* Robot Eyes - Conditional rendering based on mood */}
                {robotMood === "love" ? (
                  <>
                    {/* Heart-shaped eyes with glowing effect */}
                    <path
                      d="M125,110 Q125,104 130,104 Q135,104 135,110 Q135,114 130,118 Q125,114 125,110 Z"
                      fill="url(#eyeGradient)"
                      filter="url(#eyeGlow)"
                    >
                      <animate attributeName="fillOpacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite" />
                    </path>
                    <path
                      d="M155,110 Q155,104 160,104 Q165,104 165,110 Q165,114 160,118 Q155,114 155,110 Z"
                      fill="url(#eyeGradient)"
                      filter="url(#eyeGlow)"
                    >
                      <animate attributeName="fillOpacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite" />
                    </path>
                  </>
                ) : (
                  <>
                    {/* Enhanced rectangular eyes with pulse effect */}
                    <g>
                      <rect x="125" y="110" width="20" height="20" rx="6" fill="url(#eyeGradient)" filter="url(#eyeGlow)">
                        <animate attributeName="fillOpacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite" />
                      </rect>
                      <rect x="155" y="110" width="20" height="20" rx="6" fill="url(#eyeGradient)" filter="url(#eyeGlow)">
                        <animate attributeName="fillOpacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite" />
                      </rect>
                    </g>
                  </>
                )}

                {/* Eye highlights with subtle animation */}
                <circle cx="130" cy="115" r="3" fill="#FFFFFF" fillOpacity="0.8">
                  <animate attributeName="fillOpacity" values="0.7;0.9;0.7" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="160" cy="115" r="3" fill="#FFFFFF" fillOpacity="0.8">
                  <animate attributeName="fillOpacity" values="0.7;0.9;0.7" dur="3s" repeatCount="indefinite" />
                </circle>

                {/* Robot Mouth - Conditional based on mood */}
                {robotMood === "excited" || robotMood === "love" ? (
                  // Smiling mouth with improved animation
                  <path
                    d="M130,145 Q150,160 170,145"
                    fill="none"
                    stroke={robotMood === "love" ? "#FF4D8D" : "url(#eyeGradient)"}
                    strokeWidth="6"
                    strokeLinecap="round"
                  >
                    <animate
                      attributeName="d"
                      values="M130,145 Q150,158 170,145;M130,145 Q150,160 170,145;M130,145 Q150,158 170,145"
                      dur="4s"
                      repeatCount="indefinite"
                    />
                  </path>
                ) : (
                  // Normal mouth with subtle animation
                  <>
                    <rect
                      x="130"
                      y="140"
                      width="40"
                      height="12"
                      rx="6"
                      fill="url(#eyeGradient)"
                      filter="url(#eyeGlow)"
                    >
                      <animate attributeName="width" values="40;42;40" dur="4s" repeatCount="indefinite" />
                    </rect>
                    <rect x="132" y="142" width="36" height="8" rx="4" fill="#0088EE">
                      <animate attributeName="width" values="36;38;36" dur="4s" repeatCount="indefinite" />
                    </rect>
                  </>
                )}

                {/* Robot Body with improved gradient */}
                <ellipse cx="150" cy="195" rx="25" ry="15" fill="url(#bodyGradient)">
                  <animate attributeName="ry" values="15;16;15" dur="3s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="150" cy="193" rx="22" ry="13" fill="#9DA1B4">
                  <animate attributeName="ry" values="13;14;13" dur="3s" repeatCount="indefinite" />
                </ellipse>

                {/* Robot Speech Dots with improved pulse animation */}
                <circle cx="182" cy="195" r="5" fill="#9DA1B4">
                  <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="r" values="5;6;5" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="195" cy="192" r="5" fill="#9DA1B4">
                  <animate
                    attributeName="opacity"
                    values="0.6;1;0.6"
                    dur="1.5s"
                    begin="0.3s"
                    repeatCount="indefinite"
                  />
                  <animate attributeName="r" values="5;6;5" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
                </circle>
                <circle cx="208" cy="189" r="5" fill="#9DA1B4">
                  <animate
                    attributeName="opacity"
                    values="0.6;1;0.6"
                    dur="1.5s"
                    begin="0.6s"
                    repeatCount="indefinite"
                  />
                  <animate attributeName="r" values="5;6;5" dur="1.5s" begin="0.6s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
          </motion.div>
        )}

        {/* Content Area - Adjusted for mobile */}
        <div className="min-h-56 flex flex-col items-center justify-start relative z-10">
          {isLoading ? (
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="mb-4 text-lg sm:text-xl font-medium text-white text-center px-2">Getting everything ready...</div>
              <div className="relative">
                <motion.div
                  className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 border-4 border-indigo-400 border-b-transparent rounded-full"
                  animate={{ rotate: -180 }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="welcome"
                  className="flex flex-col items-center text-center px-2"
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="bg-indigo-900/50 p-4 sm:p-6 rounded-xl mb-4 border border-indigo-800/50 shadow-lg shadow-indigo-900/20 backdrop-blur-sm w-full">
                    <motion.h2
                      className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                      animate={{
                        backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
                      }}
                      transition={{
                        duration: 8,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                      style={{ backgroundSize: "200% 100%" }}
                    >
                      Welcome to Queekies!
                    </motion.h2>
                    <p className="text-gray-300 mt-2 sm:mt-3 text-sm sm:text-lg">Your journey to knowledge begins here.</p>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="name"
                  className="flex flex-col items-center w-full px-2"
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="bg-indigo-900/50 p-4 sm:p-6 rounded-xl mb-4 border border-indigo-800/50 shadow-lg shadow-indigo-900/20 backdrop-blur-sm w-full">
                    <h2 className="text-lg sm:text-xl text-white text-center">I am curious. What shall I call you?</h2>
                  </div>
                  <form onSubmit={handleNameSubmit} className="w-full mt-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Type your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 sm:px-6 sm:py-4 rounded-xl bg-gray-800/80 border-2 border-gray-700 text-white text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner transition-all duration-300 hover:border-indigo-500/50"
                        autoFocus
                      />
                      <motion.button
                        type="submit"
                        className={`absolute right-2 top-2 sm:right-3 sm:top-3 transform -translate-y-1/2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm sm:text-base shadow-md ${!name.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
                        variants={buttonVariants}
                        initial="idle"
                        whileHover={name.trim() ? "hover" : "idle"}
                        whileTap={name.trim() ? "tap" : "idle"}
                        disabled={!name.trim()}
                      >
                        Continue
                      </motion.button>
                    </div>
                    <div className="flex justify-center mt-4 sm:mt-6">
                      <motion.button
                        className="mt-2 text-xs sm:text-sm text-gray-300 underline hover:text-white transition"
                        onClick={handleSkip}
                        variants={buttonVariants}
                        initial="idle"
                        whileHover="hover"
                        whileTap="tap"
                      >
                        Skip Onboarding
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="greeting"
                  className="flex flex-col items-center px-2"
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="bg-indigo-900/50 p-4 sm:p-6 rounded-xl mb-4 border border-indigo-800/50 shadow-lg shadow-indigo-900/20 backdrop-blur-sm w-full">
                    <motion.h2
                      className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-center"
                      animate={{
                        backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
                      }}
                      transition={{
                        duration: 8,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                      style={{ backgroundSize: "200% 100%" }}
                    >
                      Hey, {name}!
                    </motion.h2>
                    <p className="text-gray-300 mt-2 sm:mt-3 text-sm sm:text-lg text-center">I'll guide you step by step through both theoretical concepts and practical applications to enhance your learning experience!</p>
                  </div>
                  <motion.button
                    className="px-6 py-2.5 sm:px-8 sm:py-3 mt-4 sm:mt-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm sm:text-base shadow-lg shadow-indigo-900/30 hover:shadow-indigo-900/50 hover:from-indigo-500 hover:to-purple-500 transition-colors"
                    onClick={handleContinue}
                    variants={buttonVariants}
                    initial="idle"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    Sounds good
                  </motion.button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="motivation"
                  className="flex flex-col items-center w-full px-2"
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="bg-indigo-900/50 p-4 sm:p-6 rounded-xl mb-4 border border-indigo-800/50 shadow-lg shadow-indigo-900/20 backdrop-blur-sm w-full">
                    <h2 className="text-lg sm:text-xl text-white text-center">What motivates you to learn and grow?</h2>
                  </div>
                  <div className="w-full mt-4">
                    {/* Mobile view - single column */}
                    <div className="block sm:hidden space-y-2">
                      {motivationOptions.map((option, index) => (
                        <motion.button
                          key={option.id}
                          className="w-full flex items-center p-3 bg-gray-800/80 hover:bg-gray-700/90 rounded-xl border-2 border-gray-700 hover:border-indigo-500/50 text-white text-left shadow-md hover:shadow-lg transition-all duration-300"
                          onClick={() => handleSetMotivation(option.id)}
                          custom={index}
                          variants={optionVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover="hover"
                          whileTap="tap"
                        >
                          <span className="mr-3 text-xl">{option.icon}</span>
                          <span className="text-sm">{option.text}</span>
                        </motion.button>
                      ))}
                    </div>

                    {/* Desktop view - 2 columns */}
                    <div className="hidden sm:grid grid-cols-2 gap-3">
                      {motivationOptions.map((option, index) => (
                        <motion.button
                          key={option.id}
                          className="flex items-center p-4 bg-gray-800/80 hover:bg-gray-700/90 rounded-xl border-2 border-gray-700 hover:border-indigo-500/50 text-white text-left shadow-md hover:shadow-lg transition-all duration-300 h-full"
                          onClick={() => handleSetMotivation(option.id)}
                          custom={index}
                          variants={optionVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover="hover"
                          whileTap="tap"
                        >
                          <span className="mr-4 text-2xl">{option.icon}</span>
                          <span className="text-lg">{option.text}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="interests"
                  className="flex flex-col items-center w-full px-1 sm:px-2"
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="bg-indigo-900/50 p-3 sm:p-6 rounded-xl mb-4 border border-indigo-800/50 shadow-lg shadow-indigo-900/20 backdrop-blur-sm w-full">
                    <h2 className="text-base sm:text-xl text-white text-center">What do you find most interesting?</h2>
                  </div>
                  <div className="w-full mt-3 sm:mt-4">
                    {/* Mobile view - 2 columns with smaller sizing */}
                    <div className="grid grid-cols-2 sm:hidden gap-1.5">
                      {interestOptions.map((option, index) => (
                        <motion.button
                          key={option.id}
                          className="flex flex-col items-center justify-center p-2 bg-gray-800/80 hover:bg-gray-700/90 rounded-xl border-2 border-gray-700 hover:border-indigo-500/50 text-white shadow-md hover:shadow-lg transition-all duration-300 h-20"
                          onClick={() => handleSetInterest(option.id)}
                          custom={index}
                          variants={optionVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover="hover"
                          whileTap="tap"
                        >
                          <span className="text-xl mb-1">{option.icon}</span>
                          <span className="text-xs text-center px-1">{option.text}</span>
                        </motion.button>
                      ))}
                    </div>

                    {/* Desktop view - 3 columns */}
                    <div className="hidden sm:grid grid-cols-3 gap-3">
                      {interestOptions.map((option, index) => (
                        <motion.button
                          key={option.id}
                          className="flex flex-col items-center justify-center p-4 bg-gray-800/80 hover:bg-gray-700/90 rounded-xl border-2 border-gray-700 hover:border-indigo-500/50 text-white shadow-md hover:shadow-lg transition-all duration-300 h-28"
                          onClick={() => handleSetInterest(option.id)}
                          custom={index}
                          variants={optionVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover="hover"
                          whileTap="tap"
                        >
                          <span className="text-3xl mb-3">{option.icon}</span>
                          <span className="text-sm md:text-base text-center">{option.text}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              
              {step === 5 && (
                <motion.div
                  key="dashboard"
                  className="flex flex-col items-center px-2"
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <motion.div
                    className="bg-indigo-900/50 p-4 sm:p-6 rounded-xl mb-4 border border-indigo-800/50 shadow-lg shadow-indigo-900/20 backdrop-blur-sm w-full"
                    animate={{
                      boxShadow: ["0 10px 15px -3px rgba(79, 70, 229, 0.1)", "0 20px 30px -3px rgba(79, 70, 229, 0.2)", "0 10px 15px -3px rgba(79, 70, 229, 0.1)"],
                      borderColor: ["rgba(79, 70, 229, 0.3)", "rgba(79, 70, 229, 0.5)", "rgba(79, 70, 229, 0.3)"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  >
                    <motion.h2
                      className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-center"
                      animate={{
                        backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
                      }}
                      transition={{
                        duration: 8,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                      style={{ backgroundSize: "200% 100%" }}
                    >
                      You're all set, {name}!
                    </motion.h2>
                    <p className="text-gray-300 mt-2 sm:mt-3 text-sm sm:text-lg text-center">
                      Your personalized dashboard is ready. Let's begin your learning journey!
                    </p>
                  </motion.div>
                  <motion.button
                    className="px-6 py-2.5 sm:px-8 sm:py-3 mt-4 sm:mt-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm sm:text-base shadow-lg shadow-indigo-900/30 hover:shadow-indigo-900/50 hover:from-indigo-500 hover:to-purple-500 transition-colors"
                    onClick={() => navigate('/student-dashboard')}
                    variants={buttonVariants}
                    initial="idle"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    Continue to Dashboard
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Decorative elements - Hidden on mobile for better performance */}
        <div className="hidden sm:block absolute bottom-0 left-0 w-full h-1/2 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute bottom-0 left-0 w-full"
            initial={{ y: 50 }}
            animate={{ y: [0, 10, 0] }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-20 opacity-5">
              <path
                d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
                fill="url(#eyeGradient)"
              />
            </svg>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default OnboardingAnimation