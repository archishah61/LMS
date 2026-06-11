import { Sparkles, Clock, Bell } from "lucide-react";
import FeatureInterestModal from "../../components/modal/FeatureInterestModal";

// Function to format feature names
const formatFeatureName = (name) => {
  if (!name) return "Feature";

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
  };

  if (specialCases[name]) {
    return specialCases[name];
  }

  // General formatting for other names
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const ComingSoonModal2 = ({ featureData }) => {
  const formattedFeatureName = formatFeatureName(featureData?.name);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-8 px-4 lg:py-0 mt-[-50px] mb-[-50px] lg:px-0 lg:mb-[-50px] lg:mt-[-50px]">
      <div className="bg-white rounded-2xl lg:rounded-3xl p-6 lg:p-8 max-w-lg w-full text-center border border-gray-200">
        {/* Icon */}
        <div className="w-14 h-14 lg:w-16 lg:h-16 mx-auto bg-lightGreen rounded-full flex items-center justify-center mb-4 lg:mb-6">
          <Sparkles className="w-6 h-6 lg:w-8 lg:h-8 text-forestGreen" />
        </div>

        {/* Title */}
        <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold text-forestGreen">
          {formattedFeatureName} is Coming Soon 🚀
        </h1>

        {/* Description */}
        <p className="text-gray-600 mt-2 lg:mt-3 text-sm lg:text-base leading-relaxed">
          We're currently working on this feature to give you the best experience.
          It's not available yet, but you can register your interest to be notified
          the moment it launches!
        </p>

        {/* Status */}
        <div className="mt-4 lg:mt-5 bg-gray-50 px-3 lg:px-4 py-2 lg:py-3 rounded-xl inline-flex items-center space-x-2 border border-gray-100">
          <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500" />
          <span className="text-gray-600 font-medium text-sm lg:text-base">
            Status: Under Development
          </span>
        </div>

        {/* Notify button */}
        <div className="mt-6 lg:mt-8">
          <FeatureInterestModal feature={featureData} />
        </div>

        {/* Note */}
        <p className="text-xs text-gray-400 mt-3 lg:mt-4 flex justify-center items-center space-x-1">
          <Bell className="w-3 h-3 lg:w-4 lg:h-4" />
          <span>You'll only receive updates related to this feature.</span>
        </p>
      </div>
    </div>
  );
};

export default ComingSoonModal2;