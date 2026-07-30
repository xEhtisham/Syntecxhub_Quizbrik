/**
 * ==========================================================
 * Quizbrik
 * Main Application Entry Point
 * ==========================================================
 */

"use strict";

import { renderLandingPage } from "./ui/landing.js";
import { renderQuizPage } from "./ui/quiz.js";
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
 * Attach landing page event listeners.
 */
function attachLandingEvents() {
  const startButton = document.querySelector("#start-quiz-btn");

  startButton.addEventListener("click", startQuiz);
}

/**
 * Read user selections and save them.
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

    state.currentScreen = "quiz";

    console.log(state.questions);

    showQuizPage();
  } catch (error) {
    console.error(error);

    alert("Unable to load quiz questions.");
  }
}
function attachQuizEvents() {
  document.querySelectorAll(".option-btn").forEach((button) => {
    button.addEventListener("click", handleAnswer);
  });
}

function handleAnswer(event) {
  const selectedAnswer = event.target.dataset.answer;

  const current = state.questions[state.currentQuestion];

  if (selectedAnswer === current.correctAnswer) {
    state.score++;
  }

  state.currentQuestion++;

  if (state.currentQuestion >= state.questions.length) {
    app.innerHTML = `
            <main>
                <section class="card">
                    <h2>Quiz Finished 🎉</h2>

                    <h3>
                        Score:
                        ${state.score}
                        /
                        ${state.questions.length}
                    </h3>
                </section>
            </main>
        `;

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
