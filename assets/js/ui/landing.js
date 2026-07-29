/**
 * ==========================================================
 * Landing Screen
 * Renders the application's landing page.
 * ==========================================================
 */

"use strict";

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
                            <option>Science</option>
                            <option>History</option>
                            <option>Technology</option>
                        </select>

                    </div>

                    <br>

                    <div>

                        <label for="difficulty">
                            Difficulty
                        </label>

                        <select
                            id="difficulty"
                            class="input"
                        >
                            <option>Easy</option>
                            <option selected>Medium</option>
                            <option>Hard</option>
                        </select>

                    </div>

                    <br>

                    <div>

                        <label for="questions">
                            Number of Questions
                        </label>

                        <input
                            id="questions"
                            class="input"
                            type="number"
                            value="10"
                            min="5"
                            max="50"
                        >

                    </div>

                </section>

                <br>

                <button
                    class="btn"
                >
                    Start Quiz
                </button>

            </section>

        </main>

    `;
}
