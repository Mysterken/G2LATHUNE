const express = require('express');
const { rate_limiter_all, rate_limiter_update, rate_limiter_login, rate_limiter_register } = require('../../rate_limiter');
const router = express.Router();

router.get('/login', rate_limiter_login, (req, res) => {
    res.send('Login route');
});

router.get('/logout', (req, res) => {
    res.send('Logout route');
});

router.post('/register', rate_limiter_register, (req, res) => {
    res.send('Register route');
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