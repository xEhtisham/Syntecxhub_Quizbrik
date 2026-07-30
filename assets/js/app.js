/**
 * ==========================================================
 * Quizbrik
 * Main Application Entry Point
 * ==========================================================
 */

"use strict";

import { renderLandingPage } from "./ui/landing.js";
import { renderQuizPage } from "./ui/quiz.js";
import { renderResultPage } from "./ui/result.js";
import { generateQuiz } from "./quiz/engine.js";

/**
 * Root container.
 */
const app = document.querySelector("#app");

/**
 * Current application state.
 */
const state = {
  currentScreen: "landing",
  quizConfig: null,

  questions: [],
  currentQuestion: 0,
  score: 0,

  answered: false,
  selectedAnswer: null,
};

/**
 * Render landing screen.
 */
function showLandingPage() {
  app.innerHTML = renderLandingPage();

  attachLandingEvents();
}

/**
 * Render quiz screen.
 */
function showQuizPage() {
  app.innerHTML = renderQuizPage(state);

  attachQuizEvents();
}

/**
 * Render result screen.
 */
function showResultPage() {
  app.innerHTML = renderResultPage(state);

  document.querySelector("#restart-btn").addEventListener("click", () => {
    state.currentQuestion = 0;
    state.score = 0;
    state.questions = [];
    state.quizConfig = null;

    state.answered = false;
    state.selectedAnswer = null;

    showLandingPage();
  });
}

/**
 * Attach landing page event listeners.
 */
function attachLandingEvents() {
  const startButton = document.querySelector("#start-quiz-btn");

  startButton.addEventListener("click", startQuiz);
}

/**
 * Start a new quiz.
 */
async function startQuiz() {
  const category = document.querySelector("#category").value;
  const difficulty = document.querySelector("#difficulty").value;
  const amount = Number(document.querySelector("#questions").value);

  state.quizConfig = {
    category,
    difficulty,
    amount,
  };

  try {
    state.questions = await generateQuiz(state.quizConfig);

    state.currentQuestion = 0;
    state.score = 0;

    state.answered = false;
    state.selectedAnswer = null;

    state.currentScreen = "quiz";

    showQuizPage();
  } catch (error) {
    console.error(error);

    alert("Unable to load quiz questions.");
  }
}

/**
 * Attach quiz event listeners.
 */
function attachQuizEvents() {
  if (!state.answered) {
    document.querySelectorAll(".option-btn").forEach((button) => {
      button.addEventListener("click", handleAnswer);
    });
  }

  const nextButton = document.querySelector("#next-btn");

  if (nextButton) {
    nextButton.addEventListener("click", nextQuestion);
  }
}

/**
 * Handle answer selection.
 */
function handleAnswer(event) {
  const selectedAnswer = event.target.dataset.answer;

  const currentQuestion = state.questions[state.currentQuestion];

  if (selectedAnswer === currentQuestion.correctAnswer) {
    state.score++;
  }

  state.selectedAnswer = selectedAnswer;
  state.answered = true;

  showQuizPage();
}

/**
 * Move to the next question.
 */
function nextQuestion() {
  state.currentQuestion++;

  state.answered = false;
  state.selectedAnswer = null;

  if (state.currentQuestion >= state.questions.length) {
    showResultPage();

    return;
  }

  showQuizPage();
}

/**
 * Initialize application.
 */
function initializeApp() {
  showLandingPage();
}

/**
 * Start application.
 */
initializeApp();
