# LMS E-Learning Platform

A modern Learning Management System with a scalable Node.js/Express backend and a responsive React/Vite frontend. This LMS enables administrators to manage courses, authors, quizzes, certifications, and AI learning tools while delivering a rich student experience with multimedia, analytics, and payment support.

## 🌟 Project Overview

This repository contains:

- `Backend/` — REST API, database models, business logic, file upload handling, media processing, AI services, payment integrations, and Swagger docs.
- `frontend/` — React-based admin/student interface built with Vite, Redux Toolkit, TailwindCSS, Ant Design, and interactive UI modules.
- `embedder.py` + `requirements.txt` — optional Python utilities for embedding or AI-related tasks.

## 🚀 Key Features

### Core LMS capabilities

- Course creation, editing, publishing, and category management
- Student enrollment, resume learning, progress tracking, and certificates
- Quiz engine, assignments, contests, and challenge systems
- User roles and authentication with JWT support

### AI and learning enhancements

- AI summarization and content generation tools
- Code editor support for multiple languages
- Smart learning tools, question analysis, and performance tracking

### Media and documentation

- File upload support for PDF, images, audio, video, and documents
- Dynamic course preview assets, thumbnails, and video streaming
- Swagger-based API documentation at `/api-docs`

### Integrations

- Payment support via PayPal and Razorpay
- Firebase Admin support for user and app-related services
- Real-time updates and notifications through Socket.IO

## 🧩 Technology Stack

- Backend
  - Node.js, Express, Sequelize
  - MySQL / PostgreSQL
  - Firebase Admin, JWT, Swagger, CORS
- Frontend
  - React, Vite, Redux Toolkit
  - TailwindCSS, Ant Design, React Router
  - CodeMirror, charting libraries, drag-and-drop, audio/video players
- AI / media
  - Google Generative AI, Puppeteer, Tesseract.js, FFmpeg
  - text-to-speech, PDF generation, OCR, HTML parsing

## 📁 Folder Structure

- `Backend/`
  - `controllers/` — request handlers and feature logic
  - `models/` — Sequelize database models
  - `routes/` — API endpoint definitions
  - `config/` — database config, middleware, mailer, auth, and uploads
  - `migrations/` — database scripts and procedures
  - `socket/` — Socket.IO setup for real-time features
  - `swagger-output.json` — Swagger documentation payload
- `frontend/`
  - `src/` — main application source
  - `public/` — static assets
  - `vite.config.js` — Vite configuration
- Root files
  - `package.json` — shared or workspace-level dependencies
  - `requirements.txt` — Python dependency list
  - `embedder.py` — Python utility for embedding/AI tasks

## ⚙️ Setup Guide

### Prerequisites

- Node.js 18+ and npm
- MySQL or PostgreSQL database
- Optional: Python 3.11+ for Python utility scripts

### Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file inside `Backend/` with required environment variables.

Example `.env`:

```env
PORT=8000
DB_NAME=your_database_name
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=3306
DB_DIALECT=mysql
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
```

If your project uses Firebase Admin features, place `serviceAccountKey.json` in `Backend/`.

Start the backend server:

```bash
npm run start
```

### Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Open the app in your browser at:

- `http://localhost:5173`

### Optional Python Utility

If you use Python scripts such as `embedder.py`:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python embedder.py
```

## 🧪 Running the Application

- Backend API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/api-docs`
- Frontend app: `http://localhost:5173`

## 🔌 Environment Variables

At minimum, configure:

- `PORT` — backend port (default: 8000)
- `DB_NAME` — database name
- `DB_USERNAME` — database username
- `DB_PASSWORD` — database password
- `DB_HOST` — database host
- `DB_PORT` — database port
- `DB_DIALECT` — mysql or postgres
- `FRONTEND_URL` — frontend origin for CORS
- `JWT_SECRET` — API authentication secret

Additional variables may be required by your Firebase or payment configuration.

## ✅ Development Tips

- Use `nodemon` in the backend for hot reloads.
- Keep frontend and backend running in separate terminals.
- Check `Backend/index.js` for allowed CORS origins and static asset routes.
- Inspect `Backend/config/db.js` for Sequelize database connection settings.

## 💡 Contribution

Contributions are welcome! You can help by:

- Adding new course or learning features
- Improving backend API stability and documentation
- Enhancing frontend UI/UX and responsiveness
- Adding tests for critical functionality
- Streamlining deployment or setup instructions

## 📄 License

This project currently does not include a license. Add a license file to clarify terms for reuse and contribution.
