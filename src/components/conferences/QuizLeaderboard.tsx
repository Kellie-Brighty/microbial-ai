import React, { useState, useEffect } from "react";
import {
  QuizSubmission,
  getQuizSubmissions,
  getQuiz,
} from "../../utils/firebase";
import { FiAward, FiExternalLink } from "react-icons/fi";

interface QuizLeaderboardProps {
  quizId: string;
  onViewQuiz?: (quizId: string) => void;
}

const QuizLeaderboard: React.FC<QuizLeaderboardProps> = ({
  quizId,
  onViewQuiz,
}) => {
  const isDarkMode = false; // Simplified theme handling
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);

        // Get quiz details
        const quiz = await getQuiz(quizId);
        if (quiz) {
          setQuizTitle(quiz.title);
        }

        // Get submissions
        const submissionsList = await getQuizSubmissions(quizId);
        setSubmissions(submissionsList);
      } catch (err) {
        console.error("Error loading leaderboard:", err);
        setError("Failed to load leaderboard data");
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [quizId]);

  // Helper function to determine medal color
  const getMedalColor = (position: number): string => {
    switch (position) {
      case 0:
        return "text-yellow-500"; // Gold
      case 1:
        return "text-gray-400"; // Silver
      case 2:
        return "text-amber-700"; // Bronze
      default:
        return "text-gray-300"; // Others
    }
  };

  if (loading) {
    return (
      <div
        className={`p-3 sm:p-4 rounded-lg shadow-md ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-charcoal"
        }`}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-300 rounded w-1/2"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-gray-300"></div>
                <div className="h-4 bg-gray-300 rounded flex-grow"></div>
                <div className="h-4 bg-gray-300 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-3 sm:p-4 rounded-lg shadow-md ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-charcoal"
        }`}
      >
        <div className="text-red-500 text-sm sm:text-base">{error}</div>
      </div>
    );
  }

  return (
    <div
      className={`p-3 sm:p-4 rounded-lg shadow-md ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-white text-charcoal"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-charcoal">
          Leaderboard: {quizTitle}
        </h2>
        {onViewQuiz && (
          <button
            onClick={() => onViewQuiz(quizId)}
            className="flex items-center text-mint hover:text-purple transition-colors text-sm"
          >
            <FiExternalLink className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
            <span className="hidden sm:inline">View Quiz</span>
          </button>
        )}
      </div>

      {submissions.length === 0 ? (
        <div
          className={`p-3 rounded text-sm sm:text-base ${
            isDarkMode ? "bg-gray-700" : "bg-offWhite"
          } text-center`}
        >
          No submissions yet
        </div>
      ) : (
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <div className="inline-block min-w-full align-middle p-3 sm:p-0">
            <div className="overflow-hidden rounded-lg border border-lightGray dark:border-gray-700">
              <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                <thead className={isDarkMode ? "bg-gray-700" : "bg-offWhite"}>
                  <tr>
                    <th
                      scope="col"
                      className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium uppercase tracking-wider w-12 text-charcoal"
                    >
                      Rank
                    </th>
                    <th
                      scope="col"
                      className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium uppercase tracking-wider text-charcoal"
                    >
                      Participant
                    </th>
                    <th
                      scope="col"
                      className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium uppercase tracking-wider text-charcoal"
                    >
                      Score
                    </th>
                    <th
                      scope="col"
                      className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium uppercase tracking-wider text-charcoal"
                    >
                      %
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y divide-lightGray dark:divide-gray-700 ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  {submissions.map((submission, index) => {
                    const scorePercentage = Math.round(
                      (submission.score / submission.maxPossibleScore) * 100
                    );

                    return (
                      <tr
                        key={submission.id}
                        className={
                          index < 3
                            ? isDarkMode
                              ? "bg-gray-700/30"
                              : "bg-mint/5"
                            : ""
                        }
                      >
                        <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            {index < 3 ? (
                              <FiAward
                                className={`h-4 w-4 sm:h-5 sm:w-5 ${getMedalColor(
                                  index
                                )}`}
                              />
                            ) : (
                              <span className="text-xs sm:text-sm">
                                {index + 1}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-medium text-charcoal">
                            {submission.userName}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-right">
                          <div className="text-xs sm:text-sm text-charcoal">
                            {submission.score}/{submission.maxPossibleScore}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-right">
                          <div
                            className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              scorePercentage >= 80
                                ? "bg-green-50 text-green-800 dark:bg-green-800 dark:text-green-100"
                                : scorePercentage >= 70
                                ? "bg-mint text-white dark:bg-mint dark:text-white"
                                : scorePercentage >= 50
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                                : "bg-red-50 text-red-800 dark:bg-red-800 dark:text-red-100"
                            }`}
                          >
                            {scorePercentage}%
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
        Total participants: {submissions.length}
      </div>
    </div>
  );
};

export default QuizLeaderboard;
