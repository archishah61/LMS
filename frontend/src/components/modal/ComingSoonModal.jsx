import React from 'react';
import { ArrowLeft, Sparkles, Clock, Bell } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import FeatureInterestModal from './FeatureInterestModal';

// Function to format feature names
const formatFeatureName = (name) => {
    if (!name) return "Feature"

    // Handle special cases first
    const specialCases = {
        'cheatsheet': 'Cheatsheet',
        'challenge_quest': 'Challenge Quest',
        'daily_challenge': 'Daily Challenge',
        'contest': 'Contest',
        'maths_solver': 'Maths Solver',
        'interview_ai': 'Interview AI',
        'learning_path_ai': 'Learning Path AI',
        'do_your_own_course_ai': 'Do Your Own Course AI',
        'chatbot_ai': 'Chatbot AI',
        'become_a_partner': 'Become a Partner'
    }

    if (specialCases[name]) {
        return specialCases[name]
    }

    // General formatting for other names
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}

const ComingSoonModal = ({ featureData }) => {
    const navigate = useNavigate();
    const formattedFeatureName = formatFeatureName(featureData?.name);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center border border-gray-200">

                {/* Icon */}
                <div className="w-16 h-16 mx-auto bg-lightGreen rounded-full flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8 text-forestGreen" />
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-bold text-forestGreen">
                    {formattedFeatureName} is Coming Soon 🚀
                </h1>

                {/* Description */}
                <p className="text-gray-600 mt-3 leading-relaxed">
                    We're currently working on this feature to give you the best experience.
                    It's not available yet, but you can register your interest to be notified
                    the moment it launches!
                </p>

                {/* Status */}
                <div className="mt-5 bg-gray-50 px-4 py-3 rounded-xl inline-flex items-center space-x-2 border border-gray-100">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600 font-medium">
                        Status: Under Development
                    </span>
                </div>

                {/* Notify button */}
                <div className="mt-8">
                    <FeatureInterestModal feature={featureData} />
                </div>

                {/* Back to Dashboard Button */}
                <div className="mt-6">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-colors duration-300 font-medium mx-auto border border-gray-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Dashboard</span>
                    </button>
                </div>

                {/* Note */}
                <p className="text-xs text-gray-400 mt-4 flex justify-center items-center space-x-1">
                    <Bell className="w-4 h-4" />
                    <span>You'll only receive updates related to this feature.</span>
                </p>
            </div>
        </div>
    );
};

export default ComingSoonModal;