/**
 * ==========================================================
 * Quizbrik Configuration
 * Central place for application settings.
 * ==========================================================
 */

"use strict";

export const CONFIG = {
  categories: ["Science", "History", "Technology"],

  difficulties: ["Easy", "Medium", "Hard"],

  questionLimits: {
    min: 5,
    max: 50,
    default: 10,
  },
};
