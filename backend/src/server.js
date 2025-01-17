// const express = require("express");
// const morgan = require("morgan");
// const bodyParser = require("body-parser");
// const cors = require("cors");
// const database = require("./database");
// const { rate_limiter_all } = require("./rate_limiter");

// const authRoutesv1 = require("./routes/v1/authRoutes");
// const ethRoutesv1 = require("./routes/v1/ethRoutes");
// const walletRoutesv1 = require("./routes/v1/walletRoutes");

// const app = express();

// // Middlewares
// app.use(morgan("common"));
// app.use(bodyParser.json());
// app.use(cors({
//     origin: "http://localhost:3000",
//     credentials: true,
//     optionsSuccessStatus: 200
// }));

// // Port d'écoute
// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });


// // Test API route
// app.get('/test-api', (req, res) => {
//     res.send({ message: 'API test endpoint is working!' });
// });

// // Routes
// app.use('/api/v1/auth', rate_limiter_all, authRoutesv1);
// app.use('/api/v1/eth', rate_limiter_all, ethRoutesv1);
// app.use('/api/v1/wallet', walletRoutesv1);

// // Exemple de route
// app.get("/healthz", (req, res) => {
//     res.send("I am happy and healthy\n");
// });

// // Route principale
// app.get("/", async (req, res, next) => {
//     try {
//         const [rows] = await database.raw("select VERSION() version");
//         res.json({ message: `Hello from MySQL ${rows[0].version}` });
//     } catch (error) {
//         next(error);
//     }
// });

// module.exports = app;




const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const database = require("./database");
const { rate_limiter_all } = require("./rate_limiter");

const authRoutesv1 = require("./routes/v1/authRoutes");
const ethRoutesv1 = require("./routes/v1/ethRoutes");
const walletRoutesv1 = require("./routes/v1/walletRoutes");

const app = express();

// Middlewares
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200
}));

// Port d'écoute
//const PORT = process.env.PORT || 8080;
//app.listen(PORT, () => {
//    console.log(`Server running on port ${PORT}`);
//});

// Test API route
app.get('/test-api', (req, res) => {
    res.send({ message: 'API test endpoint is working!' });
});

// Routes
app.use('/api/v1/auth', rate_limiter_all, authRoutesv1);
app.use('/api/v1/eth', rate_limiter_all, ethRoutesv1);
app.use('/api/v1/wallet', walletRoutesv1);

// Exemple de route
app.get("/healthz", (req, res) => {
    res.send("I am happy and healthy\n");
});

// Route principale
app.get("/", async (req, res, next) => {
    try {
        const [rows] = await database.raw("select VERSION() version");
        res.json({ message: `Hello from MySQL ${rows[0].version}` });
    } catch (error) {
        next(error);
    }
});

module.exports = app;
