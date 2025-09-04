// server.js
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const submissionsFilePath = path.join(__dirname, 'submissions.json');

// Route 1: Evaluate single question
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

        // Clean output
        responseText = responseText.replace(/```json|```/g, '').trim();

        let feedbackJson;
        try {
            feedbackJson = JSON.parse(responseText);
        } catch (err) {
            console.error("Parsing failed:", responseText);
            return res.status(500).json({ status: "Error", feedback: "Invalid evaluation format." });
        }

        // Attach marks (1 or 0)
        feedbackJson.marks = feedbackJson.status === "Correct" ? 20 : 0;

        res.json(feedbackJson);
    } catch (error) {
        console.error("Error evaluating code:", error);
        res.status(500).json({ status: "Error", feedback: "Evaluation failed." });
    }
});

// Route 2: Final submission (async write)
app.post('/submit-test', (req, res) => {
    const { name, email, mobile, marks } = req.body;
    const submission = { name, email, mobile, marks };

    let submissions = [];
    if (fs.existsSync(submissionsFilePath)) {
        try {
            submissions = JSON.parse(fs.readFileSync(submissionsFilePath));
        } catch (err) {
            console.error("Error parsing submissions file:", err);
            submissions = [];
        }
    }

    submissions.push(submission);

    // Write async (non-blocking)
    fs.writeFile(submissionsFilePath, JSON.stringify(submissions, null, 2), (err) => {
        if (err) {
            console.error("Error writing submissions:", err);
            return res.status(500).json({ message: "Error saving submission." });
        }
        res.json({ message: "Test submitted successfully!" });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
