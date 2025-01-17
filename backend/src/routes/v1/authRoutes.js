const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const { rate_limiter_all, rate_limiter_update, rate_limiter_login, rate_limiter_register } = require('../../rate_limiter');
const router = express.Router();
const jwt = require('jsonwebtoken');
const database = require("../../database");
const crypto = require('crypto');

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

        // we hash the token to store it in the database
        const hashedToken = await bcrypt.hash(token, 10);
        const updateSql = "UPDATE User SET refresh_token = ? WHERE email = ?";
        await database.raw(updateSql, [hashedToken, email]);

        res.send({ message: 'Login successful', user: { email: user.email }, accessToken: token });
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
        if (!email || !password) return res.status(400).send({ message: 'Email and password are required' });

        if (await getUserByEmail(email)) return res.status(409).send({ message: "User exists" });

        if (!validatePassword(password)) {
            return res.status(400).send({ message: 'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one special character.' });
        }

        const hashedPassword = await hashPassword(password);

        // creer email_verification_token random avec lib crypto
        const token = crypto.randomBytes(64).toString('hex'); 
        // ajouter au sql


        const sql = "INSERT INTO User (email, password, email_verification_token) VALUES (?, ?, ?)";
        await database.raw(sql, [email, hashedPassword, token]);

        // console log localhost3000/verify-email?token=ehbfhejkqbfh
        console.log("http://localhost:3000/verify-email/" + token);
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

router.post("/forgot-password", async(req, res) => {
    const { email } = req.body;

    try {
        const [users] = await database.raw("SELECT * FROM User WHERE email = ?", [email]);
        if (!users || users.length === 0) {
            return res.status(200).json({ message: "Si cet email existe, un lien sera envoyé." });
        }
        const user = users[0];

        // Générer un token aléatoire
        const token = crypto.randomBytes(32).toString("hex");

        // Vérifiez les données avant la mise à jour
        if (!token || !user.Id) {
            console.error("Données manquantes :", { token, userId: user.Id });
            return res.status(500).json({ message: "Erreur interne : données manquantes pour la mise à jour." });
        }

        // Mettre à jour la base de données avec le token
        try {
            await database.raw(
                "UPDATE User SET password_refresh_token = ? WHERE Id = ?", [token, user.Id]
            );
        } catch (err) {
            console.error("Erreur lors de la mise à jour du token :", err);
            throw err;
        }

        // Construire et afficher le lien de réinitialisation
        const resetPasswordLink = `http://localhost:3000/reset-password/${token}`;
        console.log("Lien de réinitialisation :", resetPasswordLink);

        // Répondre au frontend
        res.json({
            message: "Si cet email existe, un lien de réinitialisation sera envoyé.",
        });
    } catch (error) {
        console.error("Erreur lors de la génération du lien de réinitialisation :", error);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
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

router.post('/verify-email', async (req, res) => {
    try {
        // Récupération du token depuis le body
        const rawToken = req.body;
        const token = rawToken.token;

        if (!token) {
            return res.status(400).send({ message: 'Token is required.' });
        }

        // Vérification si le token existe en base
        const checkSql = "SELECT * FROM User WHERE email_verification_token = ?";
        const result = await database.raw(checkSql, [token]);
        const user = result[0][0];
        if (!user) {
             res.status(401).send({ message: 'Invalid or expired token.' });
        } else {
        // Mise à jour pour invalider le token
        const updateSql = "UPDATE User SET email_verification_token = NULL WHERE Id = ?";
        await database.raw(updateSql, [user.Id]);
        // Réponse finale : confirmation
        res.send({ message: 'Email successfully verified.' });
        }

        const sql = "UPDATE User SET is_email_verified = '1' WHERE Id = ?";
        await database.raw(sql, [user.Id]);
        
    } catch (error) {
        console.error('Error verifying email:', error);
        return res.status(500).send({ message: 'Internal server error.' });
    }
});



module.exports = router;