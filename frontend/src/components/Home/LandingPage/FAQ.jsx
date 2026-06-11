import React, { useState } from "react";
import { ChevronDown, ChevronUp, Mic, Send, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetUserFaqsQuery } from "../../../services/LangingPage_Management/frontendFaqApi";
import PrimaryLoader from "../../../components/ui/PrimaryLoader";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);
  const { data, isLoading } = useGetUserFaqsQuery();
  const faqs = data?.data || [];


  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-4 sm:py-6 md:py-8 bg-white overflow-hidden">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-forestGreen mb-1 sm:mb-2">
            Got Questions? We've Got Answers
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-sm sm:max-w-md md:max-w-xl mx-auto">
            Find answers to commonly asked questions <br className="hidden xs:block" /> about our platform, courses, and policies.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[13fr_7fr] gap-6 sm:gap-8 md:gap-10 lg:gap-20 items-start">
          {/* Left Column: FAQ Accordion */}
          <div className="space-y-2 sm:space-y-3">
            {isLoading && (
              <div className="flex justify-center items-center py-10">
                <PrimaryLoader />
              </div>
            )}
            {!isLoading && faqs.map((faq, index) => (
              <div
                key={index}
                className={`border rounded-lg sm:rounded-xl lg:rounded-xl bg-sand overflow-hidden transition-all duration-300 ${openIndex === index ? 'border-gray-300' : 'border-transparent'}`}
              >
                <button
                  className="flex justify-between items-center w-full p-3 xs:p-3.5 sm:p-4 text-left bg-sand hover:bg-sand/80 transition-colors"
                  onClick={() => toggleFAQ(index)}
                >
                  <h3 className="px-1 xs:px-2 sm:px-3 text-sm xs:text-sm sm:text-base md:text-md font-semibold text-forestGreen pr-2 flex-1 text-left">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0 ml-2">
                    <ChevronDown
                      className={`w-4 h-4 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-4 xs:px-5 sm:px-6 md:px-7 pb-3 xs:pb-3.5 sm:pb-4 text-gray-600 text-xs xs:text-sm sm:text-sm leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Right Column: Image & Help Card */}
          <div className="relative flex flex-col items-center mt-4 xs:mt-5 sm:mt-6 lg:mt-0">
            {/* Illustration Image */}
            <div className="z-10 w-full max-w-[140px] xs:max-w-[160px] sm:max-w-[180px] md:max-w-[200px] lg:max-w-[200px] mb-3 xs:mb-4 sm:mb-5">
              <img
                src="/assets/need help 2 3.png"
                alt="Support Team"
                className="w-full h-auto object-contain"
              />
            </div>

            {/* Help Card */}
            <div
              className="w-full bg-sand rounded-xl sm:rounded-2xl p-4 xs:p-5 sm:p-6 relative"
              style={{
                backgroundImage: `url('/assets/Mask group (3).png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <div className="flex items-center gap-2 xs:gap-3 mb-2">
                <img
                  src="/assets/Layer_22.png"
                  alt="Help Icon"
                  className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 object-contain"
                />
                <h3 className="text-sm xs:text-base sm:text-md font-bold text-forestGreen">
                  Need Help? Chat With Us
                </h3>
              </div>

              <p className="text-gray-600 text-xs xs:text-xs sm:text-sm mb-4 xs:mb-5 sm:mb-6 leading-relaxed">
                Our smart learning assistant is here to help you 24/7. Get instant answers about courses, enrollment, certificates, and platform features. Whether you're exploring or already learning, support is just a message away.
              </p>

              {/* Chat Input */}
              <div className="bg-white rounded-lg sm:rounded-[0.5rem] p-2 xs:p-2.5 sm:p-2 md:p-2 lg:pl-6 flex items-center shadow-sm border border-gray-100">
                <input
                  type="text"
                  placeholder="Ask your own question here..."
                  className="flex-1 bg-transparent border-none outline-none text-xs xs:text-sm text-gray-700 placeholder-gray-400 px-2 xs:px-3"
                />
                <div className="flex items-center gap-1 xs:gap-2">
                  <Mic className="w-4 h-4 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
                  <button className="bg-forestGreen rounded-full p-1.5 xs:p-2 sm:p-2 text-white hover:bg-forestGreen/90 transition-colors">
                    <Send className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 rotate-45" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}