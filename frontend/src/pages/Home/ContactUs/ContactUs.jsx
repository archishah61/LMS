import React, { useState, useEffect } from "react";
import { Send, CheckCircle, Mail, Phone, MapPin, MessageSquare, ArrowRight, Clock, ExternalLink } from "lucide-react";
import { useCreateContactMutation } from "../../../services/Support/contactApi";
import { Helmet } from "react-helmet-async";
import { useGetSeoMetaByPageTypeQuery } from "../../../services/LegalPages/seoMetaAPI";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const TypingText = ({ text, className = "" }) => {
  return (
    <motion.div
      key={text}
      initial={{ opacity: 1 }}
      className={`inline-block ${className}`}
    >
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.05,
            delay: index * 0.05,
            placeholder: false
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
};

const ContactUs = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [activeTab, setActiveTab] = useState("General");
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  const [formStatus, setFormStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  const [createContact, { isLoading }] = useCreateContactMutation();

  const { data: seoMetaData, isLoading: seoMetaLoading, error: seoMetaError } = useGetSeoMetaByPageTypeQuery({
    page_type: "contact-us"
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const tabs = ["General", "Courses", "Payments", "Technical"];

  // Function to get full URLs for images
  const getFullUrl = (path) => {
    if (!path) return null;
    return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${path}`;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFocus = (field) => setFocusedField(field);
  const handleBlur = () => setFocusedField(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await createContact({
        fullName: formData.fullName,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      }).unwrap();
      setFormStatus("success");
      setTimeout(() => {
        setFormStatus(null);
        setFormData({ fullName: "", email: "", subject: "", message: "" });
      }, 5000);
    } catch (error) {
      setFormStatus("error");
      setErrorMessage(error?.data?.error || "Failed to send message. Please try again.");
    }
  };

  const seo = seoMetaData?.data;

  // Support Highlights Data (Replaces direct contact info)
  const supportHighlights = [
    {
      title: "24/7 Priority Support",
      description: "Get answers whenever you need them"
    },
    {
      title: "Expert Assistance",
      description: "Direct access to course specialists"
    },
    {
      title: "Community Access",
      description: "Join our vibrant learning network"
    },
    {
      title: "Quick Resolution",
      description: "Fast turnaround on all inquiries"
    }
  ];

  return (
    <div className="bg-white container px-8 text-gray-900 py-4 sm:py-6">
      <Helmet>
        {Boolean(seo?.is_active) ? (
          <>
            {/* Basic SEO */}
            <title>{seo?.seo_title || "Contact Us"}</title>
            <meta name="description" content={seo?.seo_description} />
            <meta name="keywords" content={seo?.seo_keywords} />
            <link rel="canonical" href={seo?.canonical_url || window.location.href} />

            {/* OG Tags */}
            <meta property="og:title" content={seo?.og_title || seo?.seo_title} />
            <meta property="og:description" content={seo?.og_description || seo?.seo_description} />
            <meta property="og:image" content={getFullUrl(seo?.og_image) || getFullUrl(seo?.seo_image)} />
            <meta property="og:image:alt" content={seo?.og_alt} />
            <meta property="og:url" content={seo?.canonical_url || window.location.href} />
            <meta property="og:type" content="website" />

            {/* Optional image dimensions */}
            {seo?.seo_image && (
              <>
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
              </>
            )}

            {/* Twitter Tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={seo?.og_title || seo?.seo_title} />
            <meta name="twitter:description" content={seo?.og_description || seo?.seo_description} />
            <meta name="twitter:image" content={getFullUrl(seo?.og_image) || getFullUrl(seo?.seo_image)} />
            <meta name="twitter:image:alt" content={seo?.og_alt} />

            {/* JSON-LD Structured Data */}
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ContactPage",
                "name": seo?.seo_title,
                "description": seo?.seo_description,
                "url": seo?.canonical_url || window.location.href,
                "image": getFullUrl(seo?.seo_image),
              })}
            </script>
          </>
        ) : (
          <>
            {/* RESET SEO */}
            <title>Queekies</title>
            <meta name="description" content="" />
            <meta name="keywords" content="" />
            <link rel="canonical" href={window.location.href} />

            {/* Clear OG */}
            <meta property="og:title" content="Queekies" />
            <meta property="og:description" content="" />
            <meta property="og:image" content="" />
            <meta property="og:url" content={window.location.href} />

            {/* Clear Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Queekies" />
            <meta name="twitter:description" content="" />
            <meta name="twitter:image" content="" />
          </>
        )}
      </Helmet>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 md:gap-10 lg:gap-12">

        {/* Sidebar Section */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-8 h-full">
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-forestGreen text-white p-6 sm:p-8 min-h-[400px] sm:min-h-[450px] md:min-h-[500px] h-full flex flex-col justify-between shadow-lg sm:shadow-xl">
            {/* Background Assets */}
            <div className="absolute inset-0 pointer-events-none">
              <img
                src="/assets/background_pattern.png"
                className="absolute top-0 right-0 w-full h-full object-cover opacity-10"
                alt=""
              />
              {/* Decorative gradients */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent opacity-50" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 backdrop-blur-sm rounded-lg sm:rounded-xl mb-3 sm:mb-4 border border-primary/20 shadow-inner">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-6 text-primary" />
              </div>

              <h1 className="text-xl xs:text-2xl sm:text-2.5xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 leading-tight tracking-tight">
                Get in
                <span className="text-primary"> Touch</span>
              </h1>

              <p className="text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed mb-6 sm:mb-8 md:mb-10">
                Have questions or need assistance? Our team is here to help you succeed on your learning journey.
              </p>

              <div className="space-y-4 sm:space-y-5 md:space-y-6">
                {supportHighlights.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 sm:gap-4 group">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10 mt-0.5">
                      <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold text-gray-50 mb-0.5">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-400">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-white/10">
              <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">Ready to start learning?</p>
              <Link
                to="/courses"
                className="w-full bg-white/5 text-white border border-white/10 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all flex items-center justify-between group text-sm sm:text-base"
              >
                <span>Explore Courses</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-7 h-full">
          <motion.div
            className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-4 xs:p-5 sm:p-6 md:p-8 h-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2">Send us a Message</h2>
              <div className="text-gray-500 text-xs xs:text-xs sm:text-sm md:text-base min-h-[1.25rem] xs:min-h-[1.5rem] sm:min-h-[1.5rem]">
                {activeTab === "General" && (
                  <TypingText
                    text="We'd love to hear from you. Fill out this form."
                    className="whitespace-normal xs:whitespace-nowrap"
                  />
                )}
                {activeTab === "Courses" && (
                  <TypingText
                    text="Course questions? We're here to help."
                    className="whitespace-normal"
                  />
                )}
                {activeTab === "Payments" && (
                  <TypingText
                    text="Need billing help? Let us know."
                    className="whitespace-normal"
                  />
                )}
                {activeTab === "Technical" && (
                  <TypingText
                    text="Technical issues? Describe them below."
                    className="whitespace-normal"
                  />
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5 xs:gap-2 mb-6 sm:mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md sm:rounded-lg text-xs xs:text-sm font-medium transition-all duration-200 ${activeTab === tab
                    ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                    : "bg-gray-50 text-gray-600"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {formStatus === "success" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 rounded-lg sm:rounded-xl p-4 xs:p-5 sm:p-6 md:p-8 text-center"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-green-100 text-leafGreen rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                </div>
                <h3 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2">Message Sent!</h3>
                <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
                  Thank you for contacting us. We will get back to you shortly.
                </p>
                <button
                  onClick={() => setFormStatus(null)}
                  className="text-primary font-medium hover:underline text-sm sm:text-base"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
                {formStatus === "error" && (
                  <div className="p-3 xs:p-4 bg-red-50 border border-red-100 rounded-lg sm:rounded-xl text-red-600 text-xs xs:text-sm flex items-start gap-2 sm:gap-3">
                    <div className="shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    {errorMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      onFocus={() => handleFocus("fullName")}
                      onBlur={handleBlur}
                      required
                      className={`w-full px-3 xs:px-4 py-2.5 sm:py-3 bg-gray-50 border rounded-lg text-xs xs:text-sm focus:outline-none transition-all ${focusedField === "fullName" ? "border-primary" : "border-gray-200"
                        }`}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => handleFocus("email")}
                      onBlur={handleBlur}
                      required
                      className={`w-full px-3 xs:px-4 py-2.5 sm:py-3 bg-gray-50 border rounded-lg text-xs xs:text-sm focus:outline-none transition-all ${focusedField === "email" ? "border-primary" : "border-gray-200"
                        }`}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Subject</label>
                  <div className="relative">
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      onFocus={() => handleFocus("subject")}
                      onBlur={handleBlur}
                      required
                      className={`w-full px-3 xs:px-4 py-2.5 sm:py-3 bg-gray-50 border rounded-lg text-xs xs:text-sm focus:outline-none transition-all appearance-none cursor-pointer ${focusedField === "subject" ? "border-primary" : "border-gray-200"
                        }`}
                    >
                      <option value="">Select a subject</option>
                      {activeTab === "General" && (
                        <>
                          <option value="general_inquiry">General Inquiry</option>
                          <option value="feedback">Feedback</option>
                          <option value="partnership">Partnership Opportunity</option>
                        </>
                      )}
                      {activeTab === "Courses" && (
                        <>
                          <option value="course_access">Course Access Issues</option>
                          <option value="content_question">Question About Content</option>
                          <option value="certificate">Certificate Problem</option>
                        </>
                      )}
                      {activeTab === "Payments" && (
                        <>
                          <option value="payment_methods">Payment Methods</option>
                          <option value="refund_request">Refund Request</option>
                          <option value="discount_inquiry">Discount Inquiry</option>
                        </>
                      )}
                      {activeTab === "Technical" && (
                        <>
                          <option value="login_issues">Login Issues</option>
                          <option value="payment_problem">Payment Problem</option>
                          <option value="site_bug">Website Bug</option>
                        </>
                      )}
                    </select>
                    <div className="absolute right-3 xs:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    onFocus={() => handleFocus("message")}
                    onBlur={handleBlur}
                    required
                    rows="4"
                    className={`w-full px-3 xs:px-4 py-2.5 sm:py-3 bg-gray-50 border rounded-lg text-xs xs:text-sm focus:outline-none transition-all resize-none ${focusedField === "message" ? "border-primary" : "border-gray-200"
                      }`}
                    placeholder="Describe your issue or question in detail..."
                  ></textarea>
                </div>

                <div className="pt-1 sm:pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full xs:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-leafGreen text-white font-semibold rounded-lg sm:rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm text-xs xs:text-sm sm:text-base"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Message</span>
                        <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;