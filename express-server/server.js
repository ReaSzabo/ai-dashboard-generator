require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const PORT = 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:4200', // Angular development server default port
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Load registration data
const loadRegistrationData = () => {
  try {
    const dataPath = path.join(__dirname, 'data', 'registrations.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading registration data:', error);
    return { registrations: [] };
  }
};

// Load login data
const loadLoginData = () => {
  try {
    const dataPath = path.join(__dirname, 'data', 'logins.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading login data:', error);
    return { logins: [] };
  }
};

// Parse natural language query using OpenAI
async function parseNaturalLanguageQuery(userMessage) {
  try {
    const prompt = `
Elemezd az alábbi felhasználói kérést és határozd meg a következő paramétereket egy JSON objektumban:

- dataType: "registrations" vagy "logins" (a kérés alapján döntsd el, hogy regisztrációkra vagy bejelentkezésekre kíváncsi)
- startDate: YYYY-MM-DD formátumban (ha nem adott meg, használj 2025-01-01-et)
- endDate: YYYY-MM-DD formátumban (ha nem adott meg, használj 2025-03-10-et)
- registrationType: "facebook", "gmail", "email" vagy null (ha mindegyikre kíváncsi)

Elérhető adatok: 2025-01-01 és 2025-03-10 között vannak regisztrációs és bejelentkezési adatok.
Típusok: facebook, gmail, email

FONTOS szabályok dataType meghatározásához:
- Ha a szövegben "login", "bejelentkezés", "belépés", "bejel", "session", "signin", "sign in", "log in", "log-in" szerepel → dataType: "logins"
- Ha a szövegben "regisztráció", "reg", "új felhasználó", "új user", "signup", "sign up" szerepel → dataType: "registrations"
- Ha nem egyértelmű, akkor "registrations"

Felhasználói kérés: "${userMessage}"

Válaszolj csak egy tiszta JSON objektummal, magyarázat nélkül:
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Te egy precíz adatelemző asszisztens vagy. Csak JSON formátumban válaszolsz."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.1
    });

    const responseText = completion.choices[0].message.content.trim();
    console.log('OpenAI response:', responseText);
    
    // Clean the response by removing markdown code blocks
    const cleanedResponse = responseText
      .replace(/```json\s*\n?/g, '')
      .replace(/```\s*$/g, '')
      .trim();
    console.log('Cleaned response:', cleanedResponse);
    
    // Parse JSON response
    const parsedParams = JSON.parse(cleanedResponse);
    
    // Validate and set defaults
    return {
      dataType: parsedParams.dataType || 'registrations',
      startDate: parsedParams.startDate || '2025-01-01',
      endDate: parsedParams.endDate || '2025-03-10',
      registrationType: parsedParams.registrationType || null
    };
    
  } catch (error) {
    console.error('Error parsing natural language query:', error);
    // Return default parameters in case of error
    return {
      dataType: 'registrations',
      startDate: '2025-01-01',
      endDate: '2025-03-10',
      registrationType: null
    };
  }
}

// POST endpoint for /getData - natural language query endpoint
app.post('/getData', async (req, res) => {
  const { query } = req.body;
  
  // Validate input
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ 
      error: 'Please provide a query parameter in the request body',
      example: { query: "Hány regisztráció volt facebook-on január első hetében?" }
    });
  }
  
  try {
    console.log(`Processing natural language query: "${query}"`);
    
    // Parse the natural language query using OpenAI
    const parsedParams = await parseNaturalLanguageQuery(query);
    console.log('Parsed parameters:', parsedParams);
    
    // Load data based on dataType
    let data, dataArray, dataKey;
    if (parsedParams.dataType === 'logins') {
      data = loadLoginData();
      dataArray = data.logins;
      dataKey = 'logins';
    } else {
      data = loadRegistrationData();
      dataArray = data.registrations;
      dataKey = 'registrations';
    }
    
    let filteredData = dataArray;
    
    // Filter by date range
    if (parsedParams.startDate) {
      filteredData = filteredData.filter(record => record.date >= parsedParams.startDate);
      console.log(`Filtered by startDate: ${parsedParams.startDate}, remaining: ${filteredData.length} records`);
    }
    
    if (parsedParams.endDate) {
      filteredData = filteredData.filter(record => record.date <= parsedParams.endDate);
      console.log(`Filtered by endDate: ${parsedParams.endDate}, remaining: ${filteredData.length} records`);
    }
    
    // Filter by registration type
    if (parsedParams.registrationType) {
      // Return only specific registration type data
      const typeFilteredData = filteredData.map(record => ({
        date: record.date,
        [parsedParams.registrationType]: record[parsedParams.registrationType] || 0
      }));
      console.log(`Returning ${typeFilteredData.length} records for registration type: ${parsedParams.registrationType}`);
      return res.json({ 
        [dataKey]: typeFilteredData,
        type: parsedParams.registrationType,
        dataType: parsedParams.dataType,
        dateRange: { startDate: parsedParams.startDate, endDate: parsedParams.endDate },
        originalQuery: query,
        parsedParams: parsedParams
      });
    } else {
      // Return all registration types
      console.log(`Returning ${filteredData.length} records for all registration types`);
      return res.json({ 
        [dataKey]: filteredData,
        type: 'all',
        dataType: parsedParams.dataType,
        dateRange: { startDate: parsedParams.startDate, endDate: parsedParams.endDate },
        originalQuery: query,
        parsedParams: parsedParams
      });
    }
    
  } catch (error) {
    console.error('Error processing natural language query:', error);
    return res.status(500).json({ 
      error: 'Failed to process natural language query',
      originalQuery: query
    });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Express.js server is running on http://localhost:${PORT}`);
});