"use strict";

const CATEGORIES = ["General Knowledge", "Science", "Technology", "History", "Geography", "Sports"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const DEFAULT_QUESTION_COUNT = 10;
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 50;
const TIMER_SECONDS = 30;

const state = {
  selectedCategory: "General Knowledge",
  selectedDifficulty: "Medium",
  selectedAmount: 10,
  questions: [],
  userAnswers: [],
  currentQuestion: 0,
  score: 0,
  answered: false,
  selectedAnswer: null,
  timer: TIMER_SECONDS,
  timerInterval: null,
};

async function loadQuestions() {
  const response = await fetch('data/questions.json');
  return response.json();
}

function shuffle(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const OTDB_CATEGORY_MAP = {
  "General Knowledge": 9,
  "Science": 17,
  "Technology": 18,
  "History": 23,
  "Geography": 22,
  "Sports": 21
};

function decodeHTML(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

function convertOTDBQuestions(results) {
  return results.map((item, index) => {
    const question = decodeHTML(item.question);
    const correctAnswer = decodeHTML(item.correct_answer);
    const incorrectAnswers = item.incorrect_answers.map(decodeHTML);
    const options = shuffle([correctAnswer, ...incorrectAnswers]);

    return {
      id: index + 1,
      category: decodeHTML(item.category),
      difficulty: item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1),
      question: question,
      options: options,
      correctAnswer: correctAnswer,
      explanation: `The correct answer is ${correctAnswer}.`
    };
  });
}

async function startQuiz() {
  const category = state.selectedCategory;
  const difficulty = state.selectedDifficulty.toLowerCase();
  const count = state.selectedAmount;
  const categoryId = OTDB_CATEGORY_MAP[category];

  let selectedQuestions = [];

  if (categoryId) {
    try {
      const url = `https://opentdb.com/api.php?amount=${count}&category=${categoryId}&difficulty=${difficulty}&type=multiple`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.response_code === 0 && data.results && data.results.length > 0) {
        selectedQuestions = convertOTDBQuestions(data.results);
      }
    } catch (err) {
      console.warn("OTDB API unavailable, using local questions fallback", err);
    }
  }

  // Fallback to local questions if API is offline or empty
  if (selectedQuestions.length === 0) {
    const allQuestions = await loadQuestions();
    let filtered = allQuestions.filter(q => q.category === category && q.difficulty.toLowerCase() === difficulty);
    
    // If no exact category+difficulty match, filter by category
    if (filtered.length === 0) {
      filtered = allQuestions.filter(q => q.category === category);
    }
    if (filtered.length === 0) {
      filtered = allQuestions;
    }

    // Fill up to requested count by shuffling and repeating from pool if needed
    const pool = shuffle(filtered);
    selectedQuestions = [];
    while (selectedQuestions.length < count) {
      selectedQuestions.push(...pool);
    }
    selectedQuestions = selectedQuestions.slice(0, count);
  }

  // Enforce session difficulty on all question objects
  selectedQuestions = selectedQuestions.map(q => ({
    ...q,
    difficulty: state.selectedDifficulty
  }));

  state.questions = selectedQuestions;
  state.userAnswers = new Array(selectedQuestions.length).fill(null);
  state.currentQuestion = 0;
  state.score = 0;
  state.answered = false;
  state.selectedAnswer = null;
  state.timer = TIMER_SECONDS;

  showQuiz(true);
}

const SETTINGS_KEY = 'quizbrik_user_settings';
const HISTORY_KEY = 'quizbrik_user_history';

function getStoredSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { timerSeconds: 30 };
  } catch (e) {
    return { timerSeconds: 30 };
  }
}

function saveStoredSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}
}

function getStoredHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveHistoryRecord(record) {
  const history = getStoredHistory();
  history.unshift(record);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {}
}

function clearStoredHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

const STATS_KEY = 'quizbrik_user_stats';

function getStoredStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { totalQuizzes: 0, totalQuestions: 0, totalCorrect: 0, categories: {} };
    const parsed = JSON.parse(raw);
    if (!parsed.categories) parsed.categories = {};
    return parsed;
  } catch (e) {
    return { totalQuizzes: 0, totalQuestions: 0, totalCorrect: 0, categories: {} };
  }
}

function saveQuizStats(questions, userAnswers) {
  if (!questions || questions.length === 0) return;
  
  const stats = getStoredStats();
  stats.totalQuizzes += 1;

  questions.forEach((q, idx) => {
    const isCorrect = userAnswers[idx] === q.correctAnswer;
    stats.totalQuestions += 1;
    if (isCorrect) stats.totalCorrect += 1;

    const cat = q.category || state.selectedCategory;
    if (!stats.categories[cat]) {
      stats.categories[cat] = { total: 0, correct: 0 };
    }
    stats.categories[cat].total += 1;
    if (isCorrect) stats.categories[cat].correct += 1;
  });

  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats', e);
  }
}

function renderLanding() {
  const categoryPillsHtml = CATEGORIES.map(c => 
    `<button type="button" class="pill-btn ${c === state.selectedCategory ? 'active' : ''}" data-type="category" data-value="${c}">${c}</button>`
  ).join('');

  const difficultyPillsHtml = DIFFICULTIES.map(d => 
    `<button type="button" class="segment-btn ${d === state.selectedDifficulty ? 'active' : ''}" data-type="difficulty" data-value="${d}">${d}</button>`
  ).join('');

  const questionCounts = [5, 10, 15, 20, 25, 30];
  const countPillsHtml = questionCounts.map(n => 
    `<button type="button" class="pill-btn ${n === state.selectedAmount ? 'active' : ''}" data-type="count" data-value="${n}">${n}</button>`
  ).join('');

  const stats = getStoredStats();
  const avgScore = stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0;
  const totalCorrect = stats.totalCorrect || 0;

  const statsHtml = `
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-value">${stats.totalQuizzes}</span>
        <span class="stat-label">Sessions</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${avgScore}<span class="stat-unit">%</span></span>
        <span class="stat-label">Avg. Score</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${totalCorrect}<span class="stat-unit">/${stats.totalQuestions}</span></span>
        <span class="stat-label">Correct</span>
      </div>
    </div>
  `;

  const categoryAnalyticsHtml = CATEGORIES.map(cat => {
    const catData = stats.categories[cat] || { total: 0, correct: 0 };
    const percentage = catData.total > 0 ? Math.round((catData.correct / catData.total) * 100) : 0;
    const subtitle = catData.total > 0 ? `${catData.correct} of ${catData.total} correct` : 'No data yet';

    return `
      <div class="analytics-row${catData.total === 0 ? ' analytics-row--empty' : ''}">
        <div class="analytics-meta">
          <span>${cat}</span>
          <span>${catData.total > 0 ? percentage + '%' : '--'}</span>
        </div>
        <div class="analytics-bar-track">
          <div class="analytics-bar-fill" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
  }).join('');

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return `
    <div class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">${dateStr}</p>
        </div>
      </header>

      <div class="overview-strip">
        ${statsHtml}
      </div>

      <div class="dashboard-grid">
        <section class="card launch-card">
          <header class="card-header">
            <h2>New Session</h2>
          </header>

          <div class="form-group">
            <label>Category</label>
            <div class="pill-group" id="category-pills">
              ${categoryPillsHtml}
            </div>
          </div>

          <div class="form-group">
            <label>Difficulty</label>
            <div class="segmented-control" id="difficulty-pills">
              ${difficultyPillsHtml}
            </div>
          </div>

          <div class="form-group">
            <label>Questions</label>
            <div class="pill-group" id="count-pills">
              ${countPillsHtml}
            </div>
          </div>

          <button id="start-quiz-btn" class="btn btn-start">Start Session</button>
        </section>

        <section class="card analytics-card">
          <header class="card-header">
            <h2>Category Mastery</h2>
          </header>
          <div class="analytics-grid">
            ${categoryAnalyticsHtml}
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderQuiz() {
  const q = state.questions[state.currentQuestion];
  const qNum = state.currentQuestion + 1;
  const total = state.questions.length;
  
  const labels = ['A', 'B', 'C', 'D'];
  
  const optionsHtml = q.options.map((opt, index) => {
    let btnClass = 'option-btn';
    let disabled = '';
    
    if (state.answered) {
      disabled = 'disabled';
      if (opt === q.correctAnswer) {
        btnClass += ' correct';
      } else if (opt === state.selectedAnswer) {
        btnClass += ' wrong';
      }
    } else if (opt === state.selectedAnswer) {
      btnClass += ' selected';
    }
    
    return `<button class="${btnClass}" data-answer="${opt.replace(/"/g, '&quot;')}" ${disabled}>
      <span class="label">${labels[index]}</span> ${opt}
    </button>`;
  }).join('');

  const isSubmitDisabled = !state.selectedAnswer ? 'disabled' : '';
  const isLast = state.currentQuestion === state.questions.length - 1;
  const nextBtnText = isLast ? "Finish Quiz" : "Next Question";
  const timerWarningClass = state.timer <= 10 ? 'timer-warning' : '';

  return `
    <div class="page">
      <main class="quiz">
        <section class="card quiz-card">
          <div class="quiz-header">
            <div class="quiz-badge-bar">
              <div class="quiz-badge-left">
                <span class="category-badge">${q.category}</span>
                <span class="difficulty-badge difficulty-${q.difficulty.toLowerCase()}">${q.difficulty}</span>
              </div>
              <button id="cancel-quiz-btn" class="quiz-cancel-btn" title="Quit Quiz Session">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                Quit Session
              </button>
            </div>
            <div class="quiz-info">
              <span>Question ${qNum} / ${total}</span>
              <span id="score-counter">Score: ${state.score}</span>
              <span id="timer" class="${timerWarningClass}">${state.timer}s</span>
            </div>
          </div>
          <progress value="${qNum}" max="${total}"></progress>
          <h2 class="question">${q.question}</h2>
          <div class="options">
            ${optionsHtml}
          </div>

          <div id="action-area" class="action-area" style="margin-top: 1.25rem; ${state.answered ? 'display: none;' : ''}">
            <button id="submit-btn" class="btn" ${isSubmitDisabled}>Submit Answer <span class="kbd-hint">Enter ↵</span></button>
          </div>

          <div id="explanation-area" class="explanation" style="${state.answered ? '' : 'display: none;'}">
            <p>${q.explanation}</p>
            <button id="next-btn" class="btn">${nextBtnText} <span class="kbd-hint">Enter ↵</span></button>
          </div>
        </section>
      </main>
    </div>
  `;
}

function renderResult() {
  const total = state.questions.length;
  const percentage = Math.round((state.score / total) * 100) || 0;
  
  let msg = "Keep practicing!";
  if (percentage >= 90) msg = "Outstanding!";
  else if (percentage >= 70) msg = "Great job!";
  else if (percentage >= 50) msg = "Good effort!";

  return `
    <div class="page">
      <main class="result">
        <section class="card">
          <h1>Quiz Complete</h1>
          <div class="score-circle" style="--percent: ${percentage}">
            <span>${state.score} / ${total}</span>
          </div>
          <p class="percentage">${percentage}%</p>
          <p class="message">${msg}</p>
          <div class="button-group">
            <button id="review-btn" class="btn btn-secondary">Review Answers</button>
            <button id="restart-btn" class="btn">Play Again</button>
          </div>
        </section>
      </main>
    </div>
  `;
}

function renderReview() {
  const reviewItemsHtml = state.questions.map((q, i) => {
    const userAns = state.userAnswers[i];
    const isCorrect = userAns === q.correctAnswer;
    const statusClass = isCorrect ? 'review-correct' : 'review-wrong';
    const statusText = isCorrect ? 'Correct' : (userAns ? 'Incorrect' : 'Time Expired');

    return `
      <div class="review-item ${statusClass}">
        <div class="review-item-header">
          <span class="review-q-num">Question ${i + 1}</span>
          <span class="review-status">${statusText}</span>
        </div>
        <h3 class="review-question">${q.question}</h3>
        <p class="review-user-ans"><strong>Your Answer:</strong> ${userAns || 'No Answer'}</p>
        ${!isCorrect ? `<p class="review-correct-ans"><strong>Correct Answer:</strong> ${q.correctAnswer}</p>` : ''}
        <p class="review-explanation">${q.explanation}</p>
      </div>
    `;
  }).join('');

  return `
    <div class="page">
      <main class="review">
        <section class="card review-card">
          <header class="review-header">
            <h1>Answer Review</h1>
            <p>Detailed breakdown of your performance</p>
          </header>
          <div class="review-list">
            ${reviewItemsHtml}
          </div>
          <button id="back-to-result-btn" class="btn" style="margin-top: 1.5rem;">Back to Results</button>
        </section>
      </main>
    </div>
  `;
}

function renderHistory() {
  const history = getStoredHistory();

  let historyContentHtml = '';

  if (history.length === 0) {
    historyContentHtml = `
      <div class="empty-state">
        <h3>No Quiz History Yet</h3>
        <p>Complete a quiz session to track your performance and history over time.</p>
        <button id="start-first-quiz-btn" class="btn empty-state-btn">Start Session</button>
      </div>
    `;
  } else {
    const listHtml = history.map(item => `
      <div class="history-card">
        <div class="history-main">
          <div class="history-title-row">
            <span class="history-category">${item.category}</span>
            <span class="difficulty-badge difficulty-${item.difficulty.toLowerCase()}">${item.difficulty}</span>
          </div>
          <div class="history-meta">
            <span>Completed on ${item.date}</span>
          </div>
        </div>
        <div class="history-right">
          <div class="history-score">
            <div class="history-score-val">${item.score} / ${item.total}</div>
            <div class="history-score-pct">${item.percentage}% Score</div>
          </div>
        </div>
      </div>
    `).join('');

    historyContentHtml = `
      <div class="history-list">
        ${listHtml}
      </div>
    `;
  }

  return `
    <div class="page">
      <header class="page-header history-header-actions">
        <div>
          <h1 class="page-title">Session History</h1>
          <p class="page-subtitle">View details and scores from past quiz sessions</p>
        </div>
        ${history.length > 0 ? `<button id="clear-history-btn" class="btn btn-danger-outline">Clear History</button>` : ''}
      </header>

      ${historyContentHtml}
    </div>
  `;
}

function showModalDialog({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false }) {
  return new Promise((resolve) => {
    const existing = document.getElementById('quizbrik-custom-modal');
    if (existing) existing.remove();

    const iconHtml = isDanger ? `
      <div class="modal-icon-wrapper danger">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
    ` : `
      <div class="modal-icon-wrapper info">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      </div>
    `;

    const modalContainer = document.createElement('div');
    modalContainer.id = 'quizbrik-custom-modal';
    modalContainer.className = 'modal-backdrop';
    modalContainer.innerHTML = `
      <div class="modal-card">
        ${iconHtml}
        <h3 class="modal-title">${title}</h3>
        <p class="modal-message">${message}</p>
        <div class="modal-actions">
          <button id="modal-cancel-btn" class="btn btn-secondary modal-btn-cancel">${cancelText}</button>
          <button id="modal-confirm-btn" class="btn ${isDanger ? 'btn-danger-solid' : ''} modal-btn-confirm">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalContainer);

    const closeModal = (result) => {
      modalContainer.remove();
      resolve(result);
    };

    document.getElementById('modal-cancel-btn').addEventListener('click', () => closeModal(false));
    document.getElementById('modal-confirm-btn').addEventListener('click', () => closeModal(true));
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) closeModal(false);
    });
  });
}

function showHistory() {
  updateActiveSidebarNav('history');
  app.innerHTML = renderHistory();

  const startBtn = document.getElementById('start-first-quiz-btn');
  if (startBtn) {
    startBtn.addEventListener('click', showLanding);
  }

  const clearBtn = document.getElementById('clear-history-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      const confirmed = await showModalDialog({
        title: "Clear Session History?",
        message: "Are you sure you want to delete all stored quiz session records? This cannot be undone.",
        confirmText: "Clear History",
        cancelText: "Keep Records",
        isDanger: true
      });
      if (confirmed) {
        clearStoredHistory();
        showHistory();
      }
    });
  }
}

function renderSettings() {
  const settings = getStoredSettings();

  const timerOptions = [15, 30, 45, 60];
  const timerPillsHtml = timerOptions.map(t => 
    `<button type="button" class="pill-btn ${t === settings.timerSeconds ? 'active' : ''}" data-setting="timer" data-value="${t}">${t}s</button>`
  ).join('');

  return `
    <div class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Settings</h1>
          <p class="page-subtitle">Configure your Quizbrik session preferences and data</p>
        </div>
      </header>

      <section class="card settings-card">
        <div class="settings-row">
          <div class="settings-info">
            <h3>Timer Duration</h3>
            <p>Time allowed per question during quiz sessions</p>
          </div>
          <div class="settings-control">
            <div class="pill-group" id="timer-setting-pills">
              ${timerPillsHtml}
            </div>
          </div>
        </div>

        <div class="settings-row">
          <div class="settings-info">
            <h3>Data Reset</h3>
            <p>Clear all local quiz history, performance metrics, and settings</p>
          </div>
          <div class="settings-control">
            <button id="reset-all-data-btn" class="btn btn-danger-outline">Reset All Data</button>
          </div>
        </div>
      </section>
    </div>
  `;
}

function showSettings() {
  updateActiveSidebarNav('settings');
  app.innerHTML = renderSettings();

  document.querySelectorAll('#timer-setting-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const val = parseInt(e.currentTarget.getAttribute('data-value'), 10);
      const settings = getStoredSettings();
      settings.timerSeconds = val;
      saveStoredSettings(settings);
      showSettings();
    });
  });

  const resetBtn = document.getElementById('reset-all-data-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      const confirmed = await showModalDialog({
        title: "Reset All Application Data?",
        message: "This will permanently wipe your session history, category performance stats, and settings.",
        confirmText: "Reset Everything",
        cancelText: "Cancel",
        isDanger: true
      });
      if (confirmed) {
        localStorage.removeItem(STATS_KEY);
        localStorage.removeItem(HISTORY_KEY);
        localStorage.removeItem(SETTINGS_KEY);
        showSettings();
      }
    });
  }
}

function updateActiveSidebarNav(pageName) {
  document.querySelectorAll('.nav-item').forEach(nav => {
    if (nav.getAttribute('data-page') === pageName) {
      nav.classList.add('active');
    } else {
      nav.classList.remove('active');
    }
  });
}

function setupSidebarNavigation() {
  document.querySelectorAll('.nav-item').forEach(nav => {
    nav.addEventListener('click', async (e) => {
      e.preventDefault();
      const page = nav.getAttribute('data-page');

      const isQuizActive = state.questions.length > 0 && state.currentQuestion < state.questions.length;
      if (isQuizActive) {
        const confirmed = await showModalDialog({
          title: "Quit Active Session?",
          message: "You have an ongoing quiz session. Are you sure you want to quit and leave?",
          confirmText: "Quit & Leave",
          cancelText: "Stay in Quiz",
          isDanger: true
        });
        if (!confirmed) {
          return;
        }
        state.questions = [];
        state.userAnswers = [];
        state.currentQuestion = 0;
        state.score = 0;
        state.answered = false;
        state.selectedAnswer = null;
      }

      clearInterval(state.timerInterval);

      if (page === 'dashboard') {
        showLanding();
      } else if (page === 'history') {
        showHistory();
      } else if (page === 'settings') {
        showSettings();
      }
    });
  });
}

function showLanding() {
  updateActiveSidebarNav('dashboard');
  app.innerHTML = renderLanding();
  document.getElementById('start-quiz-btn').addEventListener('click', startQuiz);

  document.querySelectorAll('.pill-btn, .segment-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const type = e.currentTarget.getAttribute('data-type');
      const val = e.currentTarget.getAttribute('data-value');
      const parent = e.currentTarget.parentElement;

      parent.querySelectorAll('.pill-btn, .segment-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');

      if (type === 'category') state.selectedCategory = val;
      if (type === 'difficulty') state.selectedDifficulty = val;
      if (type === 'count') state.selectedAmount = parseInt(val, 10);
    });
  });
}

async function cancelQuiz() {
  const confirmed = await showModalDialog({
    title: "Quit Session?",
    message: "Are you sure you want to quit this active quiz session and return to the Dashboard?",
    confirmText: "Quit Session",
    cancelText: "Keep Playing",
    isDanger: true
  });
  if (confirmed) {
    clearInterval(state.timerInterval);
    state.questions = [];
    state.userAnswers = [];
    state.currentQuestion = 0;
    state.score = 0;
    state.answered = false;
    state.selectedAnswer = null;
    showLanding();
  }
}

function showQuiz(isNewQuestion = false) {
  app.innerHTML = renderQuiz();

  const cancelBtn = document.getElementById('cancel-quiz-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', cancelQuiz);
  }
  
  if (!state.answered) {
    const optionBtns = document.querySelectorAll('.option-btn');
    optionBtns.forEach(btn => {
      btn.addEventListener('click', handleSelectOption);
    });

    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', submitAnswer);
    }

    if (isNewQuestion) {
      startTimer();
    }
  } else {
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
  }
}

function showResult(isFirstTime = false) {
  clearInterval(state.timerInterval);
  if (isFirstTime) {
    saveQuizStats(state.questions, state.userAnswers);

    const pct = Math.round((state.score / state.questions.length) * 100) || 0;
    const dateStr = new Date().toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    saveHistoryRecord({
      id: Date.now(),
      date: dateStr,
      category: state.selectedCategory,
      difficulty: state.selectedDifficulty,
      score: state.score,
      total: state.questions.length,
      percentage: pct
    });
  }
  app.innerHTML = renderResult();
  
  document.getElementById('review-btn').addEventListener('click', showReview);
  document.getElementById('restart-btn').addEventListener('click', () => {
    state.questions = [];
    state.userAnswers = [];
    state.currentQuestion = 0;
    state.score = 0;
    state.answered = false;
    state.selectedAnswer = null;
    showLanding();
  });
}

function showReview() {
  app.innerHTML = renderReview();
  document.getElementById('back-to-result-btn').addEventListener('click', () => showResult(false));
}

function startTimer() {
  clearInterval(state.timerInterval);
  const settings = getStoredSettings();
  state.timer = settings.timerSeconds || TIMER_SECONDS;
  
  const timerEl = document.getElementById('timer');
  
  state.timerInterval = setInterval(() => {
    state.timer--;
    if (timerEl) {
      timerEl.textContent = `${state.timer}s`;
      if (state.timer <= 10) {
        timerEl.classList.add('timer-warning');
      }
    }
    
    if (state.timer <= 0) {
      clearInterval(state.timerInterval);
      state.answered = true;
      state.userAnswers[state.currentQuestion] = state.selectedAnswer;
      const q = state.questions[state.currentQuestion];
      if (state.selectedAnswer && state.selectedAnswer === q.correctAnswer) {
        state.score++;
      }
      showQuiz(false);
    }
  }, 1000);
}

function handleSelectOption(e) {
  const btn = e.currentTarget;
  const answer = btn.getAttribute('data-answer');
  state.selectedAnswer = answer;
  
  document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) {
    submitBtn.disabled = false;
  }
}

function submitAnswer() {
  if (!state.selectedAnswer) return;

  clearInterval(state.timerInterval);
  const q = state.questions[state.currentQuestion];
  
  state.answered = true;
  state.userAnswers[state.currentQuestion] = state.selectedAnswer;
  
  if (state.selectedAnswer === q.correctAnswer) {
    state.score++;
  }

  // Update option buttons in-place without re-rendering HTML
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.disabled = true;
    const answer = btn.getAttribute('data-answer');
    if (answer === q.correctAnswer) {
      btn.classList.add('correct');
    } else if (answer === state.selectedAnswer) {
      btn.classList.add('wrong');
    }
  });

  // Update score counter in header
  const scoreEl = document.getElementById('score-counter');
  if (scoreEl) {
    scoreEl.textContent = `Score: ${state.score}`;
  }

  // Toggle action area and explanation area in-place smoothly
  const actionArea = document.getElementById('action-area');
  const explanationArea = document.getElementById('explanation-area');

  if (actionArea) actionArea.style.display = 'none';
  if (explanationArea) {
    explanationArea.style.display = 'block';
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', nextQuestion);
    }
  }
}

function nextQuestion() {
  clearInterval(state.timerInterval);
  state.currentQuestion++;
  state.answered = false;
  state.selectedAnswer = null;
  const settings = getStoredSettings();
  state.timer = settings.timerSeconds || TIMER_SECONDS;
  
  if (state.currentQuestion >= state.questions.length) {
    showResult(true);
  } else {
    showQuiz(true);
  }
}

function setupKeyboardControls() {
  document.addEventListener('keydown', (e) => {
    // Ignore key presses if a modal dialog is open or user is typing in an input
    if (document.getElementById('quizbrik-custom-modal')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Only active during quiz view when questions exist
    if (state.questions.length === 0 || state.currentQuestion >= state.questions.length) return;

    const key = e.key.toUpperCase();

    // Option selection keys: 1, 2, 3, 4 or A, B, C, D
    const optionMap = {
      '1': 0, 'A': 0,
      '2': 1, 'B': 1,
      '3': 2, 'C': 2,
      '4': 3, 'D': 3
    };

    if (!state.answered && optionMap.hasOwnProperty(key)) {
      const idx = optionMap[key];
      const optionBtns = document.querySelectorAll('.option-btn');
      if (optionBtns[idx] && !optionBtns[idx].disabled) {
        optionBtns[idx].click();
      }
    }

    // Submit or Next Question keys: Enter or Space
    if (e.key === 'Enter' || e.key === ' ') {
      if (!state.answered) {
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn && !submitBtn.disabled) {
          e.preventDefault();
          submitBtn.click();
        }
      } else {
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
          e.preventDefault();
          nextBtn.click();
        }
      }
    }

    // Quit session key: Escape
    if (e.key === 'Escape') {
      const cancelBtn = document.getElementById('cancel-quiz-btn');
      if (cancelBtn) {
        cancelBtn.click();
      }
    }
  });
}

const app = document.getElementById('app');
setupSidebarNavigation();
setupKeyboardControls();
showLanding();

