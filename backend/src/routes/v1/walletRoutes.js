const express = require("express");
const router = express.Router();
const database = require("../../database");
require('dotenv').config();
const jwt = require('jsonwebtoken');

const apiKey = process.env.KEY_API;

router.get('/get-data', (req, res) => {
//     database.raw('SELECT date, price FROM transactions;')
//     .then(([rows, columns]) => rows)
//     .then((row) => res.json({ date: row.date, price: date.price }))
    res.send('Get wallet data route');
});

router.get('/get-transactions', async(req, res) => {
    const { address, internalAddress } = req.query;

    if (!address || !internalAddress) {
        return res.status(400).json({ error: "L'adresse et l'adresse interne sont requis" });
    }

    const normalResponse = await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=${apiKey}`);
    const normalTransactions = await normalResponse.json();

    const internalResponse = await fetch(`https://api.etherscan.io/api?module=account&action=txlistinternal&address=${internalAddress}&startblock=0&endblock=2702578&page=1&offset=10&sort=asc&apikey=${apiKey}`);
    const internalTransactions = await internalResponse.json();
        
    res.json({ normalTransactions, internalTransactions });
});

router.get('/get_data', async (req, res) => {

    // check if there is a bearer token
    if (!req.headers.authorization) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    // fetch jwt from bearer token
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, 'secret');
    const email = decoded.email;

    const sql = "SELECT * FROM User WHERE email = ?";
    let [user] = await database.raw(sql, [email])

    if (!user || user.length === 0) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    user = user[0];

    const wallet = user.wallet;

    // generate 5-10 random price evolution
    const priceEvolution = Array.from({ length: Math.floor(Math.random() * 6) + 5 }, (_, i) => ({
        date: `2021-01-${i + 1}`,
        price: Math.floor(Math.random() * 1000) + 100,
    }));

    res.send(priceEvolution);
});

module.exports = router;