const express = require("express");
const router = express.Router();
const database = require("../../database");
require('dotenv').config();

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

router.get('/get_data', (req, res) => {

    const priceEvolution = [
        { date: "2021-01-01", price: 100 },
        { date: "2021-01-02", price: 110 },
        { date: "2021-01-03", price: 120 },
        { date: "2021-01-04", price: 130 },
        { date: "2021-01-05", price: 140 },
    ];

    res.send(priceEvolution);
});

module.exports = router;