const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { CohereClient } = require("cohere-ai");

const app = express();
// Use uploads directory at the project root
const upload = multer({ dest: path.join(__dirname, '../uploads') });
const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

// Configure CORS for all origins
app.use(cors({
  origin: ['https://aiatsscorer.netlify.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Helper: Get job requirements using Cohere
async function getJobRequirements(jobRole) {
  const requirementsPrompt = `As an ATS expert, analyze the job role of "${jobRole}" and provide the 8 most essential requirements in these categories:
1. Technical Skills (hard skills specific to the role)
2. Experience (years and type of experience needed)
3. Education (required degrees or certifications)
4. Soft Skills (critical interpersonal abilities)

Format each requirement as a clear, specific phrase. Separate requirements with commas. Be precise and industry-specific.
For example, for a Software Engineer:
- "5+ years Java development experience"
- "Bachelor's in Computer Science"
- "Spring Boot microservices expertise"`;
  
  const response = await cohere.generate({
    model: 'command',
    prompt: requirementsPrompt,
    max_tokens: 250,
    temperature: 0.2 // Lower temperature for more focused results
  });

  if (response.generations && response.generations[0].text) {
    // Clean and normalize requirements
    const requirements = response.generations[0].text
      .replace(/^\d+\.\s+/gm, '') // Remove numbering
      .replace(/^[-•]/gm, '') // Remove bullet points
      .split(/,|\n/) // Split by comma or newline
      .map(req => req.trim())
      .filter(req => req.length > 0 && !req.toLowerCase().includes('example'))
      .slice(0, 8); // Limit to top 8 requirements
    return requirements;
  }
  return [];
}

// Helper: Analyze resume match using Cohere
async function analyzeResumeMatch(resumeText, requirement) {
  const matchPrompt = `Act as an expert ATS system analyzing a resume against a specific job requirement.

Requirement: "${requirement}"

Resume text:
${resumeText}

Task: Analyze how well this resume demonstrates the requirement. Consider:
1. Explicit mentions of the exact requirement
2. Related skills or experience that fulfill the requirement
3. Quantifiable achievements related to the requirement
4. Length and recency of relevant experience
5. Industry-specific terminology and context

Provide a score between 0 and 1 where:
0.0-0.2: No relevant match
0.3-0.4: Minimal/indirect match
0.5-0.6: Partial match
0.7-0.8: Good match
0.9-1.0: Excellent match

Output only the numerical score.`;
  
  const response = await cohere.generate({
    model: 'command',
    prompt: matchPrompt,
    max_tokens: 10,
    temperature: 0.1 // Keep temperature low for consistent scoring
  });

  if (response.generations && response.generations[0].text) {
    // Extract and validate the score
    const text = response.generations[0].text.trim();
    const score = parseFloat(text.match(/0\.\d+|[01]/)?.[0] || '0');
    return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1);
  }
  return 0;
}

// Helper: Calculate comprehensive ATS score
async function scoreResume(resumeText, jobRole) {
  try {
    // Get job requirements
    const requirements = await getJobRequirements(jobRole);
    if (!requirements.length) return { score: 0, matches: [] };

    // Analyze each requirement
    const matches = [];
    for (const req of requirements) {
      const matchScore = await analyzeResumeMatch(resumeText, req);
      matches.push({ requirement: req, score: matchScore });
    }

    // Calculate weighted score
    const totalScore = matches.reduce((sum, match) => sum + match.score, 0);
    const averageScore = (totalScore / requirements.length) * 100;

    return {
      score: Math.round(averageScore),
      matches: matches
    };
  } catch (error) {
    console.error('Error in comprehensive scoring:', error);
    return { score: 0, matches: [] };
  }
}

// POST /score
app.post('/score', upload.single('resume'), async (req, res) => {
  try {
    const jobRole = req.body.jobRole;
    if (!req.file || !jobRole) {
      return res.status(400).json({ error: 'Resume file and job role are required.' });
    }
    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const resumeText = pdfData.text;
    
    // Get comprehensive score with requirement matches
    const { score: atsScore, matches } = await scoreResume(resumeText, jobRole);    // Generate targeted suggestions based on requirement matches
    const lowScoringRequirements = matches
      .filter(match => match.score < 0.6)
      .sort((a, b) => a.score - b.score) // Sort by score ascending
      .map(match => ({ requirement: match.requirement, score: match.score }));

    let aiSuggestions = 'AI suggestions unavailable.';
    if (lowScoringRequirements.length > 0) {
      const aiPrompt = `Act as an expert ATS resume consultant. Analyze the following gaps in the candidate's resume for a ${jobRole} position:

${lowScoringRequirements.map((req, i) => 
  `${i + 1}. ${req.requirement} (Current Match: ${Math.round(req.score * 100)}%)`
).join('\n')}

Provide 3-4 specific, actionable suggestions to improve the resume's ATS score. Focus on:
1. Adding missing keywords and skills
2. Reformatting existing content
3. Quantifying achievements
4. Industry-specific improvements

Format as a clear, numbered list. Be specific and practical.`;
      
      try {
        const cohereRes = await cohere.generate({
          model: 'command',
          prompt: aiPrompt,
          max_tokens: 250,
          temperature: 0.7
        });
        if (cohereRes.generations && cohereRes.generations[0].text) {
          aiSuggestions = cohereRes.generations[0].text;
        }
      } catch (e) {
        console.error('Cohere error:', e);
      }
    }    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({ 
      atsScore, 
      aiSuggestions,
      requirementMatches: matches.map(match => ({
        requirement: match.requirement,
        score: Math.round(match.score * 100)
      }))
    });
  } catch (err) {
    console.error('Resume processing error:', err);
    res.status(500).json({ error: 'Failed to process resume.' });
  }
});

// Endpoint to get job role suggestions from Cohere
app.post('/job-role-suggestions', async (req, res) => {
  try {
    const { query } = req.body;
    console.log('Job role suggestion query:', query);
    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }
    const aiPrompt = `List 10 common job roles that start with or contain the phrase: "${query}". Return only a comma-separated list of job titles.`;
    let suggestions = [];
    try {
      const cohereRes = await cohere.generate({
        model: 'command',
        prompt: aiPrompt,
        max_tokens: 60,
        temperature: 0.5
      });
      console.log('Cohere response:', cohereRes);
      // Use correct property: cohereRes.generations[0].text
      if (cohereRes.generations && cohereRes.generations[0].text) {
        let raw = cohereRes.generations[0].text;
        // Remove introductory/trailing text
        raw = raw.replace(/^(Here (are|is)[^:]*:|List of roles:|Possible roles:|Certainly!|Sure,?)/i, '');
        // Replace newlines, semicolons, ' and ', and numbers with commas
        raw = raw.replace(/\n|;|\band\b|\d+\.|\d+\)/gi, ',');
        // Remove any double commas
        raw = raw.replace(/,+/g, ',');
        // Split and clean
        suggestions = raw.split(',')
          .map(s => s.replace(/[^a-zA-Z0-9 \-\.]/g, '').replace(/\.$/, '').trim())
          .filter(s => s.length > 2 && !s.toLowerCase().includes('sure') && !s.toLowerCase().includes('list of') && !s.toLowerCase().startsWith('here'));
      }
    } catch (e) {
      console.error('Cohere job role suggestion error:', e);
    }
    console.log('Suggestions returned:', suggestions);
    res.json({ suggestions });
  } catch (err) {
    console.error('Job role suggestion endpoint error:', err);
    res.status(500).json({ suggestions: [] });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
