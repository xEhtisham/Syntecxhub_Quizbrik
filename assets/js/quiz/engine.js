/**
 * ==========================================================
 * Quiz Engine
 * Handles loading and preparing quiz questions.
 * ==========================================================
 */

"use strict";

/**
 * Load all questions from the JSON file.
 *
 * @returns {Promise<Array>}
 */
export async function loadQuestions() {
  const response = await fetch("data/questions.json");

  if (!response.ok) {
    throw new Error("Failed to load questions.");
  }

  return await response.json();
}

/**
 * Shuffle an array using Fisher-Yates.
 *
 * @param {Array} array
 * @returns {Array}
 */
function shuffle(array) {
  const items = [...array];

  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [items[i], items[j]] = [items[j], items[i]];
  }

  return items;
}

/**
 * Generate a quiz.
 *
 * @param {Object} config
 * @returns {Promise<Array>}
 */
export async function generateQuiz(config) {
  const questions = await loadQuestions();

  const filtered = questions.filter(
    (question) =>
      question.category === config.category &&
      question.difficulty === config.difficulty,
  );

  return shuffle(filtered).slice(0, config.amount);
}
