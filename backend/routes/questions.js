import express from 'express';
import db from "../middleware/db.js";

const router = express.Router();

async function fetch_Question(questionId) {
    const query = 'SELECT * FROM questions WHERE quesid = $1';
    const { rows } = await db.query(query, [questionId]);
    return rows.length ? rows[0] : null;
}

router.get('/question', async (req, res) => {
    const id = req.query.id;
    try {
        if (!id) return res.status(400).json({ error: "Missing question id" });
        const response = await fetch_Question(id);
        if (!response) return res.status(404).json({ error: "Question not found" });
        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/input', async (req, res) => {
    const { question, category, testcases } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Question field is required.' });
    }
    try {
        const query = `
            INSERT INTO questions (question, category, testcases)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [question, category, testcases];

        const result = await db.query(query, values);

        console.log("Question data inserted:", result.rows[0]);

        res.status(201).json({
            message: "Question inserted successfully",
            question: result.rows[0],
        });
    } catch (err) {
        console.error("Error while inserting question:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
export default router;