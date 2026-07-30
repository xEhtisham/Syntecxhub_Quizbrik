"use strict";

const CATEGORIES = ["Science", "History", "Technology"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const DEFAULT_QUESTION_COUNT = 10;
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 50;
const TIMER_SECONDS = 30;

const state = {
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

async function startQuiz() {
  const categorySelect = document.getElementById('category');
  const difficultySelect = document.getElementById('difficulty');
  const countInput = document.getElementById('questions');

  const category = categorySelect.value;
  const difficulty = difficultySelect.value;
  const count = parseInt(countInput.value, 10);

  const allQuestions = await loadQuestions();
  
  const filtered = allQuestions.filter(q => q.category === category && q.difficulty === difficulty);
  
  if (filtered.length === 0) {
    alert("No questions match your selected category and difficulty.");
    return;
  }

  const shuffled = shuffle(filtered);
  const selectedQuestions = shuffled.slice(0, count);

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
    if (!raw) return { totalQuizzes: 0, totalQuestions: 0, totalCorrect: 0 };
    return JSON.parse(raw);
  } catch (e) {
    return { totalQuizzes: 0, totalQuestions: 0, totalCorrect: 0 };
  }
}

function saveQuizStats(score, total) {
  const stats = getStoredStats();
  stats.totalQuizzes += 1;
  stats.totalQuestions += total;
  stats.totalCorrect += score;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats', e);
  }
}

function renderLanding() {
  const categoriesHtml = CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  const difficultiesHtml = DIFFICULTIES.map(d => `<option value="${d}" ${d === 'Medium' ? 'selected' : ''}>${d}</option>`).join('');
  const questionCounts = [5, 10, 15, 20, 25, 30];
  const countsHtml = questionCounts.map(n => `<option value="${n}" ${n === DEFAULT_QUESTION_COUNT ? 'selected' : ''}>${n} Questions</option>`).join('');

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

  return `
    <main class="landing">
      <section class="card">
        <header>
          <h1>Quizbrik</h1>
          <p>Test your knowledge. Learn. Compete. Improve.</p>
        </header>
        ${statsHtml}
        <div class="form-group">
          <label for="category">Category</label>
          <select id="category" class="input">${categoriesHtml}</select>
        </div>
        <div class="form-group">
          <label for="difficulty">Difficulty</label>
          <select id="difficulty" class="input">${difficultiesHtml}</select>
        </div>
        <div class="form-group">
          <label for="questions">Number of Questions</label>
          <select id="questions" class="input">${countsHtml}</select>
        </div>
        <button id="start-quiz-btn" class="btn">Start Quiz</button>
      </section>
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
    saveQuizStats(state.score, state.questions.length);
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

