import express from 'express';
import db from '../db.js';
import adduser from '../insertdata.js';
const router = express.Router();

router.post('/register', async (req, res) => {
    const { username, user_email, password } = req.body;

    try {
        const checkUser = await db.query(
            "SELECT * FROM users WHERE username = $1 OR user_email = $2",
            [username, user_email]
        );

        if (checkUser.rows.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Insert user
        const newUser = await addUserData(username, user_email, password);
        res.status(201).json({ message: "User registered", user: newUser });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const userQuery = await db.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );

        if (userQuery.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = userQuery.rows[0];

        if (user.password === password) {
            res.status(200).json({ message: "Login successful", user });
        } else {
            res.status(401).json({ message: "Incorrect password" });
        }

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;