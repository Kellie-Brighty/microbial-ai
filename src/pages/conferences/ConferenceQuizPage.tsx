import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Quiz,
  QuizSubmission,
  getConference,
  getConferenceQuizzes,
  getUserQuizSubmissions,
} from "../../utils/firebase";
import QuizCreator from "../../components/conferences/QuizCreator";
import QuizView from "../../components/conferences/QuizView";
import QuizLeaderboard from "../../components/conferences/QuizLeaderboard";
import {
  FiPlusCircle,
  FiBook,
  FiClipboard,
  FiArrowLeft,
  FiMenu,
  FiBarChart2,
} from "react-icons/fi";

enum PageView {
  QUIZ_LIST,
  CREATE_QUIZ,
  EDIT_QUIZ,
  TAKE_QUIZ,
  VIEW_LEADERBOARD,
}

interface QuizListItem extends Quiz {
  userSubmission?: QuizSubmission;
}

const ConferenceQuizPage: React.FC = () => {
  const { conferenceId } = useParams<{ conferenceId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isDarkMode = false; // Simplified theme handling
  const [pageView, setPageView] = useState<PageView>(PageView.QUIZ_LIST);
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [conferenceName, setConferenceName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [_userSubmissions, setUserSubmissions] = useState<QuizSubmission[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!conferenceId || !currentUser) return;

      try {
        setLoading(true);

        // Get conference details
        const conferenceData = await getConference(conferenceId);
        if (!conferenceData) {
          setError("Conference not found");
          return;
        }
        setConferenceName(conferenceData.title);

        // Get all quizzes for this conference
        const conferencesQuizzes = await getConferenceQuizzes(conferenceId);

        // Get user submissions for this user
        const submissions = await getUserQuizSubmissions(currentUser.uid);
        setUserSubmissions(submissions);

        // Combine quizzes with user submissions
        const quizzesWithSubmissions = conferencesQuizzes.map((quiz) => {
          const submission = submissions.find((s) => s.quizId === quiz.id);
          return {
            ...quiz,
            userSubmission: submission,
          };
        });

        setQuizzes(quizzesWithSubmissions);
      } catch (err) {
        console.error("Error loading quizzes:", err);
        setError("Failed to load quizzes");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [conferenceId, currentUser, pageView]);

  const handleCreateQuiz = () => {
    setPageView(PageView.CREATE_QUIZ);
  };

  const handleEditQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    setPageView(PageView.EDIT_QUIZ);
  };

  const handleTakeQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    setPageView(PageView.TAKE_QUIZ);
  };

  const handleViewLeaderboard = (quizId: string) => {
    setSelectedQuizId(quizId);
    setPageView(PageView.VIEW_LEADERBOARD);
  };

  const handleBackToList = () => {
    setPageView(PageView.QUIZ_LIST);
    setSelectedQuizId("");
  };

  const handleQuizSaved = (_quizId: string) => {
    setSelectedQuizId("");
    setPageView(PageView.QUIZ_LIST);
  };

  // Helper to determine if the current user is the creator of a quiz
  const isQuizCreator = (quiz: Quiz): boolean => {
    return currentUser?.uid === quiz.creatorId;
  };

  // Helper to get status text and color
  const getQuizStatusDisplay = (quiz: QuizListItem) => {
    if (quiz.userSubmission) {
      const scorePercentage = Math.round(
        (quiz.userSubmission.score / quiz.userSubmission.maxPossibleScore) * 100
      );

      if (scorePercentage >= 80) {
        return {
          text: `Completed - ${scorePercentage}%`,
          bgColor: isDarkMode ? "bg-green-800" : "bg-green-100",
          textColor: isDarkMode ? "text-green-100" : "text-green-800",
        };
      } else if (scorePercentage >= 70) {
        return {
          text: `Completed - ${scorePercentage}%`,
          bgColor: isDarkMode ? "bg-blue-800" : "bg-blue-100",
          textColor: isDarkMode ? "text-blue-100" : "text-blue-800",
        };
      } else {
        return {
          text: `Completed - ${scorePercentage}%`,
          bgColor: isDarkMode ? "bg-red-800" : "bg-red-100",
          textColor: isDarkMode ? "text-red-100" : "text-red-800",
        };
      }
    }

    if (!quiz.isActive) {
      return {
        text: "Not Available",
        bgColor: isDarkMode ? "bg-gray-700" : "bg-gray-200",
        textColor: isDarkMode ? "text-gray-300" : "text-gray-700",
      };
    }

    return {
      text: "Available",
      bgColor: isDarkMode ? "bg-blue-800" : "bg-blue-100",
      textColor: isDarkMode ? "text-blue-100" : "text-blue-800",
    };
  };

  if (loading) {
    return (
      <div
        className={`container mx-auto px-3 sm:px-4 py-4 sm:py-8 ${
          isDarkMode ? "text-white" : "text-charcoal"
        }`}
      >
        <div className="animate-pulse space-y-4 sm:space-y-6">
          <div className="h-5 sm:h-6 bg-gray-300 rounded w-1/4"></div>
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 sm:h-40 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`container mx-auto px-3 sm:px-4 py-4 sm:py-8 ${
          isDarkMode ? "text-white" : "text-charcoal"
        }`}
      >
        <div className="bg-red-50 border border-red-400 text-red-800 px-3 py-2 sm:px-4 sm:py-3 rounded mb-4 text-sm sm:text-base">
          {error}
        </div>
        <button
          onClick={() => navigate(`/conferences/${conferenceId}`)}
          className="flex items-center px-3 py-1 sm:px-4 sm:py-2 bg-mint text-white rounded-lg hover:bg-purple transition-colors text-sm sm:text-base"
        >
          <FiArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
          Back to Conference
        </button>
      </div>
    );
  }

  return (
    <div
      className={`container mx-auto px-3 sm:px-4 py-4 sm:py-8 ${
        isDarkMode ? "text-white" : "text-charcoal"
      }`}
    >
      {pageView === PageView.QUIZ_LIST && (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-charcoal">
                {conferenceName}
              </h1>
              <h2 className="text-lg sm:text-xl text-charcoal">
                Quiz Sessions
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={() => navigate(`/conferences/${conferenceId}`)}
                className={`flex items-center px-3 py-1 sm:px-3 sm:py-2 rounded-lg text-sm ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                <FiArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                Back
              </button>
              <button
                onClick={handleCreateQuiz}
                className="flex items-center px-3 py-1 sm:px-3 sm:py-2 bg-mint text-white rounded-lg hover:bg-purple transition-colors text-sm"
              >
                <FiPlusCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                Create Quiz
              </button>
            </div>
          </div>

          {quizzes.length === 0 ? (
            <div
              className={`p-4 sm:p-8 rounded-lg text-center shadow-md ${
                isDarkMode ? "bg-gray-800" : "bg-offWhite"
              }`}
            >
              <FiBook className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-400" />
              <h3 className="text-base sm:text-lg font-medium mb-2 text-charcoal">
                No Quizzes Available
              </h3>
              <p className="text-sm sm:text-base text-gray-500 mb-4">
                There are no quizzes available for this conference yet.
              </p>
              <button
                onClick={handleCreateQuiz}
                className="px-3 py-1 sm:px-4 sm:py-2 bg-mint text-white rounded-lg hover:bg-purple transition-colors text-sm sm:text-base"
              >
                Create the First Quiz
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => {
                const status = getQuizStatusDisplay(quiz);
                return (
                  <div
                    key={quiz.id}
                    className={`rounded-lg border shadow-sm overflow-hidden ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-lightGray"
                    }`}
                  >
                    <div className="p-3 sm:p-5">
                      <div className="flex justify-between items-start mb-2 sm:mb-3">
                        <h3 className="text-base sm:text-lg font-bold text-charcoal">
                          {quiz.title}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 sm:py-1 rounded-full ${status.bgColor} ${status.textColor}`}
                        >
                          {status.text}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm mb-2 sm:mb-3 text-gray-500 dark:text-gray-400">
                        {quiz.description || "No description provided."}
                      </p>
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="text-xs sm:text-sm">
                          <div className="flex items-center">
                            <FiClipboard className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-mint" />
                            <span>{quiz.questions.length} questions</span>
                          </div>
                          <div>
                            <span className="text-xs">
                              By: {quiz.creatorName}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="text-xs sm:text-sm font-medium">
                            <span>{quiz.durationMinutes} min</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`flex border-t ${
                        isDarkMode ? "border-gray-700" : "border-lightGray"
                      }`}
                    >
                      {quiz.userSubmission ? (
                        <>
                          <button
                            onClick={() => handleViewLeaderboard(quiz.id)}
                            className={`flex-1 py-2 sm:py-3 text-center ${
                              isDarkMode
                                ? "hover:bg-gray-700"
                                : "hover:bg-offWhite"
                            }`}
                          >
                            <FiBarChart2 className="h-4 w-4 sm:h-5 sm:w-5 mx-auto text-mint" />
                            <span className="text-xs">Leaderboard</span>
                          </button>
                          <button
                            onClick={() => handleTakeQuiz(quiz.id)}
                            className={`flex-1 py-2 sm:py-3 text-center ${
                              isDarkMode
                                ? "hover:bg-gray-700"
                                : "hover:bg-offWhite"
                            }`}
                          >
                            <FiClipboard className="h-4 w-4 sm:h-5 sm:w-5 mx-auto text-mint" />
                            <span className="text-xs">View Results</span>
                          </button>
                        </>
                      ) : (
                        <>
                          {quiz.isActive && (
                            <button
                              onClick={() => handleTakeQuiz(quiz.id)}
                              className={`flex-1 py-2 sm:py-3 text-center ${
                                isDarkMode
                                  ? "hover:bg-gray-700"
                                  : "hover:bg-offWhite"
                              }`}
                            >
                              <FiBook className="h-4 w-4 sm:h-5 sm:w-5 mx-auto text-mint" />
                              <span className="text-xs">Take Quiz</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleViewLeaderboard(quiz.id)}
                            className={`flex-1 py-2 sm:py-3 text-center ${
                              isDarkMode
                                ? "hover:bg-gray-700"
                                : "hover:bg-offWhite"
                            }`}
                          >
                            <FiBarChart2 className="h-4 w-4 sm:h-5 sm:w-5 mx-auto text-mint" />
                            <span className="text-xs">Leaderboard</span>
                          </button>
                          {isQuizCreator(quiz) && (
                            <button
                              onClick={() => handleEditQuiz(quiz.id)}
                              className={`flex-1 py-2 sm:py-3 text-center ${
                                isDarkMode
                                  ? "hover:bg-gray-700"
                                  : "hover:bg-offWhite"
                              }`}
                            >
                              <FiMenu className="h-4 w-4 sm:h-5 sm:w-5 mx-auto text-mint" />
                              <span className="text-xs">Manage</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {pageView === PageView.CREATE_QUIZ && (
        <div>
          <div className="mb-4">
            <button
              onClick={handleBackToList}
              className="flex items-center text-mint hover:text-purple transition-colors text-sm sm:text-base"
            >
              <FiArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
              Back to Quiz List
            </button>
          </div>

          <QuizCreator
            conferenceId={conferenceId!}
            onSuccess={handleQuizSaved}
            onCancel={handleBackToList}
          />
        </div>
      )}

      {pageView === PageView.EDIT_QUIZ && (
        <div>
          <div className="mb-4">
            <button
              onClick={handleBackToList}
              className="flex items-center text-mint hover:text-purple transition-colors text-sm sm:text-base"
            >
              <FiArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
              Back to Quiz List
            </button>
          </div>

          <QuizCreator
            conferenceId={conferenceId!}
            quizId={selectedQuizId}
            onSuccess={handleQuizSaved}
            onCancel={handleBackToList}
          />
        </div>
      )}

      {pageView === PageView.TAKE_QUIZ && (
        <div>
          <div className="mb-4">
            <button
              onClick={handleBackToList}
              className="flex items-center text-mint hover:text-purple transition-colors text-sm sm:text-base"
            >
              <FiArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
              Back to Quiz List
            </button>
          </div>

          <QuizView quizId={selectedQuizId} onBackToList={handleBackToList} />
        </div>
      )}

      {pageView === PageView.VIEW_LEADERBOARD && (
        <div>
          <div className="mb-4">
            <button
              onClick={handleBackToList}
              className="flex items-center text-mint hover:text-purple transition-colors text-sm sm:text-base"
            >
              <FiArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
              Back to Quiz List
            </button>
          </div>

          <QuizLeaderboard
            quizId={selectedQuizId}
            onViewQuiz={() => handleTakeQuiz(selectedQuizId)}
          />
        </div>
      )}
    </div>
  );
};

export default ConferenceQuizPage;
