/**
 * ==========================================================
 * Landing Screen
 * Renders the application's landing page.
 * ==========================================================
 */

"use strict";

import { CONFIG } from "../config.js";

/**
 * Creates HTML <option> elements from an array.
 *
 * @param {string[]} items
 * @param {string|null} selectedItem
 * @returns {string}
 */
function createOptions(items, selectedItem = null) {
  return items
    .map(
      (item) => `
                <option ${item === selectedItem ? "selected" : ""}>
                    ${item}
                </option>
            `,
    )
    .join("");
}

/**
 * Creates the landing page.
 *
 * @returns {string}
 */
export function renderLandingPage() {
  return `
        <main class="landing">

            <section class="card">

                <header>

                    <h1>Quizbrik</h1>

                    <p>
                        Test Your Knowledge.
                        Learn. Compete. Improve.
                    </p>

                </header>

                <section>

                    <div>

                        <label for="category">
                            Category
                        </label>

                        <select
                            id="category"
                            class="input"
                        >
                            ${createOptions(CONFIG.categories)}
                        </select>

                    </div>

                    <div>

                        <label for="difficulty">
                            Difficulty
                        </label>

                        <select
                            id="difficulty"
                            class="input"
                        >
                            ${createOptions(CONFIG.difficulties, "Medium")}
                        </select>

                    </div>

                    <div>

                        <label for="questions">
                            Number of Questions
                        </label>

                        <input
                            id="questions"
                            class="input"
                            type="number"
                            value="${CONFIG.questionLimits.default}"
                            min="${CONFIG.questionLimits.min}"
                            max="${CONFIG.questionLimits.max}"
                        >

                    </div>

                </section>

                <button class="btn">
                    Start Quiz
                </button>

            </section>

        </main>
    `;
}
