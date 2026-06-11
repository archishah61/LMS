import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  Trophy, 
  Target, 
  Calendar, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ListTodo,
  AlignLeft,
  ChevronRight,
  Tag
} from 'lucide-react';

const AssignmentDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { assignment } = location.state || {};
  
  if (!assignment) return null;

  // Adapt to potential field name variations from AI
  const title = assignment.assignmentTitle || assignment.title || "Module Assignment";
  const category = (assignment.assignmentType || assignment.category || "regular").toLowerCase();
  const description = assignment.description || "";
  const daysToComplete = assignment.durationHours || assignment.daysToComplete || 7;
  const maxScore = assignment.maxScore || 100;
  const passingScore = assignment.passingScore || 60;
  const maxAttempts = assignment.maxAttempts || 3;
  const extensionLimit = assignment.extensionLimit || 2;

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">No Assignment Data Found</h2>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 flex items-center gap-2 text-violet-600 font-semibold hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const renderAssignmentContent = () => {
    switch (category) {
      case 'regular':
        return (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Regular Assignment Instructions
            </h3>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {assignment.regularInstructions || assignment.description}
              </p>
            </div>
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Note: This assignment requires you to submit a 2-3 page PDF document based on the instructions above.
              </p>
            </div>
          </div>
        );

      case 'matching':
        return (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-indigo-500" />
              {assignment.matchingData?.questionText || "Match the following pairs:"}
            </h3>
            {console.log("assignment", assignment)}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignment.matchingData?.pairs?.map((pair, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                  <div className="flex-1 font-semibold text-gray-800 dark:text-gray-200">
                    {pair.item || pair.option}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <div className="flex-1 font-medium text-indigo-600 dark:text-indigo-400">
                    {pair.match}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'true_false':
        return (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider text-sm opacity-50">True or False Questions</h3>
            <div className="space-y-4">
              {assignment.trueFalseData?.questions?.map((q, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <span className="text-sm font-bold text-gray-400 mt-0.5">{idx + 1}.</span>
                    <p className="text-gray-800 dark:text-gray-200 font-medium">{q.text}</p>
                  </div>
                  <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${q.answer ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800'}`}>
                    {String(q.answer).toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'fill_in_the_blanks':
        return (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider text-sm opacity-50">Fill in the Blanks</h3>
            <div className="space-y-4">
              {assignment.fillBlanksData?.questions?.map((q, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                  <div className="flex gap-4 mb-3">
                    <span className="text-sm font-bold text-gray-400 mt-0.5">{idx + 1}.</span>
                    <p className="text-gray-800 dark:text-gray-200 font-medium">{q.text}</p>
                  </div>
                  <div className="ml-8 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Correct Answer:</span>
                    <span className="px-3 py-1 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-emerald-600 dark:text-emerald-400 font-bold">
                      {q.answer}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'paragraph_writing':
        return (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 opacity-50 uppercase tracking-wider text-sm">
              <AlignLeft className="w-5 h-5" />
              Paragraph Writing Task
            </h3>
            <div className="p-6 bg-gray-50 dark:bg-gray-800/80 rounded-2xl border-l-4 border-violet-500 italic text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {assignment.paragraph || ""}
              </div>
            <div className="p-4 bg-violet-50 dark:bg-violet-900/10 rounded-xl border border-violet-100 dark:border-violet-900/30">
              <p className="text-sm text-violet-700 dark:text-violet-300">
                Instructions: Read the paragraph above carefully and write a detailed response or analysis as per your module requirements.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 px-4 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
              {title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-500 truncate capitalize">
               <Tag className="w-3 h-3 text-violet-500" />
               {category.replace(/_/g, ' ')} Assignment
            </div>
          </div>
          <div className="flex-shrink-0">
             <span className="bg-violet-600 text-white text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-violet-500/20">
                PREVIEW
             </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 underline bg-clip-text decoration-violet-500/30">Description</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {description}
              </p>
            </div>

            {renderAssignmentContent()}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-6">Submission Policy</h3>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center border border-orange-200 dark:border-orange-800/40">
                    <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Duration</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-none">{daysToComplete} {assignment.durationHours ? 'Hours' : 'Days'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/40">
                    <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Max Score</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-none">{maxScore}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/10 flex items-center justify-center border border-blue-200 dark:border-blue-800/40">
                    <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Passing Score</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-none">{passingScore}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center border border-violet-200 dark:border-violet-800/40">
                    <RefreshCw className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Attempts</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-none">{maxAttempts}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center border border-pink-200 dark:border-pink-800/40">
                    <Calendar className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Ex-Limit</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-none">{extensionLimit}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                <button 
                  onClick={() => navigate(-1)}
                  className="w-full py-4 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetailPage;
