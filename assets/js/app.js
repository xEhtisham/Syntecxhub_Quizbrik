/**
 * ==========================================================
 * Quizbrik
 * Main Application Entry Point
 * ==========================================================
 */

"use strict";

import { renderLandingPage } from "./ui/landing.js";

/**
 * Root container where every screen
 * will be rendered.
 */
const app = document.querySelector("#app");

/**
 * Render the application.
 */
function initializeApp() {
  app.innerHTML = renderLandingPage();
}

/**
 * Start application.
 */
initializeApp();
