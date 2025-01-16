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

router.post('/register', rate_limiter_register, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send({ message: 'Email and password are required' });
        }
        const checkSql = "Select * from User where email = ?";
        const userExists = await database.raw(checkSql, [email]);

        if (userExists[0].length > 0) {
            return res.status(409).send({ message: "User exists" }); 
        }

        if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) ||!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return res.status(400).send({ 
                message: 'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one special character.' 
            });
        }
        // Hash pour le mot de passe
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const sql = "INSERT INTO User (email, password) VALUES (?, ?)";
        await database.raw(sql, [email, hashedPassword]);

        return res.status(201).send({ message: 'User registered successfully', email });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement :', error);
        return res.status(500).send({ message: 'An error occurred while registering the user' });
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
        const { password, token } = req.body;

        const tokenSql = "Select * from User where password_refresh_token = ?";
        const userToken = database.raw(tokenSql, [token]);

        if (!password) {
            return res.status(400).send({ message: 'Tous les champs sont requis.' });
        }

        if (!userToken) {
            return res.status(400).send({ message: 'Mot de passe invalide.' });
        }
        const user = userToken[0];
        if (!user?.password_refresh_token) {
            res.status(401).send({message: 'Pas de token dans la base de données'})
        }
        const updateSql = "UPDATE User SET password = ? WHERE password_refresh_token = ?";
        await database.raw(updateSql, [password, token]);

        const deleteSql = "UPDATE User SET password_refresh_token = NULL WHERE password_refresh_token = ?";
        await database.raw(deleteSql, [token]);

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