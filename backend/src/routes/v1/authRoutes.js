const express = require('express');
const bcrypt = require('bcryptjs');
const { rate_limiter_all, rate_limiter_update, rate_limiter_login, rate_limiter_register } = require('../../rate_limiter');
const router = express.Router();

const database = require("../../database");

router.post('/login', rate_limiter_login, async(req, res) => {
    try {
        const { email, password } = req.body;

        // Vérification des champs
        if (!email || !password) {
            return res.status(400).send({ message: 'Email et password sont requise' });
        }

        // Rechercher l'utilisateur dans la base
        const sql = "SELECT * FROM User WHERE email = ?";
        const [result] = await database.raw(sql, [email]); // Récupérer l'utilisateur par email

        if (!result || result.length === 0) {
            return res.status(401).send({ message: 'Invalide email ou password' });
        }

        const user = result[0]; // Utilisateur trouvé
        const hashedPassword = user.password; // Récupérer le hash enregistré

        // Comparer le mot de passe en clair avec le hash
        const isMatch = await bcrypt.compare(password, hashedPassword);

        if (!isMatch) {
            return res.status(401).send({ message: 'Invalide email ou password' });
        }

        // Authentification réussie
        res.send({
            message: 'Login successful',
            user: { email: user.email }
        });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).send({ message: 'Internal server error', error: error.message });
    }
});


router.delete('/logout', (req, res) => {
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

        const sql = "INSERT INTO User (email, password) VALUES (?, ?)";
        await database.raw(sql, [email, hashedPassword]);

        res.status(201).send({ message: 'User registered successfully', email });
    } catch (error) {
        res.status(500).send({ message: 'An error occurred while registering the user' });
    }
});

router.post('/refresh', (req, res) => {
    res.status(401).send({ message: 'Unauthorized' });
});

router.post('/forgot-password', (req, res) => {
    res.send('Forgot password route');
});

router.post('/reset-password', async(req, res) => {
    try {
        const { email, password, newPassword } = req.body;

        if (!email || !password || !newPassword) {
            return res.status(400).send({ message: 'Tous les champs (email, password, newPassword) sont requis.' });
        }

        const sql = "Select * from User where email = ? and password = ?";
        const result = await database.raw(sql, [email, password]);

        if (!result || result[0].length === 0) {
            return res.status(400).send({ message: 'Email ou mot de passe invalide.' });
        }

        if (newPassword.length === 0) {
            return res.status(400).send({ message: 'Le nouveau mot de passe ne peut pas être vide.' });
        }

        const updateSql = "UPDATE User SET password = ? WHERE email = ?";
        await database.raw(updateSql, [newPassword, email]);

        res.send({ message: 'Mot de passe mis à jour avec succès.' });
    } catch (error) {
        res.send('Erreur lors de la réinitialisation du mot de passe :', error);
    }
});

router.get('/verify-email', (req, res) => {
    res.send('Verify email route');
});

module.exports = router;