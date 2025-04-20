import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  QuizQuestion,
  createQuiz,
  updateQuiz,
  getQuiz,
} from "../../utils/firebase";
import { FiPlus, FiTrash2 } from "react-icons/fi";

interface QuizCreatorProps {
  conferenceId: string;
  quizId?: string; // Optional: for editing existing quiz
  onSuccess: (quizId: string) => void;
  onCancel: () => void;
}

const QuizCreator: React.FC<QuizCreatorProps> = ({
  conferenceId,
  quizId,
  onSuccess,
  onCancel,
}) => {
  const { currentUser } = useAuth();
  const isDarkMode = false; // Simplified theme handling
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Quiz form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState<Omit<QuizQuestion, "id">[]>([
    {
      text: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
      points: 1,
    },
  ]);

  // Load existing quiz data if editing
  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId) return;

      try {
        setLoading(true);
        const quizData = await getQuiz(quizId);
        if (quizData) {
          setTitle(quizData.title);
          setDescription(quizData.description);
          setDurationMinutes(quizData.durationMinutes);
          setIsActive(quizData.isActive);

          // Convert questions to format without ID for editing
          const formattedQuestions = quizData.questions.map((q) => ({
            text: q.text,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            points: q.points,
          }));
          setQuestions(formattedQuestions);
        }
      } catch (err) {
        setError("Failed to load quiz data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        points: 1,
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleQuestionChange = (
    index: number,
    field: keyof QuizQuestion,
    value: any
  ) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    };
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updatedQuestions = [...questions];
    const options = [...updatedQuestions[questionIndex].options];
    options[optionIndex] = value;
    updatedQuestions[questionIndex].options = options;
    setQuestions(updatedQuestions);
  };

  const handleAddOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options.length < 10) {
      updatedQuestions[questionIndex].options.push("");
      setQuestions(updatedQuestions);
    }
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options.length > 2) {
      const newOptions = updatedQuestions[questionIndex].options.filter(
        (_, i) => i !== optionIndex
      );
      updatedQuestions[questionIndex].options = newOptions;

      // Update correct option index if it's affected
      if (updatedQuestions[questionIndex].correctOptionIndex === optionIndex) {
        updatedQuestions[questionIndex].correctOptionIndex = 0;
      } else if (
        updatedQuestions[questionIndex].correctOptionIndex > optionIndex
      ) {
        updatedQuestions[questionIndex].correctOptionIndex--;
      }

      setQuestions(updatedQuestions);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError("Quiz title is required");
      return false;
    }

    if (durationMinutes < 1 || durationMinutes > 120) {
      setError("Quiz duration must be between 1 and 120 minutes");
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setError(`Question ${i + 1} text is required`);
        return false;
      }

      if (q.options.some((opt) => !opt.trim())) {
        setError(`All options for question ${i + 1} must be filled`);
        return false;
      }

      if (q.correctOptionIndex >= q.options.length) {
        setError(`Invalid correct answer selected for question ${i + 1}`);
        return false;
      }

      if (q.points < 1) {
        setError(`Points for question ${i + 1} must be positive`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentUser) {
      setError("You must be logged in to create a quiz");
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const quizData = {
        title,
        description,
        durationMinutes,
        isActive,
        questions,
      };

      let resultId: string;

      if (quizId) {
        // Update existing quiz
        await updateQuiz(quizId, {
          ...quizData,
          questions: questions.map((q) => ({
            ...q,
            id: crypto.randomUUID(),
          })),
        });
        resultId = quizId;
        setSuccess("Quiz updated successfully!");
      } else {
        // Create new quiz
        resultId = await createQuiz(
          conferenceId,
          currentUser.uid,
          currentUser.displayName || "Anonymous User",
          quizData as any
        );
        setSuccess("Quiz created successfully!");
      }

      // Wait for success message to show before redirecting
      setTimeout(() => {
        onSuccess(resultId);
      }, 1500);
    } catch (err) {
      console.error("Error saving quiz:", err);
      setError("Failed to save quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`p-3 sm:p-4 rounded-lg shadow-md ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-white text-charcoal"
      }`}
    >
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-charcoal">
        {quizId ? "Edit Quiz" : "Create New Quiz"}
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-800 px-3 py-2 sm:px-4 sm:py-3 rounded mb-4 text-sm sm:text-base">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-400 text-green-800 px-3 py-2 sm:px-4 sm:py-3 rounded mb-4 text-sm sm:text-base">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2 font-medium text-charcoal text-sm sm:text-base">
            Quiz Title
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full p-2 border rounded text-sm sm:text-base ${
              isDarkMode
                ? "bg-gray-700 border-gray-600"
                : "bg-offWhite border-lightGray focus:border-mint"
            }`}
            placeholder="Enter quiz title"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-medium text-charcoal text-sm sm:text-base">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full p-2 border rounded text-sm sm:text-base ${
              isDarkMode
                ? "bg-gray-700 border-gray-600"
                : "bg-offWhite border-lightGray focus:border-mint"
            }`}
            placeholder="Enter quiz description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2 font-medium text-charcoal text-sm sm:text-base">
              Duration (minutes)
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              min={1}
              max={120}
              className={`w-full p-2 border rounded text-sm sm:text-base ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600"
                  : "bg-offWhite border-lightGray focus:border-mint"
              }`}
              required
            />
          </div>

          <div className="flex items-center mt-4 sm:mt-8">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="mr-2 accent-mint"
            />
            <label
              htmlFor="isActive"
              className="font-medium text-charcoal text-sm sm:text-base"
            >
              Make quiz active and available to attendees
            </label>
          </div>
        </div>

        <div className="my-6">
          <h3 className="text-lg sm:text-xl font-bold mb-4 text-charcoal">
            Questions
          </h3>

          {questions.map((question, qIndex) => (
            <div
              key={qIndex}
              className={`mb-6 p-3 sm:p-4 border rounded ${
                isDarkMode
                  ? "border-gray-600 bg-gray-700"
                  : "border-lightGray bg-offWhite"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-charcoal text-sm sm:text-base">
                  Question {qIndex + 1}
                </h4>
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(qIndex)}
                  disabled={questions.length === 1}
                  className={`p-1 rounded ${
                    questions.length === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-red-500 hover:bg-red-50"
                  }`}
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-3">
                <label className="block mb-2 font-medium text-charcoal text-sm sm:text-base">
                  Question Text
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={question.text}
                  onChange={(e) =>
                    handleQuestionChange(qIndex, "text", e.target.value)
                  }
                  className={`w-full p-2 border rounded text-sm sm:text-base ${
                    isDarkMode
                      ? "bg-gray-600 border-gray-500"
                      : "bg-white border-lightGray focus:border-mint"
                  }`}
                  placeholder="Enter question text"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block mb-2 font-medium text-charcoal text-sm sm:text-base">
                  Points
                </label>
                <input
                  type="number"
                  value={question.points}
                  onChange={(e) =>
                    handleQuestionChange(
                      qIndex,
                      "points",
                      Number(e.target.value)
                    )
                  }
                  min={1}
                  max={10}
                  className={`w-full p-2 border rounded text-sm sm:text-base ${
                    isDarkMode
                      ? "bg-gray-600 border-gray-500"
                      : "bg-white border-lightGray focus:border-mint"
                  }`}
                  required
                />
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-charcoal text-sm sm:text-base">
                    Answer Options
                    <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddOption(qIndex)}
                    className={`text-mint p-1 rounded hover:bg-mint hover:bg-opacity-10 ${
                      question.options.length >= 10
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={question.options.length >= 10}
                  >
                    <FiPlus className="h-5 w-5" />
                  </button>
                </div>

                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center mb-2">
                    <input
                      type="radio"
                      name={`correct-answer-${qIndex}`}
                      checked={question.correctOptionIndex === oIndex}
                      onChange={() =>
                        handleQuestionChange(
                          qIndex,
                          "correctOptionIndex",
                          oIndex
                        )
                      }
                      className="mr-2 accent-mint"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) =>
                        handleOptionChange(qIndex, oIndex, e.target.value)
                      }
                      className={`flex-grow p-2 border rounded text-sm sm:text-base ${
                        isDarkMode
                          ? "bg-gray-600 border-gray-500"
                          : "bg-white border-lightGray focus:border-mint"
                      } ${
                        question.correctOptionIndex === oIndex
                          ? isDarkMode
                            ? "border-green-500"
                            : "border-mint"
                          : ""
                      }`}
                      placeholder={`Option ${oIndex + 1}`}
                      required
                    />
                    {question.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(qIndex, oIndex)}
                        className="ml-2 text-red-500 p-1 rounded hover:bg-red-50"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <div className="text-xs sm:text-sm text-gray-500 mt-1">
                  Select the radio button next to the correct answer.
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddQuestion}
            className={`w-full py-2 px-4 border border-dashed rounded-lg text-sm sm:text-base ${
              isDarkMode
                ? "border-gray-600 hover:bg-gray-700 text-gray-300"
                : "border-lightGray hover:bg-offWhite text-gray-600"
            } flex items-center justify-center`}
          >
            <FiPlus className="h-5 w-5 mr-2" />
            Add Another Question
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className={`py-2 px-4 rounded-lg text-sm sm:text-base ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-mint text-white py-2 px-4 rounded-lg hover:bg-purple disabled:opacity-50 transition-colors text-sm sm:text-base"
            disabled={loading}
          >
            {loading ? "Saving..." : quizId ? "Update Quiz" : "Create Quiz"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuizCreator;
