import { ArrowLeft } from "lucide-react";

const PreviousInterviewsList = ({
  evaluationData,
  handleViewDetails,
  getScoreBadge,
}) => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {evaluationData.interviewEvaluations.slice(0, 3).map((interview) => {
          const matchingResult = evaluationData.interviewEvaluationResults?.find(
            (result) => result.id === interview.id
          );

          const formattedRole = interview.role
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          const formattedDate = new Date(interview.created_at).toLocaleDateString(
            undefined,
            { month: "short", day: "numeric", year: "numeric" }
          );

          const badge = getScoreBadge(matchingResult?.overallScore || 0);

          let borderColor = "border-slate-200";
          if (matchingResult?.overallScore >= 70) borderColor = "border-primary";
          else if (matchingResult?.overallScore >= 40) borderColor = "border-yellow-400";
          else borderColor = "border-red-400";

          return (
            <div
              key={interview.id}
              onClick={() => handleViewDetails(interview.id)}
              className="bg-white shadow-sm border border-slate-100 rounded-lg p-5 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full"
            >
              {/* Left Color Strip */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${borderColor}`} />

              <div className="pl-1">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <h4 className="font-bold text-slate-800 text-sm line-clamp-1">
                    {formattedRole}
                  </h4>
                  {matchingResult && (
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${badge.color.replace('border', 'border-0 border-transparent bg-slate-50')}`}>
                      Score: {matchingResult.overallScore}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  {formattedDate}
                </p>

                {matchingResult && (
                  <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
                    {matchingResult.overallAssessment}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PreviousInterviewsList;