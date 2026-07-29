/**
 * ==========================================================
 * Quizbrik
 * Main Application Entry Point
 * ==========================================================
 */

"use strict";

/**
 * Root container where every screen
 * will be rendered.
 */
const app = document.querySelector("#app");

/**
 * Render the application.
 */
function initializeApp() {
  app.innerHTML = `
    
        <h1>Welcome to Quizbrik 🚀</h1>
    
    `;
}

/**
 * Start application.
 */
initializeApp();
