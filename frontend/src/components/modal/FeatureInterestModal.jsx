// import React, { useState } from "react";
// import { Mail, X, Sparkles } from "lucide-react";
// import axios from "axios";
// import { toast } from "react-hot-toast";
// import { useSelector } from "react-redux";
// import { useCreateFeatureInterestMutation } from "../../services/Support/featureInterestAPI";

// const FeatureInterestModal = ({ feature }) => {
//     const [isOpen, setIsOpen] = useState(false);
//     const [email, setEmail] = useState("");

//     const [createFeatureInterest] = useCreateFeatureInterestMutation();

//     // Access logged-in user info from Redux
//     const user = useSelector((state) => state.auth?.user);

//     // Submit handler
//     const handleSubmit = async () => {
//         if (!email.trim()) {
//             toast.error("Please enter your email.");
//             return;
//         }

//         try {

//             const res = await createFeatureInterest({
//                 featureId: feature.id,
//                 email: email,
//             })

//             toast.success("Your interest has been recorded!");
//             setIsOpen(false);
//             setEmail("");
//         } catch (err) {
//             toast.error(err.response?.data?.message || "Something went wrong");
//         }
//     };

//     // Auto-create interest if user is logged in
//     const handleDirectInterest = async () => {
//         try {
//             const res = await createFeatureInterest({
//                 featureId: feature.id,
//                 email: user.email,
//             })

//             toast.success("Your interest has been recorded!");
//         } catch (err) {
//             toast.error(err.response?.data?.message || "Something went wrong");
//         }
//     };

//     // Button click handler
//     const handleClick = () => {
//         if (user) {
//             // logged-in user → direct record
//             handleDirectInterest();
//         } else {
//             // not logged in → open modal
//             setIsOpen(true);
//         }
//     };

//     return (
//         <>
//             {/* Default Button */}
//             <button
//                 onClick={handleClick}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-2"
//             >
//                 <Sparkles className="w-4 h-4" />
//                 <span>Show Interest</span>
//             </button>

//             {/* Modal */}
//             {isOpen && (
//                 <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center p-4 z-50">
//                     <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

//                         <div className="p-4 sm:p-6">
//                             {/* Header */}
//                             <div className="flex items-center space-x-3 mb-6">
//                                 <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
//                                     <Sparkles className="w-5 h-5 text-blue-600" />
//                                 </div>
//                                 <div>
//                                     <h3 className="text-lg font-semibold text-gray-900">
//                                         {feature.name}
//                                     </h3>
//                                     <p className="text-gray-600 text-sm">
//                                         Register your interest to get early access
//                                     </p>
//                                 </div>
//                             </div>

//                             {/* Email Input */}
//                             <div>
//                                 <label className="flex items-center space-x-2 text-sm font-medium text-gray-900 mb-2">
//                                     <Mail className="w-4 h-4" />
//                                     <span>Email</span>
//                                     <span className="text-red-500">*</span>
//                                 </label>
//                                 <input
//                                     type="email"
//                                     value={email}
//                                     onChange={(e) => setEmail(e.target.value)}
//                                     placeholder="Enter your email..."
//                                     className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
//                                 />
//                             </div>

//                             {/* Buttons */}
//                             <div className="flex space-x-3 mt-6">
//                                 <button
//                                     onClick={() => setIsOpen(false)}
//                                     className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
//                                 >
//                                     Cancel
//                                 </button>

//                                 <button
//                                     onClick={handleSubmit}
//                                     className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm"
//                                 >
//                                     Submit
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </>
//     );
// };

// export default FeatureInterestModal;


import React, { useState } from "react";
import { Mail, X, Sparkles, CheckCircle } from "lucide-react";
import { useCreateFeatureInterestMutation } from "../../services/Support/featureInterestAPI";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

const FeatureInterestModal = ({ feature }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [createFeatureInterest] = useCreateFeatureInterestMutation();

    // Mock user for demo
    const user = useSelector((state) => state.user);

    // Submit handler
    const handleSubmit = async () => {
        if (!email.trim()) {
            toast.error("Please enter your email.");
            return;
        }

        try {

            const res = await createFeatureInterest({
                feature_id: feature.id,
                email: email,
            })

            if (res?.data?.success) {
                toast.success("Your interest has been recorded!");
                setIsOpen(false);
            } else {
                toast.error(res.error?.data?.message || "Error Inserting record!");
            }

            setEmail("");
        } catch (err) {
            toast.error(err.response?.data?.message || "Something went wrong");
        }
    };

    // Auto-create interest if user is logged in
    const handleDirectInterest = async () => {
        try {
            const res = await createFeatureInterest({
                feature_id: feature.id,
                email: user.email,
                user_id: user.id
            })

            if (res?.data?.success) {
                toast.success("Your interest has been recorded!");
                setIsOpen(false);
            } else {
                toast.error(res.error?.data?.message || "Error Inserting record!");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Something went wrong");
        }
    };

    // Button click handler
    const handleClick = () => {
        if (user?.id) {
            // logged-in user → direct record
            handleDirectInterest();
        } else {
            // not logged in → open modal
            setIsOpen(true);
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <div className="flex justify-center">
                <button
                    onClick={handleClick}
                    disabled={isLoading}
                    className="group relative px-6 py-3 bg-forestGreen text-white rounded-xl flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="font-medium">
                        {isLoading ? "Processing..." : "Show Interest"}
                    </span>
                </button>
            </div>

            {/* Modal Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="bg-white rounded-3xl shadow-xl w-full max-w-md transform animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <div className="p-8">
                            {/* Icon Header */}
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-16 h-16 bg-lightGreen rounded-2xl flex items-center justify-center mb-4">
                                    <Sparkles className="w-8 h-8 text-forestGreen" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {feature?.name
                                        ? feature.name.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
                                        : "New Feature"}
                                </h3>
                                <p className="text-gray-600">
                                    Be the first to know when this feature launches
                                </p>
                            </div>

                            {/* Email Input */}
                            <div className="space-y-2 mb-6">
                                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>Email Address</span>
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your.email@example.com"
                                        className="w-full px-4 py-3.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-forestGreen focus:ring-0 transition-all text-gray-900 placeholder:text-gray-400"
                                        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                                    />
                                    {email && email.includes('@') && (
                                        <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                                    )}
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="bg-lightGreen border border-green-100 rounded-xl p-4 mb-6">
                                <p className="text-sm text-forestGreen font-medium">
                                    You'll receive exclusive updates and early access when this feature is ready
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 px-6 py-3.5 bg-gray-50 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-200"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading || !email.trim()}
                                    className="flex-1 px-6 py-3.5 bg-forestGreen text-white font-semibold rounded-xl hover:bg-secondaryForestGreen transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Submitting...
                                        </span>
                                    ) : (
                                        "Submit Interest"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Demo wrapper
export default FeatureInterestModal;