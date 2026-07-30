/**
 * ==========================================================
 * Quizbrik
 * Main Application Entry Point
 * ==========================================================
 */

"use strict";

import { renderLandingPage } from "./ui/landing.js";

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
