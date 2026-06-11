import React, { useState, useEffect } from "react";
import {
  Facebook,
  Twitter,
  Youtube,
  Instagram,
  Clock,
  Mail,
  MapPin,
  Phone,
  Linkedin,
  X,
  FileText
} from "lucide-react";
import { useGetSocialMediaLinksQuery } from '../../services/legalPages/socialMediaApi';
import { Link, useLocation } from "react-router-dom";

import { useCreateSubscriptionMutation } from '../../services/Support/subscribeApi';
import { toast } from 'react-hot-toast';
import { useGetFooterSettingsQuery } from '../../services/LegalPages/footerSettingApi';

// Validation utility functions
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhone = (phone) => {
  // Regular expression to match + followed by any two-digit country code, a space, and then 6 to 14 digits
  const re = /^\+\d{2} \d{6,14}$/;
  return re.test(phone);
};

const validateAddress = (address) => {
  return address && address.length >= 10 && address.length <= 500;
};

const validateTiming = (timing) => {
  return timing && timing.length >= 5 && timing.length <= 100;
};

const Footer = () => {
  const { data: socialLinksData } = useGetSocialMediaLinksQuery();
  const { data: footerSettingData } = useGetFooterSettingsQuery();

  const location = useLocation();


  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [createSubscription, { isLoading: isSubscribing }] = useCreateSubscriptionMutation();

  const socialLinks = socialLinksData?.data?.[0] || {};
  const footerSetting = footerSettingData?.data || {};

  // Validate footer settings on load
  useEffect(() => {
    if (footerSetting) {
      if (footerSetting.phone && !validatePhone(footerSetting.phone)) {
        console.warn("Invalid phone number in footer settings");
      }
      if (footerSetting.email && !validateEmail(footerSetting.email)) {
        console.warn("Invalid email in footer settings");
      }
      if (footerSetting.address && !validateAddress(footerSetting.address)) {
        console.warn("Invalid address in footer settings");
      }
      if (footerSetting.timing && !validateTiming(footerSetting.timing)) {
        console.warn("Invalid timing in footer settings");
      }
    }
  }, [footerSetting]);

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



  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <>
      <footer className="py-8 sm:py-10 md:py-12 bg-white">
        {/* Main Footer Wrapper matching the "card" style */}
        <div className="container mx-auto px-4 xs:px-5 sm:px-6 md:px-8 lg:px-8">
          <div className="bg-forestGreen rounded-2xl sm:rounded-[1.5rem] overflow-hidden pb-8 sm:pb-10 md:pb-12 lg:pb-14">
            {/* Top Section */}
            <div className="px-4 xs:px-5 sm:px-6 md:px-8 lg:px-16 py-8 sm:py-10 md:py-12 lg:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_2fr] gap-6 xs:gap-8 sm:gap-10 md:gap-12 lg:gap-8">
              {/* Column 1: Course Categories */}
              <div className="space-y-4 xs:space-y-5 sm:space-y-6">
                <h3 className="text-base xs:text-lg sm:text-lg md:text-lg font-semibold text-white">Course Categories</h3>
                <ul className="space-y-2 xs:space-y-2.5 sm:space-y-3 text-xs xs:text-sm sm:text-sm text-gray-300">
                  {['Design & UX', 'Business & Marketing', 'Data Science & AI', 'Programming', 'Animation', 'Photography', 'IT & Software'].map((item) => (
                    <li key={item} className="hover:text-white cursor-pointer transition-colors duration-200">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 2: Learning Categories */}
              <div className="space-y-4 xs:space-y-5 sm:space-y-6">
                <h3 className="text-base xs:text-lg sm:text-lg md:text-lg font-semibold text-white">Learning Categories</h3>
                <ul className="space-y-2 xs:space-y-2.5 sm:space-y-3 text-xs xs:text-sm sm:text-sm text-gray-300">
                  {['Programs', 'Skill Tracks', 'Assessments', 'Certifications', 'Workshops', 'Resources', 'Learning Paths'].map((item) => (
                    <li key={item} className="hover:text-white cursor-pointer transition-colors duration-200">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 3: Important Links & Subscribe */}
              <div className="space-y-6 xs:space-y-8">
                <div className="space-y-4 xs:space-y-5 sm:space-y-6">
                  <h3 className="text-base xs:text-lg sm:text-lg md:text-lg font-semibold text-white">Important Links</h3>
                  <ul className="space-y-2 xs:space-y-2.5 sm:space-y-3 text-xs xs:text-sm sm:text-sm text-gray-300">
                    <li><Link to="/" className="hover:text-white transition-colors duration-200">Home</Link></li>
                    <li><Link to="/courses" className="hover:text-white transition-colors duration-200">All Courses</Link></li>
                    <li><Link to="/" onClick={handleScrollToTop} className="hover:text-white transition-colors duration-200">How It Works</Link></li>
                    <li><Link to="/" onClick={handleScrollToTop} className="hover:text-white transition-colors duration-200">FAQs</Link></li>
                    <li><Link to="/become-partner/register" onClick={handleScrollToTop} className="hover:text-white transition-colors duration-200">Become a Partner</Link></li>
                  </ul>
                </div>

                {/* Subscribe Section (Commented out) */}
                {/* <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-semibold text-white">Stay Updated</h3>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError("");
                      }}
                      placeholder="Your Email"
                      className={`w-full px-4 py-3 rounded-lg border border-gray-600 bg-forestGreen text-white focus:ring-1 focus:ring-white focus:border-transparent
                        ${emailError ? 'border-red-500' : ''} focus:outline-none text-sm placeholder-gray-400`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <Mail className={`h-5 w-5 text-gray-400`} />
                    </div>
                  </div>
                  {emailError && (
                    <p className="text-red-400 text-xs">{emailError}</p>
                  )}
                  <button
                    onClick={handleSubscribe}
                    disabled={isSubscribing}
                    className="w-full px-6 py-2.5 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg text-secondaryForestGreen font-bold font-medium disabled:opacity-50 text-sm bg-white hover:bg-gray-100"
                  >
                    {isSubscribing ? "Subscribing..." : "Subscribe"}
                  </button>
                </div> */}
              </div>

              {/* Column 4: Branding, App Links, Social */}
              <div className="space-y-4 xs:space-y-5 sm:space-y-6 lg:pl-8 xl:pl-12 order-first sm:order-last flex flex-col items-center lg:items-start text-center lg:text-left">
                {/* Logo */}
                <div className="relative">
                  <img
                    src={footerSetting.footerLogo ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${footerSetting.footerLogo}` : "/assets/footer-logo.png"}
                    alt="Logo"
                    className="object-contain h-6 xs:h-7 sm:h-7 md:h-7"
                  />
                </div>

                <p className="text-gray-300 text-xs xs:text-sm sm:text-sm leading-relaxed text-wrap max-w-sm xs:max-w-md sm:max-w-lg lg:max-w-none">
                  Queekies helps learners gain practical, job-ready skills through structured learning and hands-on projects.
                </p>

                <div className="space-y-3 w-full flex flex-col items-center lg:items-start">
                  <h3 className="text-sm xs:text-base sm:text-md text-white hidden sm:block">Keep in Touch</h3>
                  <div className="flex flex-wrap gap-2 xs:gap-3 sm:gap-3 justify-center lg:justify-start">
                    {[
                      { name: "facebook", icon: Facebook },
                      { name: "twitter", icon: Twitter },
                      { name: "youtube", icon: Youtube },
                      { name: "instagram", icon: Instagram },
                      { name: "linkedin", icon: Linkedin },
                    ]
                      .filter(({ name }) => socialLinks[name])
                      .map(({ name, icon: Icon }) => (
                        <a
                          key={name}
                          href={socialLinks[name]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-gray-600 text-gray-300 hover:text-white hover:border-white transition-colors duration-200"
                        >
                          <Icon size={16} className="xs:size-4 sm:size-5" />
                        </a>
                      ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base xs:text-lg sm:text-lg md:text-lg font-semibold text-white">Browse Learning Path</h3>
                  <div className="flex gap-2 xs:gap-3 sm:gap-3 justify-center lg:justify-start">
                    <img 
                      src="/assets/image 34.png" 
                      alt="Google Play" 
                      className="h-8 xs:h-9 sm:h-10 md:h-10 object-contain cursor-pointer hover:opacity-80 transition-opacity" 
                    />
                    <img 
                      src="/assets/image 35.png" 
                      alt="App Store" 
                      className="h-8 xs:h-9 sm:h-10 md:h-10 object-contain cursor-pointer hover:opacity-80 transition-opacity" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="bg-secondaryForestGreen p-4 xs:p-5 sm:p-6 lg:px-16">
              <div className="flex flex-col lg:flex-row justify-between items-center text-white text-xs xs:text-sm gap-3 xs:gap-4">
                <p className="text-center lg:text-left text-xs xs:text-sm">
                  © {new Date().getFullYear()} Queekies. All rights reserved.
                </p>
                <div className="flex flex-wrap justify-center lg:justify-end gap-x-3 xs:gap-x-4 sm:gap-x-6 gap-y-1.5 xs:gap-y-2">
                  <Link to="/about-us" className="hover:text-gray-200 transition-colors duration-200 underline underline-offset-2 text-xs xs:text-sm">About US</Link>
                  <Link to="/" onClick={handleScrollToTop} className="hover:text-gray-200 transition-colors duration-200 underline underline-offset-2 text-xs xs:text-sm">Clients</Link>
                  <Link to="/" onClick={handleScrollToTop} className="hover:text-gray-200 transition-colors duration-200 underline underline-offset-2 text-xs xs:text-sm">Career</Link>
                  <Link to="/blogs" className="hover:text-gray-200 transition-colors duration-200 underline underline-offset-2 text-xs xs:text-sm">Blogs</Link>
                  <Link to="/contact-us" className="hover:text-gray-200 transition-colors duration-200 underline underline-offset-2 text-xs xs:text-sm">Contact Us</Link>
                  <Link to="/" onClick={handleScrollToTop} className="hover:text-gray-200 transition-colors duration-200 underline underline-offset-2 text-xs xs:text-sm">Disclaimer</Link>
                  <Link to="/privacy-policy" onClick={handleScrollToTop} className="hover:text-gray-200 transition-colors duration-200 underline underline-offset-2 text-xs xs:text-sm">
                    Privacy Policy
                  </Link>
                  <Link to="/terms-of-service" onClick={handleScrollToTop} className="hover:text-gray-200 transition-colors duration-200 underline underline-offset-2 text-xs xs:text-sm">
                    Terms & Conditions
                  </Link>
                  <Link to="/" onClick={handleScrollToTop} className="hover:text-gray-200 transition-colors duration-200 underline underline-offset-2 text-xs xs:text-sm">Employer Login</Link>
                  <Link to="/" onClick={handleScrollToTop} className="hover:text-gray-200 transition-colors duration-200 underline underline-offset-2 text-xs xs:text-sm">Site Map</Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </footer>

    </>
  );
};


export default Footer;