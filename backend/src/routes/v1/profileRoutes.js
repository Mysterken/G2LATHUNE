const express = require('express');
const router = express.Router();
const database = require("../../database");
const jwt = require('jsonwebtoken');

router.get('/get_wallet', async (req, res) => {

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

    const wallet = user.wallet || "";

    res.json({ wallet });
});

router.put('/update_wallet', async (req, res) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, 'secret');
    const email = decoded.email;

    const sql = "SELECT * FROM User WHERE email = ?";
    let [user] = await database.raw(sql, [email])

    if (!user || user.length === 0) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    user = user[0];

    const wallet = req.body.wallet || "";

    const updateSql = "UPDATE User SET wallet = ? WHERE email = ?";
    await database.raw(updateSql, [wallet, email]);

    res.json({ wallet });
});

module.exports = router;