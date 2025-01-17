const express = require("express");
const router = express.Router();
const database = require("../../database");
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {getTransactions} = require("../../services/Etherscan");

const apiKey = process.env.KEY_API;

const isEthereumAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address);

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

router.get('/get_data_old', async (req, res) => {

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

    // compare token with user.refresh_token
    const isTokenValid = await bcrypt.compare(token, user[0].refresh_token);

    if (!user || user.length === 0 || !isTokenValid) {
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


/**
 * Route : GET /priceevolution/:address
 * Description : Calculates the value evolution of an Ethereum wallet based on its transactions.
 */
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

    // compare token with user.refresh_token
    const isTokenValid = await bcrypt.compare(token, user[0].refresh_token);

    if (!user || user.length === 0 || !isTokenValid) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    user = user[0];

    const address = user.wallet;

    const network = req.query.network || 'mainnet';

    if (!isEthereumAddress(address)) {
        return res.status(400).json({ error: 'Adresse Ethereum invalide' });
    }

    try {
        // Fetch transactions
        const transactions = await getTransactions(address, network);

        // Calculate the balance evolution
        let runningBalance = 0; // Start with a balance of 0
        const valueEvolution = transactions.map(tx => {
            const value = parseFloat(tx.value) / 1e18; // Convert from Wei to Ether
            runningBalance += tx.to.toLowerCase() === address.toLowerCase() ? value : -value;

            return {
                timestamp: parseInt(tx.timeStamp, 10), // Timestamp of the transaction
                hash: tx.hash,
                runningBalance: runningBalance.toFixed(18), // Current balance at this transaction
            };
        });

        const formattedValueEvolution = valueEvolution.map((tx) => ({
            date: new Date(tx.timestamp * 1000).toISOString().split('T')[0],
            price: parseFloat(tx.runningBalance),
        }));

        res.json(formattedValueEvolution);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;