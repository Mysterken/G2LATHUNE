// simple node web server that displays hello world
// optimized for Docker image

const express = require("express");
const morgan = require("morgan"); 
const bodyParser = require('body-parser');
const cors = require('cors');
const database = require("./database");
const { rate_limiter_all } = require("./rate_limiter");

// Import des routes
const authRoutesv1 = require('./routes/v1/authRoutes');
const ethRoutesv1 = require('./routes/v1/ethRoutes'); 
const profileRoutesv1 = require('./routes/v1/profileRoutes');

const app = express();

// Middlewares
app.use(morgan("common")); 
app.use(bodyParser.json()); 
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
}));

// Routes
app.use('/api/v1/auth', rate_limiter_all, authRoutesv1);
app.use('/api/v1/eth', rate_limiter_all, ethRoutesv1);
app.use('/api/v1/profile', rate_limiter_all, profileRoutesv1);

app.get('/test', (req, res) => {
    res.send('Le backend fonctionne !');
});

// Exemple de route 
app.get("/healthz", (req, res) => {
    res.send("I am happy and healthy\n");
});

app.get("/", async (req, res, next) => {
    try {
        const [rows] = await database.raw('select VERSION() version');
        res.json({ message: `Hello from MySQL ${rows[0].version}` });
    } catch (error) {
        next(error);
    }
});

app.get("/reset_db", async (req, res, next) => {
    try {
        await database.raw('DROP TABLE IF EXISTS transactions;');
        await database.raw('CREATE TABLE transactions (date DATE, price FLOAT);');

        await database.raw('DROP TABLE IF EXISTS User;');
        await database.raw(`
            CREATE TABLE User (
                Id INT AUTO_INCREMENT PRIMARY KEY, 
                password VARCHAR(100) NOT NULL, 
                email VARCHAR(100) NOT NULL, 
                wallet TEXT, 
                password_refresh_token TEXT, 
                is_email_verified TINYINT(1) DEFAULT 0, 
                email_verification_token TEXT,
                refresh_token TEXT
            );
        `);

        res.json({ message: 'Table reset' });
    } catch (error) {
        next(error);
    }
});

module.exports = app;
