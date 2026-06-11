import { useState } from "react";
import { NavLink } from "react-router-dom";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setEmail("");
  };

  return (
    <section className={`py-16 bg-white border-gray-100 border-t px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1 rounded-full mb-4 inline-block">
              STAY UPDATED
            </span>
            <h2 className={`text-3xl lg:text-4xl font-bold text-gray-900'} mb-4`}>Subscribe to Our Newsletter</h2>
            <p className={`text-gray-600 max-w-md text-lg mb-6`}>
              Get the latest updates on new courses, special offers, and educational content delivered straight to your inbox.
            </p>

            {isSubmitted ? (
              <div className={`bg-green-50 border-green-200 border rounded-lg p-4 mb-6`}>
                <p className={`text-green-700 font-medium`}>
                  Thank you for subscribing! Check your email for confirmation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`flex-1 px-4 py-2 border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 rounded-lg focus:outline-none`}
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
                  >
                    Subscribe
                  </button>
                </div>
                <p className={`text-xs text-gray-500`}>
                  By subscribing, you agree to our{" "}
                  <NavLink to="/terms" className={`text-indigo-600 hover:underline`}>
                    Terms & Conditions
                  </NavLink>{" "}
                  and{" "}
                  <NavLink to="/privacy" className={`text-indigo-600 hover:underline`}>
                    Privacy Policy
                  </NavLink>
                  .
                </p>
              </form>
            )}
          </div>

          {/* Right Side Content */}
          <div className={`bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 lg:p-12`}>
            <h3 className={`text-2xl font-bold text-gray-900 mb-4`}>What You'll Get:</h3>
            <ul className="space-y-4">
              {[
                "Weekly educational tips and resources",
                "Exclusive discounts and promotions",
                "Early access to new course launches",
                "Industry insights and career advice",
              ].map((item, index) => (
                <li key={index} className="flex items-start">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-3 mt-0.5`}>
                    <svg
                      className="w-4 h-4 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span className={`text-gray-700`}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
