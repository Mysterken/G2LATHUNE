const express = require('express');
const bcrypt = require('bcryptjs');
const { rate_limiter_all, rate_limiter_update, rate_limiter_login, rate_limiter_register } = require('../../rate_limiter');
const router = express.Router();
const jwt = require('jsonwebtoken');
const database = require("../../database");

const getUserByEmail = async (email) => {
    const sql = "SELECT * FROM User WHERE email = ?";
    const [result] = await database.raw(sql, [email]);
    return result.length ? result[0] : null;
};

const hashPassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

const validatePassword = (password) => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password);
};

router.post('/login', rate_limiter_login, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).send({ message: 'Email et password sont requise' });

        const user = await getUserByEmail(email);
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).send({ message: 'Invalide email ou password' });
        }

        const token = jwt.sign({ email }, "secret", { expiresIn: '1h' });
        res.send({ message: 'Login successful', user: { email: user.email }, accessToken: token });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).send({ message: 'Internal server error', error: error.message });
    }
});

router.delete('/logout', (req, res) => {
    res.send('Logout route');
});

router.post('/register', rate_limiter_register, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).send({ message: 'Email and password are required' });

        if (await getUserByEmail(email)) return res.status(409).send({ message: "User exists" });

        if (!validatePassword(password)) {
            return res.status(400).send({ message: 'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one special character.' });
        }

        const hashedPassword = await hashPassword(password);
        const sql = "INSERT INTO User (email, password) VALUES (?, ?)";
        await database.raw(sql, [email, hashedPassword]);

        res.status(201).send({ message: 'User registered successfully', email });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement :', error);
        res.status(500).send({ message: 'An error occurred while registering the user' });
    }
});

router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).send({ message: 'Refresh token is required.' });

        const user = await getUserByEmail(refreshToken);
        if (!user) return res.status(403).send({ message: 'Invalid refresh token.' });

        try {
            jwt.verify(refreshToken, "refresh_secret");
        } catch (error) {
            return res.status(403).send({ message: 'Invalid or expired refresh token.' });
        }

        const newAccessToken = jwt.sign({ email: user.email }, "access_secret", { expiresIn: '1h' });
        res.send({ message: 'Access token refreshed successfully.', accessToken: newAccessToken });
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).send({ message: 'Internal server error.' });
    }
});

router.post('/forgot-password', (req, res) => {
    res.send('Forgot password route');
});

router.post('/reset-password', async (req, res) => {
    try {
        const { password, token } = req.body;
        if (!password) return res.status(400).send({ message: 'Tous les champs sont requis.' });

        const user = await getUserByEmail(token);
        if (!user || !user.password_refresh_token) return res.status(400).send({ message: 'Mot de passe invalide.' });

        const hashedPassword = await hashPassword(password);
        const updateSql = "UPDATE User SET password = ?, password_refresh_token = NULL WHERE password_refresh_token = ?";
        await database.raw(updateSql, [hashedPassword, token]);

        res.send({ message: 'Mot de passe mis à jour avec succès.' });
    } catch (error) {
        console.error(error);
        res.send('Erreur lors de la réinitialisation du mot de passe');
    }
});

router.get('/verify-email', (req, res) => {
    res.send('Verify email route');
});

module.exports = router;