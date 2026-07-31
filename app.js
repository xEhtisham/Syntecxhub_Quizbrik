"use strict";

const CATEGORIES = ["Science", "History", "Technology", "Geography", "General Knowledge", "Business"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const DEFAULT_QUESTION_COUNT = 10;
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 50;
const TIMER_SECONDS = 30;

const state = {
  selectedCategory: "Science",
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
  "Science": 17,
  "History": 23,
  "Technology": 18,
  "Geography": 22,
  "General Knowledge": 9,
  "Business": 24
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
    const filtered = allQuestions.filter(q => q.category === category && q.difficulty.toLowerCase() === difficulty);
    const shuffled = shuffle(filtered.length > 0 ? filtered : allQuestions);
    selectedQuestions = shuffled.slice(0, count);
  }

  state.questions = selectedQuestions;
  state.userAnswers = new Array(selectedQuestions.length).fill(null);
  state.currentQuestion = 0;
  state.score = 0;
  state.answered = false;
  state.selectedAnswer = null;
  state.timer = TIMER_SECONDS;

  showQuiz(true);
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

  const statsHtml = `
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-value">${stats.totalQuizzes}</span>
        <span class="stat-label">Quizzes Played</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${avgScore}%</span>
        <span class="stat-label">Average Score</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${stats.totalQuestions}</span>
        <span class="stat-label">Questions</span>
      </div>
    </div>
  `;

  const categoryAnalyticsHtml = CATEGORIES.map(cat => {
    const catData = stats.categories[cat] || { total: 0, correct: 0 };
    const percentage = catData.total > 0 ? Math.round((catData.correct / catData.total) * 100) : 0;
    const subtitle = catData.total > 0 ? `${catData.correct} of ${catData.total} correct` : 'Not attempted yet';

    return `
      <div class="analytics-row">
        <div class="analytics-meta">
          <span>${cat}</span>
          <span>${catData.total > 0 ? percentage + '%' : '-'}</span>
        </div>
        <div class="analytics-bar-track">
          <div class="analytics-bar-fill" style="width: ${percentage}%"></div>
        </div>
        <div class="analytics-sub">${subtitle}</div>
      </div>
    `;
  }).join('');

  return `
    <main class="dashboard-portal">
      <header class="dashboard-topbar">
        <div class="brand">
          <span class="brand-title">Quizbrik</span>
          <span class="brand-tag">SaaS Portal</span>
        </div>
        <div class="topbar-right">
          <span class="portal-badge">Learning Hub</span>
        </div>
      </header>

      <div class="dashboard-grid">
        <div class="dashboard-col main-col">
          <section class="card launch-card">
            <header class="card-header">
              <h2>Quiz Setup</h2>
              <p>Configure your learning parameters and launch a session.</p>
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
              <label>Number of Questions</label>
              <div class="pill-group" id="count-pills">
                ${countPillsHtml}
              </div>
            </div>

            <button id="start-quiz-btn" class="btn btn-primary-lg">Start Quiz Session</button>
          </section>
        </div>

        <div class="dashboard-col side-col">
          <section class="card overview-card">
            <header class="card-header">
              <h2>Overall Metrics</h2>
            </header>
            ${statsHtml}
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
    </main>
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

  let actionAreaHtml = '';
  if (!state.answered) {
    const isSubmitDisabled = !state.selectedAnswer ? 'disabled' : '';
    actionAreaHtml = `
      <div class="action-area" style="margin-top: 1.25rem;">
        <button id="submit-btn" class="btn" ${isSubmitDisabled}>Submit Answer</button>
      </div>
    `;
  } else {
    const isLast = state.currentQuestion === state.questions.length - 1;
    const nextBtnText = isLast ? "Finish Quiz" : "Next Question";
    actionAreaHtml = `
      <div class="explanation">
        <p>${q.explanation}</p>
        <button id="next-btn" class="btn">${nextBtnText}</button>
      </div>
    `;
  }

  const timerWarningClass = state.timer <= 10 ? 'timer-warning' : '';

  return `
    <main class="quiz">
      <section class="card quiz-card">
        <div class="quiz-header">
          <div class="quiz-badge-bar">
            <span class="category-badge">${q.category}</span>
            <span class="difficulty-badge difficulty-${q.difficulty.toLowerCase()}">${q.difficulty}</span>
          </div>
          <div class="quiz-info">
            <span>Question ${qNum} / ${total}</span>
            <span>Score: ${state.score}</span>
            <span id="timer" class="${timerWarningClass}">${state.timer}s</span>
          </div>
        </div>
        <progress value="${qNum}" max="${total}"></progress>
        <h2 class="question">${q.question}</h2>
        <div class="options">
          ${optionsHtml}
        </div>
        ${actionAreaHtml}
      </section>
    </main>
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
  `;
}

function showLanding() {
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

function showQuiz(isNewQuestion = false) {
  app.innerHTML = renderQuiz();
  
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
  state.timer = TIMER_SECONDS;
  
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
  
  showQuiz(false);
}

function nextQuestion() {
  clearInterval(state.timerInterval);
  state.currentQuestion++;
  state.answered = false;
  state.selectedAnswer = null;
  state.timer = TIMER_SECONDS;
  
  if (state.currentQuestion >= state.questions.length) {
    showResult(true);
  } else {
    showQuiz(true);
  }
}

const app = document.getElementById('app');
showLanding();

