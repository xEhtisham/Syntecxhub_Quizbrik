/**
 * ==========================================================
 * Quizbrik
 * Main Application Entry Point
 * ==========================================================
 */

"use strict";

import { renderLandingPage } from "./ui/landing.js";
import { renderQuizPage } from "./ui/quiz.js";

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
  app.innerHTML = renderQuizPage();
}

/**
 * Attach landing page event listeners.
 */
function attachLandingEvents() {
  const startButton = document.querySelector("#start-quiz-btn");

  startButton.addEventListener("click", startQuiz);
}

/**
 * Read user selections and save them.
 */
function startQuiz() {
  const category = document.querySelector("#category").value;

  const difficulty = document.querySelector("#difficulty").value;

  const amount = Number(document.querySelector("#questions").value);

  state.quizConfig = {
    category,
    difficulty,
    amount,
  };

  state.currentScreen = "quiz";

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
