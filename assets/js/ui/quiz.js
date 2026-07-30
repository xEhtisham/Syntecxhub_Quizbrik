"use strict";

export function renderQuizPage(state) {
  const question = state.questions[state.currentQuestion];

  /**
   * Returns the CSS class for an option
   * based on the user's selected answer.
   */
  const getClass = (option) => {
    if (!state.answered) {
      return "";
    }

    if (option === question.correctAnswer) {
      return "correct";
    }

    if (option === state.selectedAnswer && option !== question.correctAnswer) {
      return "wrong";
    }

    return "";
  };

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
                                    class="option-btn ${getClass(option)}"
                                    data-answer="${option}"
                                    ${state.answered ? "disabled" : ""}
                                >
                                    ${option}
                                </button>
                            `,
                      )
                      .join("")}

                </div>

                ${
                  state.answered
                    ? `
                            <div class="explanation">

                                <p>
                                    <strong>Explanation:</strong>
                                    ${question.explanation}
                                </p>

                                <button
                                    id="next-btn"
                                    class="btn"
                                >
                                    Next Question →
                                </button>

                            </div>
                        `
                    : ""
                }

            </section>

        </main>
    `;
}
