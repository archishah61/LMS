/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
"use client"

import { useState, useEffect } from "react"
import { useCreateEnrollmentMutation, useCreatePaymentMutation } from "../../services/Enrollment/enrollAPI"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useGetUserPointsByIdQuery, useUpdateUserPointsMutation } from "../../services/Challenge/userChallenge"
import PayPalButton from "../paypal/PayPalButton"
import toast from "react-hot-toast"
import { slugify } from "../../utils/slugify"
import { getStudentToken } from "../../services/CookieService"
import RazorpayButton from "../razorpay/RazorpayButton"

const EnrollmentModal = ({ courseId, courseName, userId, coursePrice, isOpen, onClose, discount }) => {
  const [paymentMethod, setPaymentMethod] = useState("paypal") // Set PayPal as default
  const [upiId, setUpiId] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardHolderName, setCardHolderName] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [success, setSuccess] = useState(false)
  const [byPoints, setByPoints] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paypalData, setPaypalData] = useState({})

  const { access_token } = getStudentToken();
  const navigate = useNavigate()

  // Fetch user points
  const { data: pointsData, isSuccess: isPointsSuccess } = useGetUserPointsByIdQuery(
    { access_token },
    {
      skip: !access_token,
    },
  )

  const userPoints = pointsData?.userPoints.points || 0
  const [createEnrollment] = useCreateEnrollmentMutation()
  const [createPayment] = useCreatePaymentMutation()
  const [updateUserPoints, { isLoading: isUpdating }] = useUpdateUserPointsMutation()

  // Calculate if user has sufficient points
  const finalPrice = Number.parseFloat(coursePrice - (coursePrice * discount) / 100)
  const hasSufficientPoints = userPoints >= finalPrice

  // Add useEffect to lock body scroll when modal is open
  useEffect(() => {
    setPaymentAmount(Number.parseFloat(coursePrice - (coursePrice * discount) / 100).toFixed(2))

    const originalStyle = window.getComputedStyle(document.body).overflow
    const scrollPos = window.scrollY
    let scrollY = 0

    if (isOpen) {
      scrollY = window.scrollY
      document.body.style.position = "fixed"
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = "100%"
    }

    return () => {
      if (isOpen) {
        document.body.style.position = ""
        document.body.style.top = ""
        document.body.style.width = ""
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen, coursePrice, discount])

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method)
  }

  const handleEnroll = async () => {
    try {
      const scrollPos = window.scrollY

      const enrollmentData = {
        courseId,
        userId,
      }

      const enrollmentResponse = await createEnrollment({
        enrollment: enrollmentData,
        access_token: { access_token: access_token },
      }).unwrap()

      if (!byPoints) {
        let paymentData

        if (paymentMethod === "upi") {
          paymentData = {
            enrollment_id: enrollmentResponse?.data[0].id,
            payment_method: "paypal",
            upiId,
            amount:
              discount !== null && discount > 0
                ? Number.parseFloat(coursePrice - (coursePrice * discount) / 100).toFixed(2)
                : Number.parseFloat(coursePrice).toFixed(2),
            userId,
          }
        } else if (paymentMethod === "paypal") {
          paymentData = {
            enrollment_id: enrollmentResponse?.data[0].id,
            payment_method: "paypal",
            amount:
              discount !== null && discount > 0
                ? Number.parseFloat(coursePrice - (coursePrice * discount) / 100).toFixed(2)
                : Number.parseFloat(coursePrice).toFixed(2),
            currency: "USD",
            userId,
            transactionId: paypalData?.capture?.purchase_units[0]?.payments?.captures[0].id,
            paypal_email: paypalData?.capture?.payer?.email_address,
            paypal_payer_id: paypalData?.capture?.payer?.payer_id,
            reference_id: paypalData?.capture?.purchase_units[0]?.reference_id,
          }
        } else {
          paymentData = {
            enrollment_id: enrollmentResponse?.data[0].id,
            payment_method: "credit_card",
            cardNumber,
            cardHolderName,
            expiryDate,
            cvv,
            amount:
              discount !== null && discount > 0
                ? Number.parseFloat(coursePrice - (coursePrice * discount) / 100).toFixed(2)
                : Number.parseFloat(coursePrice).toFixed(2),
            userId,
          }
        }

        await createPayment({
          payment: paymentData,
          access_token: { access_token: access_token },
        }).unwrap();
      }

      setSuccess(true)
      window.scrollTo(0, scrollPos)

      setTimeout(() => {
        onClose()
        setSuccess(false)
        navigate(`/course/${slugify(courseName)}/faq-response`, {
          state: {
            course_id: courseId,
            user_id: userId,
            access_token: access_token,
          },
        })
      }, 5000)
    } catch (error) {
      console.error("Enrollment or payment failed:", error)
      toast.error(error.data?.message || error?.data?.error || "Enrollment or payment failed.")
    }
  }

  const handlePayPalPayment = async (data) => {
    setPaypalData(data)

    if (data.capture.status === "COMPLETED") {
      handleEnroll()
    }
  }

  const completeEnrollByPoints = async () => {
    try {
      if (Number.parseFloat(coursePrice - (coursePrice * discount) / 100) <= userPoints) {
        setByPoints(true)
        await updateUserPoints({
          data: {
            points: coursePrice,
            is_add: false,
            source: "course_enroll",
            message: `Enrolled Course ${courseName}`
          },
          access_token,
        }).unwrap();
        handleEnroll()
      } else {
        toast.error("Insufficient tokens!!")
      }
    } catch (error) {
      toast.error(error.data?.message || error?.data?.error || "Insufficient tokens!!")
    }
  }

  if (!isOpen && !success) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4 mt-12">
      {success ? (
        <div
          className="fixed inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 flex flex-col justify-center items-center overflow-hidden"
          style={{ height: "100%", position: "fixed" }}
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 stars-container">
            <div className="stars-1"></div>
            <div className="stars-2"></div>
            <div className="stars-3"></div>
          </div>

          {/* Animated Particles */}
          <div className="absolute inset-0">
            <div className="particles"></div>
          </div>

          <div className="relative z-10 mb-8">
            {/* Enhanced Rocket Animation */}
            <div className="rocket-container">
              <div className="rocket">
                <div className="rocket-body">
                  <svg
                    width="120"
                    height="120"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-white"
                  >
                    <path
                      d="M12 2.5C12 2.5 16.5 7 16.5 13C16.5 17.24 14.24 19.5 12 19.5C9.76 19.5 7.5 17.24 7.5 13C7.5 7 12 2.5 12 2.5Z"
                      fill="white"
                      stroke="white"
                    />
                    <path d="M12 19.5V22.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <path d="M9.5 21.5H14.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <path
                      d="M7 10.5C7 10.5 4.5 11 4.5 13C4.5 15 6.5 16 6.5 16"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M17 10.5C17 10.5 19.5 11 19.5 13C19.5 15 17.5 16 17.5 16"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="rocket-flames">
                  <div className="flame flame-main"></div>
                  <div className="flame flame-side flame-side-left"></div>
                  <div className="flame flame-side flame-side-right"></div>
                </div>
              </div>
            </div>

            {/* Checkmark Animation */}
            <div className="animate-checkmark opacity-0">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="none" />
                <path
                  d="M8 12L10.5 14.5L16 9"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className="text-white text-5xl font-bold animate-success-pop mb-4 text-center z-10">
            Enrollment Successful!
          </div>
          <div className="text-white text-xl animate-fade-in opacity-0 text-center z-10">
            You're all set to begin your learning journey
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto shadow-2xl transform transition-all animate-modal-appear border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Payment
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-3 space-y-3">
            {/* Payment Methods */}
            <div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  className={`px-2 py-1.5 border-2 rounded-lg transition-all duration-300 text-xs font-medium ${paymentMethod === "paypal"
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400"
                    }`}
                  onClick={() => handlePaymentMethodChange("paypal")}
                >
                  PayPal
                </button>

                <button
                  className={`px-2 py-1.5 border-2 rounded-lg transition-all duration-300 text-xs font-medium ${paymentMethod === "upi"
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400"
                    }`}
                  onClick={() => handlePaymentMethodChange("upi")}
                >
                  UPI
                </button>

                <button
                  className={`px-2 py-1.5 border-2 rounded-lg transition-all duration-300 text-xs font-medium ${paymentMethod === "card"
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400"
                    }`}
                  onClick={() => handlePaymentMethodChange("card")}
                >
                  Card
                </button>
              </div>
            </div>

            {/* Payment Form */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              {paymentMethod === "upi" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">UPI ID</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@upi"
                  />
                </div>
              ) : paymentMethod === "paypal" ? (
                <div className="text-center">
                  {/* <PayPalButton onResult={handlePayPalPayment} amount={paymentAmount} /> */}

                  <RazorpayButton onResult={handlePayPalPayment} amount={paymentAmount} />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      autoComplete="cc-number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Card Holder Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={cardHolderName}
                      onChange={(e) => setCardHolderName(e.target.value)}
                      placeholder="John Doe"
                      autoComplete="cc-name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        placeholder="MM/YY"
                        autoComplete="cc-exp"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CVV</label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="•••"
                        maxLength="3"
                        autoComplete="cc-csc"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Price Summary */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3">
              <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Summary</h3>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount:</span>
                <div className="text-right">
                  {discount !== null && discount > 0 ? (
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500 line-through">
                        ${Number.parseFloat(coursePrice).toFixed(2)}
                      </div>
                      <div className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        ${paymentAmount}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">{discount}% discount applied</div>
                    </div>
                  ) : (
                    <div className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      ${Number.parseFloat(coursePrice).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-3 rounded-b-2xl">
            {hasSufficientPoints ? (
              <div className="flex space-x-3">
                <button
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 text-sm font-medium shadow-lg"
                  onClick={completeEnrollByPoints}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    `Enroll with ${Number.parseFloat(coursePrice).toFixed(2)} Points`
                  )}
                </button>

                <button
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm font-medium"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm font-medium"
                onClick={onClose}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        /* Enhanced Rocket Animation */
        .rocket-container {
          position: relative;
          height: 150px;
          width: 120px;
          animation: rocketLaunch 3s ease-out forwards;
          animation-delay: 0.5s;
          z-index: 100;
        }

        .rocket {
          position: relative;
          transform-origin: bottom center;
          animation: rocketShake 0.2s ease-in-out infinite alternate;
          z-index: 100;
        }

        .rocket-body {
          filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
          z-index: 100;
        }

        .rocket-flames {
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 30px;
          filter: blur(1px);
          z-index: 99;
        }

        .flame {
          position: absolute;
          bottom: 0;
          border-radius: 50% 50% 0 0;
          transform-origin: center bottom;
        }

        .flame-main {
          width: 20px;
          height: 30px;
          background: linear-gradient(to top, rgba(255, 255, 255, 0.8), rgba(255, 60, 0, 0.8));
          animation: flameMain 0.2s ease-in-out infinite alternate;
        }

        .flame-side {
          width: 10px;
          height: 20px;
          background: linear-gradient(to top, rgba(255, 255, 255, 0.5), rgba(255, 120, 0, 0.5));
        }

        .flame-side-left {
          left: -6px;
          animation: flameSide 0.15s ease-in-out infinite alternate;
        }

        .flame-side-right {
          right: -6px;
          animation: flameSide 0.15s ease-in-out infinite alternate 0.1s;
        }

        @keyframes rocketLaunch {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          10% {
            transform: translateY(10px);
          }
          30% {
            transform: translateY(-50px);
            opacity: 1;
          }
          70% {
            transform: translateY(-200px);
            opacity: 0.7;
          }
          100% {
            transform: translateY(-400px);
            opacity: 0;
          }
        }

        @keyframes rocketShake {
          0% {
            transform: rotate(-1deg);
          }
          100% {
            transform: rotate(1deg);
          }
        }

        @keyframes flameMain {
          0% {
            height: 30px;
            opacity: 0.8;
          }
          100% {
            height: 35px;
            opacity: 1;
          }
        }

        @keyframes flameSide {
          0% {
            height: 15px;
            opacity: 0.5;
          }
          100% {
            height: 20px;
            opacity: 0.8;
          }
        }

        /* Star Background */
        .stars-container {
          perspective: 500px;
          overflow: hidden;
          z-index: 1;
        }

        .stars-1, .stars-2, .stars-3 {
          position: absolute;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
        }

        .stars-1::before, .stars-2::before, .stars-3::before {
          content: '';
          position: absolute;
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
          box-shadow: 
            30px 30px 0 0 rgba(255, 255, 255, 0.8),
            60px 60px 0 0 rgba(255, 255, 255, 0.9),
            90px 20px 0 0 rgba(255, 255, 255, 0.6),
            120px 90px 0 0 rgba(255, 255, 255, 0.8),
            150px 40px 0 0 rgba(255, 255, 255, 0.7),
            180px 70px 0 0 rgba(255, 255, 255, 0.9),
            210px 30px 0 0 rgba(255, 255, 255, 0.8),
            60px 120px 0 0 rgba(255, 255, 255, 0.7),
            120px 150px 0 0 rgba(255, 255, 255, 0.9),
            180px 180px 0 0 rgba(255, 255, 255, 0.8),
            30px 180px 0 0 rgba(255, 255, 255, 0.9),
            150px 150px 0 0 rgba(255, 255, 255, 0.7),
            90px 210px 0 0 rgba(255, 255, 255, 0.8),
            210px 120px 0 0 rgba(255, 255, 255, 0.7),
            240px 60px 0 0 rgba(255, 255, 255, 0.9),
            270px 210px 0 0 rgba(255, 255, 255, 0.8),
            300px 90px 0 0 rgba(255, 255, 255, 0.7),
            330px 150px 0 0 rgba(255, 255, 255, 0.9),
            360px 30px 0 0 rgba(255, 255, 255, 0.8);
          animation: starTwinkle 3s infinite;
        }

        .stars-2::before {
          width: 3px;
          height: 3px;
          animation-delay: 0.5s;
          transform: translateZ(-20px);
        }

        .stars-3::before {
          width: 2px;
          height: 2px;
          animation-delay: 1s;
          transform: translateZ(-40px);
        }

        @keyframes starTwinkle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }

        /* Particles Animation */
        .particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
        }

        .particles::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          background-image:
            radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.4) 0, rgba(255, 255, 255, 0) 8px),
            radial-gradient(circle at 40% 70%, rgba(255, 255, 255, 0.3) 0, rgba(255, 255, 255, 0) 6px),
            radial-gradient(circle at 60% 40%, rgba(255, 255, 255, 0.4) 0, rgba(255, 255, 255, 0) 10px),
            radial-gradient(circle at 80% 60%, rgba(255, 255, 255, 0.3) 0, rgba(255, 255, 255, 0) 7px),
            radial-gradient(circle at 30% 80%, rgba(255, 255, 255, 0.4) 0, rgba(255, 255, 255, 0) 9px),
            radial-gradient(circle at 70% 20%, rgba(255, 255, 255, 0.3) 0, rgba(255, 255, 255, 0) 8px),
            radial-gradient(circle at 90% 90%, rgba(255, 255, 255, 0.4) 0, rgba(255, 255, 255, 0) 6px);
          background-size: 300% 300%;
          animation: particleFloat 15s linear infinite;
        }

        @keyframes particleFloat {
          0% {
            background-position: 0% 0%;
          }
          25% {
            background-position: 100% 0%;
          }
          50% {
            background-position: 100% 100%;
          }
          75% {
            background-position: 0% 100%;
          }
          100% {
            background-position: 0% 0%;
          }
        }

        /* Checkmark Animation */
        @keyframes checkmarkAppear {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          70% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-checkmark {
          animation: checkmarkAppear 1s ease-out forwards;
          animation-delay: 2.5s;
        }

        /* Other Animations */
        @keyframes modalAppear {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes successPop {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          70% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        .animate-modal-appear {
          animation: modalAppear 0.3s ease-out;
        }

        .animate-success-pop {
          animation: successPop 0.8s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
          animation-delay: 1s;
        }
      `}</style>
    </div>
  )
}

export default EnrollmentModal
