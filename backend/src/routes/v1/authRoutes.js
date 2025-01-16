const crypto = require('crypto');
const nodemailer = require('nodemailer');
const express = require('express');
const bcrypt = require('bcryptjs');
const { rate_limiter_all, rate_limiter_update, rate_limiter_login, rate_limiter_register } = require('../../rate_limiter');
const router = express.Router();

const database = require("../../database");

/*router.post('/login', rate_limiter_login, async(req, res) => {
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
});*/
router.post('/login', rate_limiter_login, async(req, res) => {
    try {
        const { email, password } = req.body;

        // Vérification des champs
        if (!email || !password) {
            return res.status(400).send({ message: 'Email et mot de passe sont requis' });
        }

        // Rechercher l'utilisateur dans la base
        const sql = "SELECT * FROM User WHERE email = ?";
        const [result] = await database.raw(sql, [email]); // Récupérer l'utilisateur par email

        if (!result || result.length === 0) {
            return res.status(401).send({ message: 'Email ou mot de passe invalide' });
        }

        const user = result[0]; // Utilisateur trouvé

        // Vérifier si l'email est confirmé
        if (!user.email_verified) {
            return res.status(403).send({ message: 'Veuillez confirmer votre email avant de vous connecter' });
        }

        // Récupérer le mot de passe haché de la base
        const hashedPassword = user.password;

        // Comparer le mot de passe fourni avec le hash enregistré
        const isMatch = await bcrypt.compare(password, hashedPassword);

        if (!isMatch) {
            return res.status(401).send({ message: 'Email ou mot de passe invalide' });
        }

        // Authentification réussie
        res.send({
            message: 'Connexion réussie',
            user: { email: user.email }
        });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).send({ message: 'Erreur interne au serveur', error: error.message });
    }
});



router.delete('/logout', (req, res) => {
    res.send('Logout route');
});

/*router.post('/register', rate_limiter_register, async (req, res) => {
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
});*/

router.post('/register', rate_limiter_register, async(req, res) => {
    const trx = await database.transaction(); // Démarre une transaction

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send({ message: 'Email et password sont requis' });
        }

        // Vérifier si l'utilisateur existe déjà
        const userExists = await trx.raw("SELECT * FROM User WHERE email = ?", [email]);
        if (userExists[0].length > 0) {
            await trx.rollback(); // Annule la transaction
            return res.status(409).send({ message: "Cet utilisateur existe déjà" });
        }

        // Vérifier les critères du mot de passe
        if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            await trx.rollback(); // Annule la transaction
            return res.status(400).send({
                message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'
            });
        }

        // Hasher le mot de passe
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Générer un token de vérification
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Ajouter l'utilisateur à la base de données
        const sql = "INSERT INTO User (email, password, verification_token, email_verified) VALUES (?, ?, ?, ?)";
        await trx.raw(sql, [email, hashedPassword, verificationToken, false]);

        // Envoyer un email de vérification
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Utilisez les variables d'environnement
                pass: process.env.EMAIL_PASS
            }
        });

        const verificationLink = `http://localhost:3000/verify?token=${verificationToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Veuillez vérifier votre adresse email',
            html: `<p>Cliquez sur le lien suivant pour vérifier votre email : <a href="${verificationLink}">Vérifier mon email</a></p>`
        };

        await transporter.sendMail(mailOptions); // Envoie l'email

        await trx.commit(); // Confirme la transaction
        return res.status(201).send({ message: 'Un email de vérification a été envoyé à votre adresse.' });

    } catch (error) {
        await trx.rollback(); // Annule la transaction en cas d'erreur
        console.error('Erreur lors de l\'inscription :', error);
        return res.status(500).send({ message: 'Une erreur est survenue lors de l\'inscription', error: error.message });
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

/*router.get('/verify-email', (req, res) => {
    res.send('Verify email route');
});*/
router.get('/verify-email', async(req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).send({ message: 'Token is required' });
        }

        // Rechercher l'utilisateur par token
        const sql = "SELECT * FROM User WHERE verification_token = ?";
        const [result] = await database.raw(sql, [token]);

        if (!result || result.length === 0) {
            return res.status(400).send({ message: 'Invalid or expired token' });
        }

        const user = result[0];

        // Mettre à jour l'utilisateur : email vérifié et supprimer le token
        const updateSql = "UPDATE User SET email_verified = TRUE, verification_token = NULL WHERE id = ?";
        await database.raw(updateSql, [user.id]);

        return res.send({ message: 'Email successfully verified. You can now log in.' });
    } catch (error) {
        console.error('Error during email verification:', error);
        return res.status(500).send({ message: 'An error occurred during email verification' });
    }
});


module.exports = router;