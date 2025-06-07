import express from 'express';
import db from "./db.js";

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

export default router;