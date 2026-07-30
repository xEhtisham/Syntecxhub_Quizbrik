"use strict";

export function renderQuizPage(state) {
  const question = state.questions[state.currentQuestion];

  return `
    <main class="quiz">

        <section class="card">

            <h2>
                Question ${state.currentQuestion + 1}
                / ${state.questions.length}
            </h2>

            <progress
                value="${state.currentQuestion + 1}"
                max="${state.questions.length}">
            </progress>

            <h3>${question.question}</h3>

            <div class="options">

                ${question.options
                  .map(
                    (option) => `

                    <button
                        class="option-btn"
                        data-answer="${option}">
                        ${option}
                    </button>

                `,
                  )
                  .join("")}

            </div>

        </section>

    </main>
    `;
}
