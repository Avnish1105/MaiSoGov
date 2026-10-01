"use client";

import { useEffect, useState } from "react";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
}

interface QuestionsResponse {
  success: boolean;
  questions: QuizQuestion[];
  error?: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://maisogov.onrender.com";
const BACKEND_URL = API_URL.replace(/\/api\/?$/, "");

export default function Questioner({ onComplete }: { onComplete: () => void }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadQuestions = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/quiz/questions`, {
          credentials: "include",
        });
        const data = (await response.json()) as QuestionsResponse;

        if (!response.ok) {
          throw new Error(data.error || "Could not load questions.");
        }

        if (!cancelled) {
          setQuestions(data.questions);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load questions.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadQuestions();
    return () => {
      cancelled = true;
    };
  }, []);

  const submitAnswers = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/quiz/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          answers: questions.map((question) => ({
            questionId: question.id,
            question: question.question,
            options: question.options,
            selectedOption: answers[question.id],
          })),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to submit quiz.");
      }

      onComplete();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to submit quiz.",
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <p role="status" className="text-sm text-zinc-600">
          Generating your questions...
        </p>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-6">
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  const question = questions[currentQuestion];

  const advance = () => {
    if (!answers[question.id]) {
      setError("Select an answer to continue.");
      return;
    }

    setError(null);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((index) => index + 1);
      return;
    }

    void submitAnswers();
  };

  return (
    <section className="mx-auto flex min-h-[80vh] w-full max-w-xl flex-col justify-center px-4 py-8">
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6  sm:p-8">
        {/* Progress Bar Header */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <span>Progress</span>
            <span>
              Question {currentQuestion + 1}{" "}
              <span className="text-zinc-400">/ {questions.length}</span>
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-zinc-100 p-0.5"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={questions.length}
            aria-valuenow={currentQuestion + 1}
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300 ease-out"
              style={{
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question Title */}
        <h1 className="mb-6 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
          {question.question}
        </h1>

        {/* Options List */}
        <div className="space-y-3">
          {question.options.map((option) => {
            const isSelected = answers[question.id] === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setAnswers((previous) => ({
                    ...previous,
                    [question.id]: option,
                  }));
                  setError(null);
                }}
                disabled={submitting}
                className={`group relative flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm font-medium transition-all duration-150 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-sm ring-1 ring-emerald-600"
                    : "border-zinc-200 bg-zinc-50/50 text-zinc-700 hover:border-zinc-300 hover:bg-white hover:shadow-sm"
                }`}
              >
                <span className="pr-4">{option}</span>

                {/* Checkmark Indicator */}
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-zinc-300 bg-white group-hover:border-zinc-400"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="h-3 w-3 stroke-[3]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800"
          >
            <svg
              className="h-4 w-4 shrink-0 text-red-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Submit / Advance Button */}
        <button
          type="button"
          onClick={advance}
          disabled={submitting}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-150 hover:bg-zinc-800 hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin text-white"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span>Saving answers...</span>
            </div>
          ) : (
            <span>
              {currentQuestion === questions.length - 1
                ? "Finish Quiz"
                : "Continue"}
            </span>
          )}
        </button>
      </div>
    </section>
  );
}
