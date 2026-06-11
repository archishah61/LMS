"use client"
import { useState, useEffect } from "react"
import { usePayCheatSheetMutation } from "../../services/CheatSheet/cheatSheetApi"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import PayPalButton from "../paypal/PayPalButton"
import toast from "react-hot-toast"
import { getStudentToken } from "../../services/CookieService"
import { slugify } from "../../utils/slugify"
import RazorpayButton from "../razorpay/RazorpayButton"

const CheatSheetPaymentModal = ({ cheatSheetId, cheatSheetTitle, price, discount = 0, isOpen, onClose }) => {
  const [paymentMethod, setPaymentMethod] = useState("paypal")
  const [upiId, setUpiId] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardHolderName, setCardHolderName] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [success, setSuccess] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paypalData, setPaypalData] = useState({})
  const [isProcessing, setIsProcessing] = useState(false)

  const { access_token } = getStudentToken();
  const navigate = useNavigate()

  const [payCheatSheet] = usePayCheatSheetMutation()

  // Calculate final price
  const finalPrice = Number.parseFloat(price - (price * discount) / 100)

  // Lock body scroll when modal is open
  useEffect(() => {
    setPaymentAmount(Number.parseFloat(price - (price * discount) / 100).toFixed(2))
    if (isOpen) {
      const scrollY = window.scrollY
      document.body.style.position = "fixed"
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = "100%"
      return () => {
        document.body.style.position = ""
        document.body.style.top = ""
        document.body.style.width = ""
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen, price, discount])

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method)
  }

  const handlePurchase = async (paymentData = null) => {
    if (isProcessing) return

    setIsProcessing(true)
    try {
      // First, create the purchase record
      const purchasePayload = {
        cheatsheet_id: cheatSheetId,
        amount: Number.parseFloat(paymentAmount),
        currency: "USD",
        payment_method: paymentMethod,
        transaction_id: paymentData?.transaction_id || `${paymentMethod}_${Date.now()}`,
        reference_id: paymentData?.reference_id || null,
        status: paymentData?.status || "completed",
        paypal_email: paymentData?.paypal_email || null,
        paypal_payer_id: paymentData?.paypal_payer_id || null,
      }

      const purchaseResponse = await payCheatSheet({
        purchase: purchasePayload,
        access_token
      }).unwrap()


      setSuccess(true)
      toast.success("Payment successful! You now have access to the cheat sheet.")

      setTimeout(() => {
        onClose()
        setSuccess(false)
        setIsProcessing(false)
        navigate(`/cheat-sheets/${slugify(cheatSheetTitle)}`, {
          state: { sheetId: cheatSheetId }
        })
      }, 3000)
    } catch (error) {
      const errorMessage = error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'Failed to delete role';
      toast.error(errorMessage);
      setIsProcessing(false)
    }
  }

  const handlePayPalPayment = async (data) => {
    setPaypalData(data)

    if (data.capture?.status === "COMPLETED") {
      const paymentData = {
        transaction_id: data.capture.purchase_units[0]?.payments?.captures[0]?.id,
        reference_id: data.capture.purchase_units[0]?.reference_id,
        status: "completed",
        paypal_email: data.capture.payer?.email_address,
        paypal_payer_id: data.capture.payer?.payer_id,
      }

      await handlePurchase(paymentData)
    }
  }

  const handleManualPayment = async () => {
    if (paymentMethod === "upi" && !upiId.trim()) {
      toast.error("Please enter a valid UPI ID")
      return
    }

    if (paymentMethod === "card") {
      if (!cardNumber.trim() || !cardHolderName.trim() || !expiryDate.trim() || !cvv.trim()) {
        toast.error("Please fill in all card details")
        return
      }
    }

    const paymentData = {
      transaction_id: `${paymentMethod}_${Date.now()}`,
      status: "completed",
    }

    await handlePurchase(paymentData)
  }

  if (!isOpen && !success) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      {success ? (
        <div className="fixed inset-0 bg-gradient-to-br from-green-600 to-blue-700 flex flex-col justify-center items-center overflow-hidden">
          {/* Success Animation */}
          <div className="relative z-10 mb-8">
            <div className="success-container">
              <div className="success-checkmark">
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                    className="animate-draw-circle"
                  />
                  <path
                    d="M8 12L10.5 14.5L16 9"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-draw-check"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="text-white text-5xl font-bold animate-success-pop mb-4 text-center z-10">
            Purchase Successful!
          </div>
          <div className="text-white text-xl animate-fade-in opacity-0 text-center z-10">
            Your cheat sheet is now available
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto shadow-2xl transform transition-all animate-modal-appear border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Purchase Cheat Sheet
              </h2>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-3 space-y-3">
            {/* Cheat Sheet Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{cheatSheetTitle}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Digital cheat sheet access</p>
            </div>

            {/* Payment Methods */}
            <div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  className={`px-2 py-1.5 border-2 rounded-lg transition-all duration-300 text-xs font-medium ${paymentMethod === "paypal"
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400"
                    }`}
                  onClick={() => handlePaymentMethodChange("paypal")}
                  disabled={isProcessing}
                >
                  PayPal
                </button>
                <button
                  className={`px-2 py-1.5 border-2 rounded-lg transition-all duration-300 text-xs font-medium ${paymentMethod === "upi"
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400"
                    }`}
                  onClick={() => handlePaymentMethodChange("upi")}
                  disabled={isProcessing}
                >
                  UPI
                </button>
                <button
                  className={`px-2 py-1.5 border-2 rounded-lg transition-all duration-300 text-xs font-medium ${paymentMethod === "card"
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400"
                    }`}
                  onClick={() => handlePaymentMethodChange("card")}
                  disabled={isProcessing}
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@upi"
                    disabled={isProcessing}
                  />
                </div>
              ) : paymentMethod === "paypal" ? (
                <div className="text-center">
                  {/* <PayPalButton onResult={handlePayPalPayment} amount={paymentAmount} disabled={isProcessing} /> */}

                  <RazorpayButton onResult={handlePayPalPayment} amount={paymentAmount} disabled={isProcessing} />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      autoComplete="cc-number"
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Card Holder Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                      value={cardHolderName}
                      onChange={(e) => setCardHolderName(e.target.value)}
                      placeholder="John Doe"
                      autoComplete="cc-name"
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        placeholder="MM/YY"
                        autoComplete="cc-exp"
                        disabled={isProcessing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CVV</label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="•••"
                        maxLength="3"
                        autoComplete="cc-csc"
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Price Summary */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
              <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Summary</h3>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount:</span>
                <div className="text-right">
                  {discount > 0 ? (
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500 line-through">${Number.parseFloat(price).toFixed(2)}</div>
                      <div className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        ${paymentAmount}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">{discount}% discount applied</div>
                    </div>
                  ) : (
                    <div className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                      ${Number.parseFloat(price).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-3 rounded-b-2xl">
            <div className="flex gap-2">
              <button
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm font-medium disabled:opacity-50"
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </button>
              {paymentMethod !== "paypal" && (
                <button
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleManualPayment}
                  // disabled={isProcessing}
                  disabled
                >
                  {isProcessing ? "Processing..." : "Pay Now"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes drawCircle {
          0% {
            stroke-dasharray: 0 63;
          }
          100% {
            stroke-dasharray: 63 63;
          }
        }
        @keyframes drawCheck {
          0% {
            stroke-dasharray: 0 20;
          }
          100% {
            stroke-dasharray: 20 20;
          }
        }
        .animate-draw-circle {
          stroke-dasharray: 63;
          stroke-dashoffset: 0;
          animation: drawCircle 1s ease-out forwards;
        }
        .animate-draw-check {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          animation: drawCheck 0.5s ease-out forwards;
          animation-delay: 1s;
        }
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

export default CheatSheetPaymentModal
