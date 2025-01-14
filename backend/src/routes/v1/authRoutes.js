const express = require('express');
const bcrypt = require('bcrypt');
const { rate_limiter_all, rate_limiter_update, rate_limiter_login, rate_limiter_register } = require('../../rate_limiter');
const router = express.Router();

const database = require("../../database");

router.get('/login', rate_limiter_login, (req, res) => {
    res.send('Login route');
});

router.get('/logout', (req, res) => {
    res.send('Logout route');
});

router.post('/register', rate_limiter_register, async(req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send({ message: 'Email and password are required' });
        }
        // hash  pour le mot de passe
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log(hashedPassword)

        const sql = "INSERT INTO User (email, password) VALUES (?, ?)";
        await database.raw(sql, [email, hashedPassword]);

        res.status(201).send({ message: 'User registered successfully', email });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'An error occurred while registering the user' });
    }
});

router.post('/refresh', (req, res) => {
    res.send('Refresh route');
});

router.post('/forgot-password', (req, res) => {
    res.send('Forgot password route');
});

router.post('/reset-password', (req, res) => {
    res.send('Reset password route');
});

router.get('/verify-email', (req, res) => {
    res.send('Verify email route');
});

module.exports = router;