const express = require("express");
const morgan = require("morgan");
const bodyParser = require('body-parser');
const cors = require('cors');
const database = require("./database");
const { rate_limiter_all } = require("./rate_limiter");

const authRoutesv1 = require('./routes/v1/authRoutes');
const ethRoutesv1 = require('./routes/v1/ethRoutes');
const walletRoutesv1 = require('./routes/v1/walletRoutes');
const balanceRoutes = require('./routes/api/balance'); 

const app = express();

app.use(morgan("common"));
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use('/api/v1/auth', rate_limiter_all, authRoutesv1);
app.use('/api/v1/eth', rate_limiter_all, ethRoutesv1);
app.use('/wallet', walletRoutesv1);
app.use('/api/balance', balanceRoutes); 

// Vérifier si le backend fonctionne
app.get('/test', (req, res) => {
    res.send('Le backend fonctionne !');
});

// Health check
app.get("/healthz", (req, res) => {
    res.send("I am happy and healthy\n");
});

// MySQL
app.get("/", async (req, res, next) => {
    try {
        const [rows] = await database.raw('select VERSION() version');
        res.json({ message: `Hello from MySQL ${rows[0].version}` });
    } catch (error) {
        next(error);
    }
});

// Middleware pour gérer les erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: "Quelque chose s'est mal passé !" });
});

module.exports = app;
