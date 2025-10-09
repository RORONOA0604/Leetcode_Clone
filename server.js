// server.js
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js'); // ✨ Import Supabase client

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
// Assuming you have a 'public' folder for your frontend files
app.use(express.static('public'));

// --- INITIALIZATION ---

// Google AI Gemini (Unchanged)
// Note: "gemini-2.0-flash" is not a standard model name. You may want to use "gemini-1.5-flash".
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ✨ Supabase Client Initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


// --- ROUTES ---

// Route 1: Evaluate single question (Unchanged)
app.post('/evaluate', async (req, res) => {
    const { code, question } = req.body;

    const prompt = `
You are a strict Java DSA code judge.
The problem is: "${question}".
Student submitted this Java code:
\`\`\`java
${code}
\`\`\`

Respond ONLY in this exact JSON format and nothing else:
{"status": "Correct"} 
OR 
{"status": "Incorrect"}
    `;

    try {
        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        responseText = responseText.replace(/```json|```/g, '').trim();

        let feedbackJson;
        try {
            feedbackJson = JSON.parse(responseText);
        } catch (err) {
            console.error("Parsing failed:", responseText);
            return res.status(500).json({ status: "Error", feedback: "Invalid evaluation format." });
        }

        feedbackJson.marks = feedbackJson.status === "Correct" ? 20 : 0;
        res.json(feedbackJson);
    } catch (error) {
        console.error("Error evaluating code:", error);
        res.status(500).json({ status: "Error", feedback: "Evaluation failed." });
    }
});

// ✨ Route 2: Final submission (Refactored for Supabase)
app.post('/submit-test', async (req, res) => {
    // We now expect 'usn' instead of 'mobile' as requested
    const { name, email, usn, marks } = req.body;

    // Insert the new submission into the 'submissions' table in Supabase
    const { data, error } = await supabase
        .from('submissions')
        .insert([
            { name, email, usn, marks }
        ]);

    // Handle any potential errors from Supabase
    if (error) {
        console.error("Error writing to Supabase:", error.message);
        return res.status(500).json({ message: "Error saving submission." });
    }

    // Send a success response
    res.status(200).json({ message: "Test submitted successfully!" });
});


// --- SERVER START ---
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
