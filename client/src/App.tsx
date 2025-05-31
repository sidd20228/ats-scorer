import React, { useState } from 'react';
import './App.css';

// Example job roles for autocomplete
const JOB_ROLE_SUGGESTIONS = [
  'Software Engineer',
  'Data Scientist',
  'Product Manager',
  'Business Analyst',
  'UX Designer',
  'Frontend Developer',
  'Backend Developer',
  'DevOps Engineer',
  'QA Engineer',
  'Project Manager',
  'AI Researcher',
  'Cloud Architect',
  'Mobile Developer',
  'Full Stack Developer',
  'Technical Writer',
  'Cybersecurity Analyst',
  'Database Administrator',
  'Network Engineer',
  'Machine Learning Engineer',
  'HR Manager',
  'Marketing Specialist',
];

interface RequirementMatch {
  requirement: string;
  score: number;
}

function App() {
  const [resume, setResume] = useState<File | null>(null);
  const [jobRole, setJobRole] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobRoleSuggestions, setJobRoleSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [requirementMatches, setRequirementMatches] = useState<RequirementMatch[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResume(e.target.files[0]);
    }
  };

  // Fetch dynamic job role suggestions from backend (Cohere)
  const fetchJobRoleSuggestions = async (value: string) => {
    if (value.length < 2) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/job-role-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: value })
      });
      const data = await res.json();
      setJobRoleSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    } catch {
      setJobRoleSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleJobRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setJobRole(value);
    if (value.length > 0) {
      fetchJobRoleSuggestions(value);
    } else {
      setJobRoleSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setJobRole(suggestion);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setScore(null);
    setSuggestions('');
    setRequirementMatches([]);
    if (!resume || !jobRole) {
      setError('Please upload a resume and enter a job role.');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('resume', resume);
    formData.append('jobRole', jobRole);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/score`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setScore(data.atsScore);
        setSuggestions(data.aiSuggestions);
        setRequirementMatches(data.requirementMatches || []);
      } else {
        setError(data.error || 'Failed to score resume.');
      }
    } catch (err) {
      setError('Server error.');
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="hero-section">
          <h1 className="hero-title">Optimize Your Resume<br />with AI-Powered ATS</h1>
          <p className="hero-subtitle">
            Get instant feedback on your resume's ATS compatibility and receive AI-powered suggestions to improve your chances of landing your dream job.
          </p>
          <div className="stats-container">
            <div className="stat-item">
              <div className="stat-number">98%</div>
              <div className="stat-label">FORTUNE 500 COMPANIES<br />USE ATS</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">75%</div>
              <div className="stat-label">RESUMES ARE REJECTED<br />BY ATS</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">2x</div>
              <div className="stat-label">HIGHER INTERVIEW<br />CHANCES</div>
            </div>
          </div>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <div className="feature-title">Smart Analysis</div>
            <div className="feature-description">
              Our AI analyzes your resume against real job descriptions to ensure perfect alignment.
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <div className="feature-title">Instant Results</div>
            <div className="feature-description">
              Get your ATS score and detailed improvement suggestions in seconds.
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <div className="feature-title">AI-Powered</div>
            <div className="feature-description">
              Powered by Cohere's advanced AI for accurate and relevant suggestions.
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="file-input-wrapper" onClick={() => document.getElementById('file-input')?.click()}>
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="file-input"
            />
            <p>{resume ? resume.name : 'Drop your resume here or click to upload'}</p>
            <small style={{ opacity: 0.7 }}>Accepts PDF format</small>
          </div>
          
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              placeholder="Enter desired job role"
              value={jobRole}
              onChange={handleJobRoleChange}
              className="job-role-input"
              onFocus={() => jobRole && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            />
            {showSuggestions && jobRoleSuggestions.length > 0 && (
              <ul className="suggestions-list">
                {jobRoleSuggestions.map((suggestion, idx) => (
                  <li
                    key={idx}
                    onMouseDown={() => handleSuggestionClick(suggestion)}
                    className="suggestion-item"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Analyzing Resume...' : 'Get ATS Score'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}
        
        {score !== null && (
          <div className="results-container">
            <div className="score">{score}%</div>
            
            {requirementMatches.length > 0 && (
              <div className="requirements-section">
                <h3 className="requirements-title">Requirement Matches</h3>
                <div className="requirements-grid">
                  {requirementMatches.map((match, index) => (
                    <div key={index} className="requirement-item">
                      <div className="requirement-name">{match.requirement}</div>
                      <div className="requirement-score-bar">
                        <div 
                          className="requirement-score-fill" 
                          style={{ 
                            width: `${match.score}%`,
                            backgroundColor: match.score >= 60 ? '#00C367' : '#ff4d4d'
                          }} 
                        />
                      </div>
                      <div className="requirement-score-text">{match.score}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="suggestions-title">AI Suggestions to Improve Your Score:</div>
            <div className="suggestions-text">{suggestions}</div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
