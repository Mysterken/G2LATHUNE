const express = require('express');
const router = express.Router();
const database = require("../../database");
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    const token = authHeader.split(' ')[1];
    try {
        req.user = jwt.verify(token, 'secret');
        next();
    } catch {
        res.status(401).json({ error: "Unauthorized" });
    }
};

const getUserByEmail = async (email) => {
    const sql = "SELECT * FROM User WHERE email = ?";
    const [user] = await database.raw(sql, [email]);
    return user.length ? user[0] : null;
};

router.get('/get_wallet', authenticate, async (req, res) => {
    const user = await getUserByEmail(req.user.email);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    res.json({ wallet: user.wallet || "" });
});

router.put('/update_wallet', authenticate, async (req, res) => {
    const user = await getUserByEmail(req.user.email);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const wallet = req.body.wallet || "";
    const updateSql = "UPDATE User SET wallet = ? WHERE email = ?";
    await database.raw(updateSql, [wallet, req.user.email]);

    res.json({ wallet });
});

module.exports = router;