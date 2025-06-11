import express from 'express';
import db from "./db.js";

const router = express.Router();

async function fetch_testcases(questionId) {
    const query = 'SELECT testcases FROM questions WHERE quesid = $1';
    const { rows } = await db.query(query, [questionId]);
    return rows.length ? rows[0].testcases : null;
}

function getDockerCommand(language, codeFilePath, inputFilePath) {
    // yet to implement
}

async function runCodeInDocker({ language, solution, testcaseInput }) {
    // yet to implement
}

router.post('/run', async (req, res) => {
    const { userId, questionId, language, solution, testcases } = req.body;
    try {
        const result = await runCodeInDocker({
            language,
            solution,
            testcaseInput: testcases && testcases.length ? testcases[0].input : ''
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit solution, fetch all testcases, run and return results
router.post('/submit', async (req, res) => {
    const { userId, questionId, language, solution } = req.body;
    try {
        const testcasesJson = await fetch_testcases(questionId);
        if (!testcasesJson) return res.status(404).json({ error: 'Question not found' });

        let testcases;
        try {
            testcases = typeof testcasesJson === 'string' ? JSON.parse(testcasesJson) : testcasesJson;
        } catch {
            return res.status(500).json({ error: 'Testcases format invalid' });
        }
        // we need to keep track of at which testcases we have failed 
        const results = [];
        for (const tc of testcases) {
            const result = await runCodeInDocker({
                language,
                solution,
                testcaseInput: tc.input
            });
            result.expected_output = tc.expected_output;
            results.push(result);
        }
        res.json({ results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;