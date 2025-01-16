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
const walletRoutesv1 = require('./routes/v1/walletRoutes');


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

app.use('/wallet', walletRoutesv1);
module.exports = app;
