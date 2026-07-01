"use client"
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import toast, { Toaster } from "react-hot-toast"
import {
  User,
  Building2,
  Mail,
  Phone,
  Globe,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Shield,
  FileText,
  CheckCircle,
  X,
  ChevronDown
} from "lucide-react"
import { useRegisterPartnerMutation } from "../../services/Become_partner/becomePartnerApi"
import { getStudentToken } from "../../services/CookieService"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

import { useGetTermsOfServiceByCategoryQuery } from "../../services/LegalPages/termsOfServices";
import { useGetPrivacyPolicyByCategoryQuery } from "../../services/LegalPages/privacyPolicy";
import { useGetPartnerStatusByIdQuery } from "../../services/Become_partner/isPartnerActiveAPI"
import SupportModal from "../../components/modal/SupportModal"
import FeatureInterestModal from "../../components/modal/FeatureInterestModal"
import { useGetFeatureStatusByNameQuery } from "../../services/Masters/featureStatusAPI"
import ComingSoonModal2 from "../../components/modal/ComingSoonModal2"; // Import the reusable component
import PrimaryLoader from "../../components/ui/PrimaryLoader";

export default function PartnerRegister() {
  const [registerPartner, { isLoading }] = useRegisterPartnerMutation()
  const { access_token } = getStudentToken()
  const { id: userId } = useSelector((state) => state.user)
  const navigate = useNavigate()

  // Feature status query - check if partner feature is active
  const {
    data: featureData,
    isLoading: featureDataLoading,
    error: featureDataError
  } = useGetFeatureStatusByNameQuery(
    { name: "become_a_partner" }
  )

  const { data: partnerFeatureStatus, isLoading: statusLoading, isError: statusError } = useGetPartnerStatusByIdQuery({
    id: 1,
  });

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const [formData, setFormData] = useState({
    user_id: userId,
    partnerType: "Individual",
    fullName: "",
    email: "",
    phone: "",
    website: "",
    organizationType: "",
    contactPersonName: "",
    contactPersonEmail: "",
    contactPersonPhone: "",
    agreeToTerms: false,
  })

  useEffect(() => {
    setFormData(prev => ({ ...prev, ["user_id"]: userId }));
  }, [userId])

  const [errors, setErrors] = useState({})
  const [submissionStatus, setSubmissionStatus] = useState({ success: false, message: "" })
  const [focusedField, setFocusedField] = useState(null)

  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", content: [] });
  const [isClosing, setIsClosing] = useState(false);

  const [isSupportModalOpen, setSupportModalOpen] = useState(false);

  const {
    data: termsData,
    isLoading: termsLoading,
    error: termsError,
  } = useGetTermsOfServiceByCategoryQuery({ category: "partner" });

  const {
    data: privacyData,
    isLoading: privacyLoading,
    error: privacyError,
  } = useGetPrivacyPolicyByCategoryQuery("partner");

  // Real-time phone validation helper
  const validatePhoneRealTime = (phone, fieldName = 'phone') => {
    if (!phone) {
      setErrors({ ...errors, [fieldName]: "Phone number is required" });
      toast.error("Phone number is required", { duration: 4000, position: 'top-right' });
      return false;
    }
    if (!/^\d{10}$/.test(phone)) {
      setErrors({ ...errors, [fieldName]: "Phone number must be exactly 10 digits" });
      toast.error("Phone number must be exactly 10 digits (no spaces or dashes)", { duration: 4000, position: 'top-right' });
      return false;
    }
    setErrors({ ...errors, [fieldName]: null });
    return true;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
    if (errors[name]) {
      setErrors({ ...errors, [name]: null })
    }

    // Real-time phone validation for phone fields
    if (name === 'phone' || name === 'contactPersonPhone') {
      // Remove non-digits for better UX
      const cleanValue = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: cleanValue }));
      if (cleanValue.length === 10) {
        validatePhoneRealTime(cleanValue, name);
      }
    }
  }

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName)
  }

  const handleBlur = () => {
    setFocusedField(null)
    // Validate phone on blur
    if (formData.phone && (formData.phone.length === 10)) {
      validatePhoneRealTime(formData.phone, 'phone');
    }
    if (formData.partnerType === "Organization" && formData.contactPersonPhone && (formData.contactPersonPhone.length === 10)) {
      validatePhoneRealTime(formData.contactPersonPhone, 'contactPersonPhone');
    }
  }

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowPolicyModal(false);
      setIsClosing(false);
    }, 200);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    };
  };

  const validateForm = () => {
    const newErrors = {}
    if (!formData.fullName) newErrors.fullName = "Name is required"
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }
    if (!formData.phone || !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits"
    }

    if (formData.partnerType === "Organization") {
      if (!formData.organizationType) newErrors.organizationType = "Organization type is required"
      if (!formData.contactPersonName) newErrors.contactPersonName = "Contact person name is required"
      if (!formData.contactPersonEmail) {
        newErrors.contactPersonEmail = "Contact person email is required"
      } else if (!/\S+@\S+\.\S+/.test(formData.contactPersonEmail)) {
        newErrors.contactPersonEmail = "Contact person email is invalid"
      }
      if (!formData.contactPersonPhone || !/^\d{10}$/.test(formData.contactPersonPhone)) {
        newErrors.contactPersonPhone = "Contact person phone must be exactly 10 digits"
      }
    }

    if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to terms"
    return newErrors
  }

  const resetForm = () => {
    setFormData({
      user_id: userId,
      partnerType: "Individual",
      fullName: "",
      email: "",
      phone: "",
      website: "",
      organizationType: "",
      contactPersonName: "",
      contactPersonEmail: "",
      contactPersonPhone: "",
      agreeToTerms: false,
    })
    setErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formErrors = validateForm()
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      // Show toast for each validation error
      Object.entries(formErrors).forEach(([key, error]) => {
        toast.error(error, {
          duration: 5000,
          position: 'top-right',
        });
      });
      return
    }

    if (!access_token) {
      toast.error("You must be logged in to register as a partner.", {
        duration: 5000,
        position: 'top-right',
      });
      return
    }

    try {
      const submitData = new FormData()
      for (const key in formData) {
        if (key === "confirmPassword") continue
        if (key === "logo" && formData[key]) {
          submitData.append("logo", formData[key])
        } else if (formData[key] !== null) {
          submitData.append(key, formData[key])
        }
      }

      const response = await registerPartner({
        formData: submitData,
        access_token,
      }).unwrap()

      setSubmissionStatus({
        success: true,
        message: "Registration successful! Please check your email for verification.",
      })

      toast.success("Registration successful! Please check your email for verification.", {
        duration: 5000,
        position: 'top-right',
      });
      resetForm()
    } catch (error) {
      console.error("Registration error:", error) // Log full error for debugging
      const errorMessage = error.data?.message || "Registration failed. Please try again.";

      // Show exact server error (no hardcoded overrides)
      toast.error(errorMessage, {
        duration: 6000, // Longer for debugging
        position: 'top-right',
      });

      if (error.data?.errors) {
        setErrors(error.data.errors)
        // Show exact server field errors
        Object.entries(error.data.errors).forEach(([key, error]) => {
          if (Array.isArray(error)) {
            error.forEach(err => toast.error(`${key}: ${err}`, { duration: 5000, position: 'top-right' }));
          } else {
            toast.error(`${key}: ${error}`, { duration: 5000, position: 'top-right' });
          }
        });
      }
    }
  }

  const handleOpenPolicyModal = (type) => {
    if (type === "Terms") {
      const activeSentences =
        termsData?.data
          ?.filter((item) => item.status === "active")
          ?.flatMap((item) => item.sentences) || [];
      setModalContent({
        title: "Terms of Service",
        content: activeSentences.length > 0 ? activeSentences : ["There is no data in Terms of Service."],
      });
    } else {
      const sentences = privacyData?.data
        ?.filter((item) => item.status === "active")
        ?.flatMap((item) => item.sentences) || [];
      setModalContent({
        title: "Privacy Policy",
        content: sentences.length > 0 ? sentences : ["There is no data in Privacy Policy."],
      });
    }
    setShowPolicyModal(true);
  };

  const renderSuccessMessage = () => {
    if (!submissionStatus.success) return null
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl p-6 w-full max-w-md text-center shadow-2xl mx-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 25 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle2 className="w-8 h-8" />
          </motion.div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Registration Successful!</h3>
          <p className="text-gray-600 mb-6 text-sm">{submissionStatus.message}</p>
          <motion.button
            className="px-6 py-2.5 text-white font-medium rounded-md shadow-sm w-full sm:w-auto bg-leafGreen"
            whileTap={{ scale: 0.95 }}
            onClick={() => setSubmissionStatus({ success: false, message: "" })}
          >
            Close
          </motion.button>
        </motion.div>
      </motion.div>
    )
  }

  // Show coming soon page if feature is inactive - this check happens FIRST
  if (featureData?.is_active === 0) {
    return <ComingSoonModal2 featureData={featureData} />;
  }

  // Show loading state for feature status
  if (featureDataLoading) {
    return <PrimaryLoader />;
  }

  // Show error state for feature status
  if (featureDataError) {
    return (
      <div className="text-red-500 text-center p-4 bg-red-50 min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
          <p>Error loading partner registration: {featureDataError?.toString()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-900 py-4 xs:py-6 sm:py-8 lg:py-6">
      <Toaster />

      {renderSuccessMessage()}

      <div className="container mx-auto px-2.5 xs:px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">
          {/* Sidebar Section */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-8 lg:sticky lg:top-8">
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-forestGreen text-white p-4 xs:p-5 sm:p-6 md:p-8 min-h-[420px] xs:min-h-[460px] sm:min-h-[500px] flex flex-col justify-between">
              {/* Background Assets */}
              <div className="absolute inset-0 pointer-events-none">
                <img src="/assets/background_pattern.png" className="absolute top-0 right-0 w-full h-full object-cover opacity-10" alt="" />
              </div>

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-10 h-10 xs:w-12 xs:h-12 sm:w-12 sm:h-12 bg-primary/20 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-xl border border-primary/20 mb-4 xs:mb-5 sm:mb-6">
                  <Building2 className="w-5 h-5 xs:w-6 xs:h-6 sm:w-6 sm:h-6 text-primary" />
                </div>

                <h1 className="text-2xl xs:text-2.5xl sm:text-3xl md:text-4xl font-bold mb-3 xs:mb-4 sm:mb-4 leading-tight">
                  Join Our <br />
                  <span className="text-primary">Partner Network</span>
                </h1>

                <p className="text-gray-300 text-base xs:text-lg sm:text-lg leading-relaxed mb-6 xs:mb-7 sm:mb-8">
                  Unlock exclusive opportunities, verified status, and tools to grow your institution.
                </p>

                <div className="space-y-4 xs:space-y-5 sm:space-y-6">
                  {[
                    "Verified Partner Badge",
                    "Tap Into a Ready to Learn Audience",
                    "Premium Support",
                    "Growth Analytics"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 xs:gap-4 sm:gap-4 group">
                      <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 xs:w-5 xs:h-5 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <span className="text-gray-200 font-medium text-sm xs:text-base sm:text-base leading-tight">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 pt-6 xs:pt-7 sm:pt-8 mt-6 xs:mt-7 sm:mt-8 border-t border-white/10">
                <p className="text-xs xs:text-sm sm:text-sm text-gray-400 mb-3 xs:mb-4 sm:mb-4">Already a partner?</p>
                <button
                  onClick={() => navigate("/admin/login")}
                  className="w-full bg-white/5 text-white border border-white/10 px-4 xs:px-5 sm:px-6 py-2.5 xs:py-3 sm:py-3 rounded-lg xs:rounded-xl sm:rounded-xl font-medium transition-all flex items-center justify-between group hover:bg-white/10 text-sm xs:text-base sm:text-base"
                >
                  <span>Log in to Dashboard</span>
                  <ArrowRight className="w-4 h-4 xs:w-4 xs:h-4 sm:w-4 sm:h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-7">
            <motion.div
              className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-4 xs:p-5 sm:p-6 md:p-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6 xs:mb-7 sm:mb-8">
                <h2 className="text-xl xs:text-2xl sm:text-2xl font-bold text-gray-900 mb-1.5 xs:mb-2 sm:mb-2">Registration</h2>
                <p className="text-gray-500 text-sm xs:text-base sm:text-base">Fill in your details to get started.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 xs:space-y-5 sm:space-y-6">
                {/* Partner Type Selection - Responsive Horizontal/Vertical */}
                <div className="grid grid-cols-1 min-[435px]:grid-cols-2 gap-2.5 xs:gap-3 sm:gap-4">
                  {[
                    {
                      value: "Individual",
                      label: "Individual",
                      desc: "For freelancers",
                      icon: <User className="w-4 h-4 xs:w-4 xs:h-4 sm:w-4 sm:h-4" />,
                    },
                    {
                      value: "Organization",
                      label: "Organization",
                      desc: "For companies",
                      icon: <Building2 className="w-4 h-4 xs:w-4 xs:h-4 sm:w-4 sm:h-4" />,
                    },
                  ].map((type) => (
                    <div
                      key={type.value}
                      className={`relative flex items-center p-2 xs:p-2.5 sm:p-3 rounded-lg xs:rounded-xl sm:rounded-xl border cursor-pointer transition-all duration-200 min-[435px]:h-auto ${formData.partnerType === type.value
                        ? "border-primary bg-primary/5 shadow-[0_0_0_1px_rgba(34,197,94,1)]"
                        : "border-gray-100 hover:border-primary/30 hover:bg-gray-50"
                        }`}
                      onClick={() => setFormData({ ...formData, partnerType: type.value })}
                    >
                      <div
                        className={`inline-flex items-center justify-center w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-lg xs:rounded-lg sm:rounded-lg mr-2 xs:mr-3 sm:mr-4 flex-shrink-0 ${formData.partnerType === type.value ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}
                      >
                        {type.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className={`block text-xs xs:text-sm sm:text-sm font-semibold truncate ${formData.partnerType === type.value ? "text-gray-900" : "text-gray-700"}`}>
                          {type.label}
                        </span>
                        <span className="text-xs text-gray-500 truncate block">{type.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 xs:space-y-4 sm:space-y-4">
                  {/* Name/Org Name */}
                  <div>
                    <label className="block text-xs xs:text-sm sm:text-sm font-medium text-gray-700 mb-1 xs:mb-1.5 sm:mb-1.5">
                      {formData.partnerType === "Individual" ? "Full Name" : "Organization Name"}
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      onFocus={() => handleFocus("fullName")}
                      onBlur={handleBlur}
                      className={`w-full px-3 xs:px-4 sm:px-4 py-2.5 xs:py-3 sm:py-3 bg-gray-50 border rounded-lg xs:rounded-lg sm:rounded-lg text-sm focus:outline-none transition-all ${errors.fullName
                        ? "border-red-300"
                        : focusedField === "fullName"
                          ? "border-primary"
                          : "border-gray-200"
                        }`}
                      placeholder={formData.partnerType === "Individual" ? "e.g. John Doe" : "e.g. Acme Corp"}
                    />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1 xs:mt-1.5 sm:mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3 xs:w-3 xs:h-3 sm:w-3 sm:h-3" /> {errors.fullName}</p>}
                  </div>

                  {/* Organization Type (Conditional) */}
                  {formData.partnerType === "Organization" && (
                    <div>
                      <label className="block text-xs xs:text-sm sm:text-sm font-medium text-gray-700 mb-1 xs:mb-1.5 sm:mb-1.5">Organization Type</label>
                      <div className="relative">
                        <select
                          name="organizationType"
                          value={formData.organizationType}
                          onChange={handleChange}
                          onFocus={() => handleFocus("organizationType")}
                          onBlur={handleBlur}
                          className={`w-full px-3 xs:px-4 sm:px-4 py-2.5 xs:py-3 sm:py-3 bg-gray-50 border rounded-lg xs:rounded-lg sm:rounded-lg text-sm focus:outline-none transition-all appearance-none ${errors.organizationType
                            ? "border-red-300"
                            : focusedField === "organizationType"
                              ? "border-primary"
                              : "border-gray-200"
                            }`}
                        >
                          <option value="">Select Type</option>
                          <option value="Institute">Institute</option>
                          <option value="College">College</option>
                          <option value="School">School</option>
                          <option value="Company">Company</option>
                          <option value="NGO">NGO</option>
                          <option value="Other">Other</option>
                        </select>
                        <ChevronDown className="absolute right-3 xs:right-4 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.organizationType && <p className="text-red-500 text-xs mt-1 xs:mt-1.5 sm:mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3 xs:w-3 xs:h-3 sm:w-3 sm:h-3" /> {errors.organizationType}</p>}
                    </div>
                  )}

                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4 sm:gap-4">
                    {/* Email */}
                    <div>
                      <label className="block text-xs xs:text-sm sm:text-sm font-medium text-gray-700 mb-1 xs:mb-1.5 sm:mb-1.5">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={() => handleFocus("email")}
                        onBlur={handleBlur}
                        className={`w-full px-3 xs:px-4 sm:px-4 py-2.5 xs:py-3 sm:py-3 bg-gray-50 border rounded-lg xs:rounded-lg sm:rounded-lg text-sm focus:outline-none transition-all ${errors.email
                          ? "border-red-300"
                          : focusedField === "email"
                            ? "border-primary"
                            : "border-gray-200"
                          }`}
                        placeholder="john@example.com"
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1 xs:mt-1.5 sm:mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3 xs:w-3 xs:h-3 sm:w-3 sm:h-3" /> {errors.email}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs xs:text-sm sm:text-sm font-medium text-gray-700 mb-1 xs:mb-1.5 sm:mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        onFocus={() => handleFocus("phone")}
                        onBlur={handleBlur}
                        maxLength={10}
                        className={`w-full px-3 xs:px-4 sm:px-4 py-2.5 xs:py-3 sm:py-3 bg-gray-50 border rounded-lg xs:rounded-lg sm:rounded-lg text-sm focus:outline-none transition-all ${errors.phone
                          ? "border-red-300"
                          : focusedField === "phone"
                            ? "border-primary"
                            : "border-gray-200"
                          }`}
                        placeholder="1234567890"
                      />
                      {errors.phone && <p className="text-red-500 text-xs mt-1 xs:mt-1.5 sm:mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3 xs:w-3 xs:h-3 sm:w-3 sm:h-3" /> {errors.phone}</p>}
                    </div>
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-xs xs:text-sm sm:text-sm font-medium text-gray-700 mb-1 xs:mb-1.5 sm:mb-1.5">Website <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      onFocus={() => handleFocus("website")}
                      onBlur={handleBlur}
                      className={`w-full px-3 xs:px-4 sm:px-4 py-2.5 xs:py-3 sm:py-3 bg-gray-50 border rounded-lg xs:rounded-lg sm:rounded-lg text-sm focus:outline-none transition-all ${focusedField === "website" ? "border-primary" : "border-gray-200"}`}
                      placeholder="https://"
                    />
                  </div>
                </div>

                {/* Organization Contact Person Section */}
                {formData.partnerType === "Organization" && (
                  <div className="bg-gray-50/50 p-4 xs:p-5 sm:p-6 rounded-lg xs:rounded-xl sm:rounded-xl border border-gray-100 space-y-3 xs:space-y-4 sm:space-y-4">
                    <div className="flex items-center gap-2 text-gray-900 mb-1 xs:mb-2 sm:mb-2">
                      <User className="w-4 h-4 xs:w-4 xs:h-4 sm:w-4 sm:h-4 text-primary" />
                      <h3 className="text-xs xs:text-sm sm:text-sm font-semibold uppercase tracking-wider">Contact Person Details</h3>
                    </div>

                    <div>
                      <label className="block text-xs xs:text-sm sm:text-sm font-medium text-gray-700 mb-1 xs:mb-1.5 sm:mb-1.5">Full Name</label>
                      <input
                        type="text"
                        name="contactPersonName"
                        value={formData.contactPersonName}
                        onChange={handleChange}
                        onFocus={() => handleFocus("contactPersonName")}
                        onBlur={handleBlur}
                        className={`w-full px-3 xs:px-4 sm:px-4 py-2.5 xs:py-3 sm:py-3 bg-white border rounded-lg xs:rounded-lg sm:rounded-lg text-sm focus:outline-none transition-all ${errors.contactPersonName
                          ? "border-red-300"
                          : focusedField === "contactPersonName"
                            ? "border-primary"
                            : "border-gray-200"
                          }`}
                        placeholder="Contact person name"
                      />
                      {errors.contactPersonName && <p className="text-red-500 text-xs mt-1 xs:mt-1.5 sm:mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3 xs:w-3 xs:h-3 sm:w-3 sm:h-3" /> {errors.contactPersonName}</p>}
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4 sm:gap-4">
                      <div>
                        <label className="block text-xs xs:text-sm sm:text-sm font-medium text-gray-700 mb-1 xs:mb-1.5 sm:mb-1.5">Email</label>
                        <input
                          type="email"
                          name="contactPersonEmail"
                          value={formData.contactPersonEmail}
                          onChange={handleChange}
                          onFocus={() => handleFocus("contactPersonEmail")}
                          onBlur={handleBlur}
                          className={`w-full px-3 xs:px-4 sm:px-4 py-2.5 xs:py-3 sm:py-3 bg-white border rounded-lg xs:rounded-lg sm:rounded-lg text-sm focus:outline-none transition-all ${errors.contactPersonEmail
                            ? "border-red-300"
                            : focusedField === "contactPersonEmail"
                              ? "border-primary"
                              : "border-gray-200"
                            }`}
                          placeholder="Contact person email"
                        />
                        {errors.contactPersonEmail && <p className="text-red-500 text-xs mt-1 xs:mt-1.5 sm:mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3 xs:w-3 xs:h-3 sm:w-3 sm:h-3" /> {errors.contactPersonEmail}</p>}
                      </div>

                      <div>
                        <label className="block text-xs xs:text-sm sm:text-sm font-medium text-gray-700 mb-1 xs:mb-1.5 sm:mb-1.5">Phone</label>
                        <input
                          type="tel"
                          name="contactPersonPhone"
                          value={formData.contactPersonPhone}
                          onChange={handleChange}
                          onFocus={() => handleFocus("contactPersonPhone")}
                          onBlur={handleBlur}
                          maxLength={10}
                          className={`w-full px-3 xs:px-4 sm:px-4 py-2.5 xs:py-3 sm:py-3 bg-white border rounded-lg xs:rounded-lg sm:rounded-lg text-sm focus:outline-none transition-all ${errors.contactPersonPhone
                            ? "border-red-300"
                            : focusedField === "contactPersonPhone"
                              ? "border-primary"
                              : "border-gray-200"
                            }`}
                          placeholder="Contact person phone"
                        />
                        {errors.contactPersonPhone && <p className="text-red-500 text-xs mt-1 xs:mt-1.5 sm:mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3 xs:w-3 xs:h-3 sm:w-3 sm:h-3" /> {errors.contactPersonPhone}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="pt-4 xs:pt-5 sm:pt-6 mt-6 xs:mt-7 sm:mt-8 border-t border-gray-100">
                  <div className="flex flex-col gap-3 xs:gap-4 sm:gap-4">
                    <label className="flex items-start gap-2 xs:gap-3 sm:gap-3 p-3 xs:p-4 sm:p-4 rounded-lg xs:rounded-xl sm:rounded-xl border border-gray-100 bg-gray-50/50 cursor-pointer">
                      <input
                        id="agreeToTerms"
                        name="agreeToTerms"
                        type="checkbox"
                        checked={formData.agreeToTerms}
                        onChange={handleChange}
                        className="mt-0.5 xs:mt-1 accent-leafGreen sm:mt-1 h-4 w-4 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-primary border-gray-300 rounded cursor-pointer flex-shrink-0"
                      />
                      <div className="text-xs xs:text-sm sm:text-sm text-gray-600 leading-relaxed">
                        I agree to the{" "}
                        <button type="button" onClick={(e) => { e.preventDefault(); handleOpenPolicyModal("Terms") }} className="text-primary font-medium hover:underline">Terms of Service</button>
                        {" "}and{" "}
                        <button type="button" onClick={(e) => { e.preventDefault(); handleOpenPolicyModal("Privacy") }} className="text-primary font-medium hover:underline">Privacy Policy</button>.
                        {errors.agreeToTerms && <p className="text-red-500 text-xs mt-1">{errors.agreeToTerms}</p>}
                      </div>
                    </label>

                    <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 xs:gap-4 sm:gap-4 pt-1 xs:pt-2 sm:pt-2">
                      <button
                        type="button"
                        onClick={() => setSupportModalOpen(true)}
                        className="text-xs xs:text-sm sm:text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors w-full xs:w-auto text-left xs:text-left"
                      >
                        Need help?
                      </button>

                      <motion.button
                        type="submit"
                        className="w-full xs:w-auto px-6 xs:px-8 sm:px-10 py-2.5 xs:py-3 sm:py-3 bg-leafGreen text-white font-semibold rounded-lg xs:rounded-xl sm:rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm xs:text-sm sm:text-base"
                        whileTap={{ scale: 0.98 }}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4 xs:h-5 xs:w-5 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            Register Now
                            <ArrowRight className="h-4 w-4 xs:h-5 xs:w-5 sm:h-5 sm:w-5" />
                          </span>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>

      {showPolicyModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-2.5 xs:p-4 sm:p-4 transition-all duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={handleBackdropClick}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className={`relative bg-white rounded-lg sm:rounded-xl shadow-xl w-full max-w-xs xs:max-w-sm sm:max-w-lg md:max-w-2xl max-h-[80vh] xs:max-h-[85vh] sm:max-h-[85vh] flex flex-col transform transition-all duration-200 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
            <div className="flex items-center justify-between p-3 xs:p-4 sm:p-5 border-b border-gray-100">
              <h2 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 truncate">{modalContent.title}</h2>
              <button onClick={handleClose} className="p-1 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"><X className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 xs:p-4 sm:p-6 text-xs xs:text-sm sm:text-base text-gray-600 leading-relaxed">
              {modalContent.content.map((html, index) => (
                <div key={index} className="mb-3 xs:mb-4 sm:mb-4 flex gap-2 xs:gap-3 sm:gap-3">
                  <div className="shrink-0 w-5 h-5 xs:w-6 xs:h-6 sm:w-6 sm:h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">{index + 1}</div>
                  <div dangerouslySetInnerHTML={{ __html: html }} className="text-xs xs:text-sm sm:text-base" />
                </div>
              ))}
            </div>
            <div className="p-3 xs:p-4 sm:p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end">
              <button onClick={handleClose} className="px-4 py-2 xs:px-5 xs:py-2.5 sm:px-5 sm:py-2.5 bg-primary text-white text-xs xs:text-sm sm:text-base font-medium rounded-md hover:bg-leafGreen transition-colors">I Understand</button>
            </div>
          </div>
        </div>
      )}

      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        defaultCategory={'Access'}
        defaultRelatedType={'partner'}
      />
    </div>
  )
}