# Quizbrik

Quizbrik is a modern, high-performance quiz and evaluation platform built with Vanilla HTML5, CSS3, and JavaScript (ES6+). It features live integration with Open Trivia DB, fallback dataset handling, dynamic session configuration, and session analytics.

## Features

- **Live & Offline Trivia Engine**: Connects to the Open Trivia API with session token authentication, exponential rate-limit backoff, and local dataset fallback.
- **8 Core Categories**: General Knowledge, Science, Technology, History, Geography, Sports, Film, and Music.
- **Adaptive Timers**: Per-difficulty countdown timers (Easy: 30s, Medium: 25s, Hard: 20s).
- **Zero-Shift UX**: In-place button morphing and smooth explanation reveals for seamless question answering.
- **Interactive Review & Filtering**: Filter session reviews by All, Incorrect, and Correct answers with explanation breakdowns.
- **Local Analytics & History**: Persistent session statistics, accuracy metrics, and category mastery tracking powered by `localStorage`.

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Data Source**: Open Trivia Database API (`opentdb.com`)
- **Typography**: Google Fonts (Inter)
- **Icons**: SVG

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/xEhtisham/Syntecxhub_Quizbrik.git
   ```
2. Open `index.html` in any web browser or serve with a local static server.