import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Quiz,
  QuizSubmission,
  getQuiz,
  getUserQuizSubmission,
  submitQuizAttempt,
} from "../../utils/firebase";
import { FiClock, FiCheck, FiX } from "react-icons/fi";

interface QuizViewProps {
  quizId: string;
  onBackToList?: () => void;
}

enum QuizStatus {
  LOADING,
  NOT_STARTED,
  IN_PROGRESS,
  SUBMITTED,
  ERROR,
}

const QuizView: React.FC<QuizViewProps> = ({ quizId, onBackToList }) => {
  // const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isDarkMode = false; // Simplified theme handling
  const [quizStatus, setQuizStatus] = useState<QuizStatus>(QuizStatus.LOADING);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Load quiz data
  useEffect(() => {
    const loadQuizData = async () => {
      if (!quizId || !currentUser) return;

      try {
        // Load quiz details
        const quizData = await getQuiz(quizId);
        if (!quizData) {
          setError("Quiz not found");
          setQuizStatus(QuizStatus.ERROR);
          return;
        }
        setQuiz(quizData);

        // Check if user already submitted this quiz
        const existingSubmission = await getUserQuizSubmission(
          currentUser.uid,
          quizId
        );
        if (existingSubmission) {
          setSubmission(existingSubmission);
          setQuizStatus(QuizStatus.SUBMITTED);
        } else {
          // Initialize answers array
          setAnswers(new Array(quizData.questions.length).fill(-1));
          setQuizStatus(QuizStatus.NOT_STARTED);
        }
      } catch (err) {
        console.error("Error loading quiz:", err);
        setError("Failed to load quiz data");
        setQuizStatus(QuizStatus.ERROR);
      }
    };

    loadQuizData();
  }, [quizId, currentUser]);

  // Handle quiz timer
  useEffect(() => {
    if (quizStatus !== QuizStatus.IN_PROGRESS || !quiz || !startTime) {
      return;
    }

    const totalSeconds = quiz.durationMinutes * 60;
    const endTime = new Date(startTime.getTime() + totalSeconds * 1000);

    const timerInterval = setInterval(() => {
      const now = new Date();
      const secondsRemaining = Math.max(
        0,
        Math.floor((endTime.getTime() - now.getTime()) / 1000)
      );

      setTimeLeft(secondsRemaining);

      if (secondsRemaining === 0) {
        clearInterval(timerInterval);
        handleSubmitQuiz();
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [quizStatus, quiz, startTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartQuiz = () => {
    setStartTime(new Date());
    setTimeLeft(quiz?.durationMinutes ? quiz.durationMinutes * 60 : 600);
    setQuizStatus(QuizStatus.IN_PROGRESS);
  };

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmitQuiz = async () => {
    if (!currentUser || !quiz) return;

    try {
      const result = await submitQuizAttempt(
        quizId,
        currentUser.uid,
        currentUser.displayName || "Anonymous User",
        answers
      );

      if (result) {
        setSubmission(result);
        setQuizStatus(QuizStatus.SUBMITTED);
        setSuccess("Quiz submitted successfully!");
      } else {
        setError("Failed to submit quiz");
      }
    } catch (err: any) {
      console.error("Error submitting quiz:", err);
      setError(err.message || "Failed to submit quiz");
    }
  };

  if (quizStatus === QuizStatus.LOADING) {
    return (
      <div
        className={`p-3 sm:p-6 rounded-lg shadow-md ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-charcoal"
        }`}
      >
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-6 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (quizStatus === QuizStatus.ERROR) {
    return (
      <div
        className={`p-3 sm:p-6 rounded-lg shadow-md ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-charcoal"
        }`}
      >
        <div className="text-red-500 mb-4 text-sm sm:text-base">{error}</div>
        <button
          onClick={onBackToList}
          className="px-3 py-1 sm:px-4 sm:py-2 bg-mint text-white rounded-lg hover:bg-purple transition-colors text-sm sm:text-base"
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  if (quizStatus === QuizStatus.SUBMITTED && submission) {
    // Calculate percentage score
    const scorePercentage = Math.round(
      (submission.score / submission.maxPossibleScore) * 100
    );
    const isPassing = scorePercentage >= 70;

    return (
      <div
        className={`p-3 sm:p-6 rounded-lg shadow-md ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-charcoal"
        }`}
      >
        <h2 className="text-xl sm:text-2xl font-bold mb-2 text-charcoal">
          {quiz.title}
        </h2>

        {success && (
          <div className="bg-green-50 border border-green-400 text-green-800 px-3 py-2 sm:px-4 sm:py-3 rounded mb-4 text-sm sm:text-base">
            {success}
          </div>
        )}

        <div
          className={`p-3 sm:p-6 rounded-lg mb-6 ${
            isPassing
              ? isDarkMode
                ? "bg-green-800 text-white"
                : "bg-green-50 text-green-800"
              : isDarkMode
              ? "bg-red-800 text-white"
              : "bg-red-50 text-red-800"
          }`}
        >
          <h3 className="text-lg sm:text-xl font-bold mb-2">Your Results</h3>
          <div className="flex flex-col sm:flex-row sm:justify-between">
            <div>
              <p className="text-base sm:text-lg">
                Score:{" "}
                <span className="font-bold">
                  {submission.score} / {submission.maxPossibleScore}
                </span>
              </p>
              <p className="text-base sm:text-lg">
                Percentage:{" "}
                <span className="font-bold">{scorePercentage}%</span>
              </p>
            </div>
            <div className="mt-2 sm:mt-0">
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                  isPassing ? "bg-mint text-white" : "bg-red-500 text-white"
                }`}
              >
                {isPassing ? (
                  <>
                    <FiCheck className="h-4 w-4 mr-1" /> Passed
                  </>
                ) : (
                  <>
                    <FiX className="h-4 w-4 mr-1" /> Needs Improvement
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg sm:text-xl font-bold mb-4 text-charcoal">
            Question Review
          </h3>

          {quiz.questions.map((question, qIndex) => {
            const userAnswer = submission.answers[qIndex];
            const isCorrect = userAnswer === question.correctOptionIndex;
            const notAnswered = userAnswer === -1;

            return (
              <div
                key={qIndex}
                className={`mb-4 p-3 sm:p-4 border rounded ${
                  isDarkMode ? "border-gray-700" : "border-lightGray"
                }`}
              >
                <div className="flex items-start">
                  <div className="mr-2 flex-shrink-0">
                    {notAnswered ? (
                      <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 text-xs sm:text-sm">
                          ?
                        </span>
                      </div>
                    ) : isCorrect ? (
                      <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-mint flex items-center justify-center">
                        <FiCheck className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-red-500 flex items-center justify-center">
                        <FiX className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-charcoal text-sm sm:text-base">
                      {qIndex + 1}. {question.text}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Points: {question.points}
                    </p>

                    <div className="mt-2 space-y-1">
                      {question.options.map((option, oIndex) => (
                        <div
                          key={oIndex}
                          className={`p-2 rounded text-xs sm:text-sm ${
                            oIndex === question.correctOptionIndex
                              ? isDarkMode
                                ? "bg-green-800"
                                : "bg-green-50"
                              : userAnswer === oIndex
                              ? isDarkMode
                                ? "bg-red-800"
                                : "bg-red-50"
                              : isDarkMode
                              ? "bg-gray-700"
                              : "bg-offWhite"
                          }`}
                        >
                          {option}
                          {oIndex === question.correctOptionIndex && (
                            <span className="ml-2 text-mint text-xs sm:text-sm">
                              ✓ Correct Answer
                            </span>
                          )}
                          {userAnswer === oIndex &&
                            oIndex !== question.correctOptionIndex && (
                              <span className="ml-2 text-red-600 text-xs sm:text-sm">
                                ✗ Your Answer
                              </span>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between">
          <button
            onClick={onBackToList}
            className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-3 sm:p-6 rounded-lg shadow-md ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-white text-charcoal"
      }`}
    >
      <h2 className="text-xl sm:text-2xl font-bold mb-2 text-charcoal">
        {quiz.title}
      </h2>
      {quiz.description && (
        <p className="mb-4 text-gray-600 text-sm sm:text-base">
          {quiz.description}
        </p>
      )}

      {quizStatus === QuizStatus.NOT_STARTED ? (
        <div>
          <div
            className={`p-3 sm:p-4 border rounded mb-6 ${
              isDarkMode
                ? "border-gray-700 bg-gray-700"
                : "border-lightGray bg-offWhite"
            }`}
          >
            <h3 className="font-bold text-base sm:text-lg mb-2 text-charcoal">
              Quiz Information
            </h3>
            <ul className="space-y-2 text-sm sm:text-base">
              <li className="flex items-center">
                <FiClock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-mint" />
                <span>Duration: {quiz.durationMinutes} minutes</span>
              </li>
              <li>Total Questions: {quiz.questions.length}</li>
              <li>
                Total Points:{" "}
                {quiz.questions.reduce((sum, q) => sum + q.points, 0)}
              </li>
            </ul>
          </div>

          <div
            className={`p-3 sm:p-4 border rounded mb-6 ${
              isDarkMode
                ? "border-yellow-500 bg-yellow-900/30"
                : "border-yellow-300 bg-yellow-50"
            }`}
          >
            <h3 className="font-bold text-base sm:text-lg mb-2 text-charcoal">
              Instructions
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base">
              <li>Once started, the quiz timer cannot be paused.</li>
              <li>You must complete the quiz within the allotted time.</li>
              <li>You can only submit the quiz once.</li>
              <li>Results will be displayed immediately after submission.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0">
            <button
              onClick={onBackToList}
              className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Back to Quizzes
            </button>
            <button
              onClick={handleStartQuiz}
              className="px-3 py-1 sm:px-4 sm:py-2 bg-mint text-white rounded-lg hover:bg-purple transition-colors text-sm sm:text-base"
            >
              Start Quiz
            </button>
          </div>
        </div>
      ) : (
        <div>
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-800 px-3 py-2 sm:px-4 sm:py-3 rounded mb-4 text-sm sm:text-base">
              {error}
            </div>
          )}

          <div className="sticky top-0 z-10 mb-4 p-2 sm:p-3 flex justify-between items-center rounded-lg shadow-md bg-opacity-95 backdrop-blur-sm bg-offWhite">
            <div className="font-bold text-charcoal text-sm sm:text-base">
              Time Remaining:{" "}
              <span className="text-lg sm:text-xl text-mint">
                {formatTime(timeLeft)}
              </span>
            </div>
            <button
              onClick={handleSubmitQuiz}
              className="px-2 py-1 sm:px-4 sm:py-2 bg-mint text-white rounded-lg hover:bg-purple transition-colors text-xs sm:text-sm"
            >
              Submit Quiz
            </button>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {quiz.questions.map((question, qIndex) => (
              <div
                key={qIndex}
                className={`p-3 sm:p-4 border rounded ${
                  isDarkMode
                    ? "border-gray-700 bg-gray-700"
                    : "border-lightGray bg-offWhite"
                }`}
              >
                <h3 className="font-bold text-sm sm:text-lg mb-2 text-charcoal">
                  Question {qIndex + 1}: {question.text}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-3">
                  Points: {question.points}
                </p>

                <div className="space-y-2">
                  {question.options.map((option, oIndex) => (
                    <div
                      key={oIndex}
                      onClick={() => handleAnswerSelect(qIndex, oIndex)}
                      className={`p-2 sm:p-3 border rounded cursor-pointer text-xs sm:text-sm ${
                        answers[qIndex] === oIndex
                          ? isDarkMode
                            ? "bg-blue-700 border-blue-500"
                            : "bg-mint bg-opacity-10 border-mint"
                          : isDarkMode
                          ? "bg-gray-600 border-gray-600 hover:bg-gray-600"
                          : "bg-white border-lightGray hover:bg-offWhite"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`h-4 w-4 sm:h-5 sm:w-5 rounded-full border flex items-center justify-center mr-2 sm:mr-3 ${
                            answers[qIndex] === oIndex
                              ? isDarkMode
                                ? "border-blue-400 bg-blue-600"
                                : "border-mint bg-mint"
                              : isDarkMode
                              ? "border-gray-500"
                              : "border-gray-400"
                          }`}
                        >
                          {answers[qIndex] === oIndex && (
                            <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-white"></div>
                          )}
                        </div>
                        {option}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div>
              <div className="text-xs sm:text-sm text-gray-500">
                {answers.filter((a) => a !== -1).length} of{" "}
                {quiz.questions.length} questions answered
              </div>
            </div>
            <button
              onClick={handleSubmitQuiz}
              className="w-full sm:w-auto px-3 py-1 sm:px-4 sm:py-2 bg-mint text-white rounded-lg hover:bg-purple transition-colors text-sm sm:text-base"
            >
              Submit Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizView;
