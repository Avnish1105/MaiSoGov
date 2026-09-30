"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const questions = [
  {
    id: 1,
    question: "What is your height?",
    options: ["Below 5 ft", "5–5.5 ft", "5.5–6 ft", "Above 6 ft"],
  },
  {
    id: 2,
    question: "What is your weight?",
    options: ["Below 50 kg", "50–65 kg", "65–80 kg", "Above 80 kg"],
  },
  {
    id: 3,
    question: "What is your usual activity level?",
    options: [
      "Mostly inactive",
      "Lightly active",
      "Moderately active",
      "Very active",
    ],
  },
  {
    id: 4,
    question: "How many hours do you usually sleep?",
    options: [
      "Less than 5 hours",
      "5–7 hours",
      "7–9 hours",
      "More than 9 hours",
    ],
  },
  {
    id: 5,
    question: "What time do you usually wake up?",
    options: ["Before 6 AM", "6–8 AM", "8–10 AM", "After 10 AM"],
  },
  {
    id: 6,
    question: "How often do you exercise?",
    options: ["Never", "1–2 days a week", "3–5 days a week", "Every day"],
  },
  {
    id: 7,
    question: "How do you usually spend your free time?",
    options: ["Gaming", "Watching videos", "Reading/learning", "Going out"],
  },
  {
    id: 8,
    question: "What is your preferred way of learning?",
    options: ["Videos", "Books", "Practice", "Lectures"],
  },
  {
    id: 9,
    question: "What do you usually do when you are stressed?",
    options: [
      "Take a break",
      "Listen to music",
      "Talk to someone",
      "Keep working",
    ],
  },
  {
    id: 10,
    question: "Which environment helps you focus?",
    options: [
      "Complete silence",
      "Music",
      "People around me",
      "It doesn't matter",
    ],
  },
  {
    id: 11,
    question: "How do you prefer to make decisions?",
    options: [
      "Think carefully",
      "Ask someone",
      "Go with my instincts",
      "Compare all options",
    ],
  },
  {
    id: 12,
    question: "What is your main goal right now?",
    options: [
      "Improve academics",
      "Improve fitness",
      "Build my career",
      "Improve personal life",
    ],
  },
];

export default function QuizPage() {
  const router = useRouter();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const question = questions[currentQuestion];

  const selectAnswer = (option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: option,
    }));
  };

  const nextQuestion = async () => {
    if (!answers[question.id]) {
      alert("Please select an answer");
      return;
    }

    // Prevent multiple submissions
    if (submitting) {
      return;
    }

    // More questions
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      return;
    }

    // Last question
    const payload = {
      answers: questions.map((q) => ({
        questionId: q.id,
        question: q.question,
        options: q.options,
        selectedOption: answers[q.id],
      })),
    };

    try {
      setSubmitting(true);

      const response = await fetch("http://localhost:5000/quiz/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log(data);

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // Go to dashboard after successful submission
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Failed to submit quiz");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-xl p-6">
        <p className="text-sm mb-2">
          Question {currentQuestion + 1} of {questions.length}
        </p>

        <h1 className="text-2xl font-bold mb-6">{question.question}</h1>

        <div className="space-y-3">
          {question.options.map((option) => (
            <button
              key={option}
              onClick={() => selectAnswer(option)}
              disabled={submitting}
              className={`w-full text-left p-4 border rounded-lg ${
                answers[question.id] === option
                  ? "border-black bg-white text-black"
                  : "border-gray-300"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <button
          onClick={nextQuestion}
          disabled={submitting}
          className="mt-6 w-full p-4 bg-black text-white rounded-lg disabled:opacity-50"
        >
          {submitting
            ? "Submitting..."
            : currentQuestion === questions.length - 1
              ? "Finish"
              : "Next"}
        </button>
      </div>
    </div>
  );
}
