import { useState } from "react";
import { useCreateSubscriptionMutation } from '../../../services/Support/subscribeApi';
import { toast } from 'react-hot-toast';

// Validation utility functions
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export default function CallToAction() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [createSubscription, { isLoading: isSubscribing }] = useCreateSubscriptionMutation();

  const handleSubscribe = async () => {
    setEmailError("");

    if (!email) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      await createSubscription({ email }).unwrap();
      toast.success("Subscribed successfully!");
      setEmail("");
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error(error?.data?.message || error?.data?.error || "Subscription failed. Please try again.");
    }
  };

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-[1.5rem] relative overflow-hidden bg-sand"
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: "url('/assets/Call_to_Action.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />

          <div className="relative z-10 p-4 sm:p-8 lg:p-10 xl:p-12 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
            {/* Left Content */}
            <div className="text-center lg:text-left max-w-xl">
              <h2 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-forestGreen mb-2 sm:mb-3">
                Stay Updated
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Subscribe to our newsletter for the latest updates and offers.
              </p>
            </div>

            {/* Right Content - Subscription Form */}
            <div className="w-full md:max-w-lg lg:max-w-md 2xl:max-w-2xl">
              <div className="bg-white rounded-md flex items-center border border-gray-300 overflow-hidden">
                <div className="pl-2 sm:pl-4 pr-1.5 sm:pr-3 flex-shrink-0">
                  <img
                    src="/assets/email.png"
                    alt="email"
                    className="w-3.5 h-3.5 sm:w-5 sm:h-5 object-contain opacity-50"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Enter your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 w-full h-10 sm:h-12 bg-transparent text-gray-600 text-xs sm:text-sm outline-none border-none focus:ring-0 min-w-0"
                  disabled={isSubscribing}
                />
                <button
                  onClick={handleSubscribe}
                  disabled={isSubscribing}
                  className="bg-forestGreen rounded-md text-white px-4 sm:px-12 lg:px-10 xl:px-12 py-2.5 h-10 sm:h-12 font-medium text-xs sm:text-md md:text-lg transition-colors duration-300 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                </button>
              </div>
              {emailError && (
                <p className="text-red-500 text-xs mt-2 ml-1 text-center lg:text-left">{emailError}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}