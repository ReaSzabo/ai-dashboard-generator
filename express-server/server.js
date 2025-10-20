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

// Helper functions for dynamic date ranges
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function getLastWeekRange(today) {
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - today.getDay() - 7);
  const lastSaturday = new Date(lastSunday);
  lastSaturday.setDate(lastSunday.getDate() + 6);
  return `${formatDate(lastSunday)} és ${formatDate(lastSaturday)} között`;
}

function getLastYearRange(today) {
  const lastYear = today.getFullYear() - 1;
  return `${lastYear}-01-01 és ${lastYear}-12-31 között`;
}

function getCurrentYearRange(today) {
  const currentYear = today.getFullYear();
  return `${currentYear}-01-01 és ${currentYear}-12-31 között`;
}

function getLastMonthRange(today) {
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  return `${formatDate(lastMonth)} és ${formatDate(lastMonthEnd)} között`;
}

function getCurrentMonthRange(today) {
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return `${formatDate(currentMonthStart)} és ${formatDate(currentMonthEnd)} között`;
}

// Parse natural language query using OpenAI
async function parseNaturalLanguageQuery(userMessage) {
  try {
    // Get current date dynamically
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // OLD PROMPT VERSION (rule-based) - for comparison
    const oldPrompt = `
Mai dátum: ${todayString}

Elemezd az alábbi felhasználói kérést és határozd meg a következő paramétereket egy JSON objektumban:

- dataType: "registrations" vagy "logins" (a kérés alapján döntsd el, hogy regisztrációkra vagy bejelentkezésekre kíváncsi)
- startDate: YYYY-MM-DD formátumban (ha nem adott meg, használj 2024-01-01-et)
- endDate: YYYY-MM-DD formátumban (ha nem adott meg, használj 2025-12-31-et)
- registrationType: "facebook", "gmail", "email" vagy null (ha mindegyikre kíváncsi)
- chartType: "line", "bar" vagy "pie" (diagram típus meghatározása)
- aggregationType: "breakdown" vagy "total" (adatok megjelenítési módja)

Elérhető adatok: 2024-01-01 és 2025-12-31 között vannak regisztrációs és bejelentkezési adatok.
Típusok: facebook, gmail, email

Relatív dátumok kezelése (mai dátum: ${todayString}):
- "múlt héten" → ${getLastWeekRange(today)}
- "tavaly" → ${getLastYearRange(today)}
- "ez év" vagy "idén" → ${getCurrentYearRange(today)}
- "múlt hónap" → ${getLastMonthRange(today)}
- "ez a hónap" → ${getCurrentMonthRange(today)}

FONTOS szabályok dataType meghatározásához:
- Ha a szövegben "login", "bejelentkezés", "belépés", "bejel", "session", "signin", "sign in", "log in", "log-in" szerepel → dataType: "logins"
- Ha a szövegben "regisztráció", "reg", "új felhasználó", "új user", "signup", "sign up" szerepel → dataType: "registrations"
- Ha nem egyértelmű, akkor "registrations"

FONTOS szabályok chartType meghatározásához:
- Ha a szöveg időbeli trendet, változást, idősorozatot kér ("időben", "trend", "változás", "hogyan alakult", "fejlődés", "időszak") → chartType: "line"
- Ha összehasonlítást, kategóriákat kér ("összehasonlítás", "melyik a legjobb", "rangsor", "összeg", "kategóriánként") → chartType: "bar"  
- Ha arányokat, részesedést kér ("arány", "százalék", "részesedés", "milyen része", "kör", "pie") → chartType: "pie"
- Ha nem egyértelmű vagy általános kérés, akkor "line"

FONTOS szabályok aggregationType meghatározásához:
- Ha külön vonalakat/oszlopokat kér típusonként ("külön", "facebook és gmail", "típusonként", "lebontva", "egyenként", "mindegyik külön", "összehasonlítás") → aggregationType: "breakdown"
- Ha összesített adatot kér ("összesen", "összes", "teljes", "mindent együtt", "összesítve", "total") → aggregationType: "total"
- Ha nem egyértelmű, akkor "total"

Felhasználói kérés: "${userMessage}"

Válaszolj csak egy tiszta JSON objektummal, magyarázat nélkül:
`;
    
    // NEW PROMPT VERSION (few-shot learning) - currently active
    const prompt = `
Mai dátum: ${todayString}

Elemezd az alábbi felhasználói kérést és határozd meg a következő paramétereket egy JSON objektumban:

- dataType: "registrations" vagy "logins"
- startDate: YYYY-MM-DD formátumban
- endDate: YYYY-MM-DD formátumban
- registrationType: "facebook", "gmail", "email" vagy null
- chartType: "line", "bar" vagy "pie"
- aggregationType: "breakdown" vagy "total"

Elérhető adatok: 2024-01-01 és 2025-12-31 között vannak regisztrációs és bejelentkezési adatok.
Típusok: facebook, gmail, email

Relatív dátumok (mai dátum: ${todayString}):
- "múlt héten" → ${getLastWeekRange(today)}
- "tavaly" → ${getLastYearRange(today)}
- "ez év/idén" → ${getCurrentYearRange(today)}
- "múlt hónap" → ${getLastMonthRange(today)}
- "ez a hónap" → ${getCurrentMonthRange(today)}

PÉLDÁK (few-shot learning):

Példa 1:
Kérés: "Mutasd meg a regisztrációkat lebontva típusonként január első hetében!"
Válasz:
{
  "dataType": "registrations",
  "startDate": "2024-01-01",
  "endDate": "2024-01-07",
  "registrationType": null,
  "chartType": "line",
  "aggregationType": "breakdown"
}

Példa 2:
Kérés: "Hány bejelentkezés volt összesen tavaly?"
Válasz:
{
  "dataType": "logins",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "registrationType": null,
  "chartType": "bar",
  "aggregationType": "total"
}

Példa 3:
Kérés: "Facebook regisztrációk aránya februárban"
Válasz:
{
  "dataType": "registrations",
  "startDate": "2024-02-01",
  "endDate": "2024-02-29",
  "registrationType": "facebook",
  "chartType": "pie",
  "aggregationType": "total"
}

Példa 4:
Kérés: "Hasonlítsd össze a gmail és facebook bejelentkezéseket múlt hónapban"
Válasz:
{
  "dataType": "logins",
  "startDate": "${getLastMonthRange(today).split(' és ')[0]}",
  "endDate": "${getLastMonthRange(today).split(' és ')[1].replace(' között', '')}",
  "registrationType": null,
  "chartType": "bar",
  "aggregationType": "breakdown"
}

Példa 5:
Kérés: "Hogyan alakult az email regisztrációk száma idén?"
Válasz:
{
  "dataType": "registrations",
  "startDate": "${getCurrentYearRange(today).split(' és ')[0]}",
  "endDate": "${getCurrentYearRange(today).split(' és ')[1].replace(' között', '')}",
  "registrationType": "email",
  "chartType": "line",
  "aggregationType": "total"
}

Most elemezd ezt a kérést:
"${userMessage}"

Válaszolj csak egy tiszta JSON objektummal, magyarázat nélkül:
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "system",
          content: "Te egy precíz adatelemző asszisztens vagy. Csak JSON formátumban válaszolsz."
        },
        {
          role: "user",
          content: oldPrompt
        }
      ],
    });
    console.log(oldPrompt)
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
      startDate: parsedParams.startDate || '2024-01-01',
      endDate: parsedParams.endDate || '2025-12-31',
      registrationType: parsedParams.registrationType || null,
      chartType: parsedParams.chartType || 'line',
      aggregationType: parsedParams.aggregationType || 'total'
    };
    
  } catch (error) {
    console.error('Error parsing natural language query:', error);
    // Return default parameters in case of error
    return {
      dataType: 'registrations',
      startDate: '2024-01-01',
      endDate: '2025-12-31',
      registrationType: null,
      chartType: 'line',
      aggregationType: 'total'
    };
  }
}

// POST endpoint for /api/generate-chart - natural language query endpoint
app.post('/api/generate-chart', async (req, res) => {
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
        chartType: parsedParams.chartType,
        aggregationType: parsedParams.aggregationType,
        dateRange: { startDate: parsedParams.startDate, endDate: parsedParams.endDate },
        originalQuery: query
      });
    } else {
      // Return all registration types
      console.log(`Returning ${filteredData.length} records for all registration types`);
      return res.json({ 
        [dataKey]: filteredData,
        type: 'all',
        dataType: parsedParams.dataType,
        chartType: parsedParams.chartType,
        aggregationType: parsedParams.aggregationType,
        dateRange: { startDate: parsedParams.startDate, endDate: parsedParams.endDate },
        originalQuery: query
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