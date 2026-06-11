import { Check } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuthModal } from "../../../context/AuthModalContext";

const plans = [
  {
    name: "Free",
    price: "0",
    description: "Perfect for beginners looking to explore our platform.",
    features: [
      "Access to 5 free courses",
      "Basic community support",
      "Course completion certificates",
      "7-day access to course materials",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "19",
    description: "Ideal for serious learners committed to skill development.",
    features: [
      "Unlimited access to 100+ courses",
      "Priority community support",
      "Course completion certificates",
      "Lifetime access to course materials",
      "Downloadable resources",
      "Monthly live Q&A sessions",
    ],
    cta: "Subscribe Now",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "49",
    description: "Comprehensive solution for teams and organizations.",
    features: [
      "Everything in Pro plan",
      "Custom learning paths",
      "Dedicated account manager",
      "Team progress reporting",
      "API access",
      "SSO integration",
      "Custom branding options",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingPlans() {
  const { openSignup } = useAuthModal();

  return (
    <section className={`py-16 bg-white px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <span className="text-xs bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1 rounded-full mb-4 inline-block">
            PRICING PLANS
          </span>
          <h2 className={`text-3xl lg:text-4xl font-bold text-gray-900 mb-4`}>
            Find the Perfect{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Plan
            </span>{" "}
            for You
          </h2>
          <p className={`text-gray-600 max-w-2xl mx-auto text-lg`}>
            Choose the plan that fits your learning goals and budget. All plans include access to our supportive
            community.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl ${plan.popular
                ? "border-2 border-indigo-600 shadow-lg transform -translate-y-2"
                : `border-gray-200 hover:-translate-y-1`
                } bg-white`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-2 text-sm font-medium">
                  MOST POPULAR
                </div>
              )}

              <div className="p-8">
                <h3 className={`text-2xl font-bold text-gray-900 mb-4`}>{plan.name}</h3>
                <div className="flex items-baseline mb-5">
                  <span className={`text-4xl font-bold text-gray-900`}>${plan.price}</span>
                  <span className={`text-gray-600 ml-2`}>/month</span>
                </div>
                <p className={`text-gray-600 mb-6`}>{plan.description}</p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-5 h-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span className={`'text-gray-600`}>{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.name === "Enterprise" ? (
                  <NavLink
                    to="/contact"
                    className={`block w-full text-center py-3 rounded-lg font-medium transition-colors duration-300 ${plan.popular
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                      : `bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50`
                      }`}
                  >
                    {plan.cta}
                  </NavLink>
                ) : (
                  <button
                    onClick={openSignup}
                    className={`block w-full text-center py-3 rounded-lg font-medium transition-colors duration-300 ${plan.popular
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                      : `bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50`
                      }`}
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Custom Plan Section */}
        <div className="mt-12 text-center">
          <p className={`text-gray-600`}>
            Need a custom plan for your organization?{" "}
            <NavLink to="/contact" className={`text-indigo-600 font-medium hover:underline`}>
              Contact our sales team
            </NavLink>
          </p>
        </div>
      </div>
    </section>
  );
}
