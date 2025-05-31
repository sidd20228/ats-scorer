# ATS Resume Scorer

An AI-powered resume scoring application that helps users optimize their resumes for Applicant Tracking Systems (ATS).

## Features

- Upload and analyze resumes in PDF format
- Get ATS compatibility score
- Receive AI-powered suggestions for improvement
- Job role autocomplete
- Modern, responsive UI

## Deployment Instructions

### Frontend (Netlify)

1. Connect your GitHub repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
   - Environment variables:
     - REACT_APP_API_URL: Your Render backend URL

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment variables:
     - COHERE_API_KEY: Your Cohere API key
     - NODE_ENV: production

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd client
   npm install

   # Install backend dependencies
   cd ../server
   npm install
   ```

3. Create environment files:
   - Frontend (client/.env.development):
     ```
     REACT_APP_API_URL=http://localhost:5000
     ```
   - Backend (server/.env):
     ```
     COHERE_API_KEY=your_cohere_api_key
     ```

4. Start the development servers:
   ```bash
   # Start backend
   cd server
   npm run dev

   # Start frontend
   cd ../client
   npm start
   ```

## Environment Variables

### Frontend
- REACT_APP_API_URL: Backend API URL

### Backend
- COHERE_API_KEY: API key for Cohere
- NODE_ENV: Environment (development/production)

## Tech Stack

- Frontend: React, TypeScript
- Backend: Node.js, Express
- AI: Cohere API
- Deployment: Netlify (frontend), Render (backend)
