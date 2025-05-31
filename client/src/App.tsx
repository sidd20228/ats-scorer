import React, { useState, useEffect } from 'react';
import './App.css';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { IconBaseProps } from 'react-icons';

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

// Mock requirement matches for demonstration
const MOCK_REQUIREMENT_MATCHES = [
  { requirement: 'JavaScript/TypeScript Experience', score: 85 },
  { requirement: 'React.js Development', score: 92 },
  { requirement: 'Node.js Backend Development', score: 78 },
  { requirement: 'Database Management (SQL/NoSQL)', score: 65 },
  { requirement: 'Cloud Services (AWS/Azure)', score: 45 },
  { requirement: 'CI/CD Pipeline Experience', score: 30 },
  { requirement: 'Agile/Scrum Methodology', score: 88 },
  { requirement: 'System Architecture Design', score: 72 },
];

// Mock AI suggestions for demonstration
const MOCK_SUGGESTIONS = `1. Skills Enhancement:
   • Add more details about your cloud computing experience
   • Highlight specific AWS/Azure services you've worked with
   • Include CI/CD tools you're familiar with

2. Experience Optimization:
   • Quantify your achievements with metrics
   • Add more technical details about your projects
   • Include specific technologies used in each role

3. Formatting Improvements:
   • Use consistent bullet points
   • Add more white space between sections
   • Include relevant certifications

4. Keywords to Add:
   • Microservices
   • Docker
   • Kubernetes
   • RESTful APIs
   • GraphQL
   • Test-Driven Development`;

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResume(e.target.files[0]);
      setError('');
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

  const handleDemoClick = () => {
    setShowDemo(true);
    setScore(78);
    setSuggestions(MOCK_SUGGESTIONS);
    setRequirementMatches(MOCK_REQUIREMENT_MATCHES);
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
    setIsAnalyzing(true);
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
      setError('Server error. Please try again later.');
    }
    setLoading(false);
    setIsAnalyzing(false);
  };

  const handleDownloadReport = () => {
    if (!score || !suggestions || !requirementMatches.length) return;

    // Create report content
    const reportContent = `
ATS Score Report
===============

Overall ATS Compatibility Score: ${score}%

Requirement Matches:
${requirementMatches.map(match => 
  `- ${match.requirement}: ${match.score}%`
).join('\n')}

AI Suggestions for Improvement:
${suggestions}

Generated on: ${new Date().toLocaleDateString()}
    `.trim();

    // Create blob and download
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ats-score-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleShareResults = async () => {
    if (!score || !suggestions || !requirementMatches.length) return;

    const shareData = {
      title: 'My ATS Score Report',
      text: `My resume scored ${score}% on ATS compatibility! Check out my detailed report.`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support Web Share API
        const shareUrl = `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(shareData.text + '\n\n' + shareData.url)}`;
        window.location.href = shareUrl;
      }
    } catch (err) {
      console.error('Error sharing:', err);
      // Fallback to copying to clipboard
      const textToCopy = `${shareData.text}\n\n${shareData.url}`;
      try {
        await navigator.clipboard.writeText(textToCopy);
        alert('Share link copied to clipboard!');
      } catch (clipboardErr) {
        console.error('Error copying to clipboard:', clipboardErr);
        alert('Could not share results. Please try again later.');
      }
    }
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
          <div 
            className="file-input-wrapper" 
            onClick={() => document.getElementById('file-input')?.click()}
            style={{ 
              borderColor: resume ? '#00C367' : undefined,
              background: resume ? 'rgba(0, 195, 103, 0.05)' : undefined
            }}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="file-input"
              onClick={(e) => e.stopPropagation()}
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
          
          <div className="button-group">
            <button 
              type="submit" 
              disabled={loading || !resume || !jobRole} 
              className="submit-button"
            >
              {loading ? (
                <span>
                  <span className="loading-dots">Analyzing Resume</span>
                  <span className="loading-dots">.</span>
                  <span className="loading-dots">.</span>
                  <span className="loading-dots">.</span>
                </span>
              ) : 'Get ATS Score'}
            </button>
            <button 
              type="button" 
              onClick={handleDemoClick}
              className="demo-button"
              disabled={loading || showDemo}
            >
              Try Demo
            </button>
          </div>
        </form>

        {error && <div className="error-message">{error}</div>}
        
        {isAnalyzing && (
          <div className="analyzing-overlay">
            <div className="analyzing-content">
              <div className="analyzing-spinner"></div>
              <p>Analyzing your resume...</p>
            </div>
          </div>
        )}
        
        {(score !== null || showDemo) && (
          <div className="results-container">
            <div className="score">{score}%</div>
            <div className="score-label">ATS Compatibility Score</div>
            
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
            
            <div className="suggestions-section">
              <div className="suggestions-title">AI Suggestions to Improve Your Score:</div>
              <div className="suggestions-text">{suggestions}</div>
            </div>

            <div className="action-buttons">
              <button 
                className="action-button download-button"
                onClick={handleDownloadReport}
                disabled={!score && !showDemo}
              >
                Download Report
              </button>
              <button 
                className="action-button share-button"
                onClick={handleShareResults}
                disabled={!score && !showDemo}
              >
                Share Results
              </button>
            </div>
          </div>
        )}
      </header>
      
      <footer className="footer">
        <div className="footer-content">
          <p className="footer-text">
            Created with ❤️ by <strong>Siddhant</strong>
          </p>
          
          <div className="footer-links">
            <a href="#" className="footer-link">About</a>
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
            <a href="#" className="footer-link">Contact</a>
          </div>

          <div className="social-links">
            <a href="https://github.com/sidd20228" target="_blank" rel="noopener noreferrer" className="social-link">
              {React.createElement(FaGithub as React.ComponentType<IconBaseProps>, { size: 24 })}
            </a>
            <a href="https://linkedin.com/in/yourusername" target="_blank" rel="noopener noreferrer" className="social-link">
              {React.createElement(FaLinkedin as React.ComponentType<IconBaseProps>, { size: 24 })}
            </a>
            <a href="https://twitter.com/Siddhant11810" target="_blank" rel="noopener noreferrer" className="social-link">
              {React.createElement(FaTwitter as React.ComponentType<IconBaseProps>, { size: 24 })}
            </a>
          </div>

          <div className="footer-bottom">
            <p className="footer-bottom-text">
              © {new Date().getFullYear()} ATS Scorer. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
