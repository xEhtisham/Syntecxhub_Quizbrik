"use strict";

export function renderResultPage(state) {
  const percentage = Math.round((state.score / state.questions.length) * 100);

  return `
    <main class="result">

        <section class="card">

            <h1>Quiz Completed 🎉</h1>

            <h2>${state.score} / ${state.questions.length}</h2>

            <h3>${percentage}%</h3>

            <button id="restart-btn" class="btn">
                Play Again
            </button>

        </section>

    </main>
    `;
}
