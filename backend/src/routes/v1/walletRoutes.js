const express = require("express");
const router = express.Router();
const database = require("../../database");
const transactions = await database('transactions').select('date', 'price');


router.get('/get-data', (req, res) => {
//     database.raw('SELECT date, price FROM transactions;')
//     .then(([rows, columns]) => rows)
//     .then((row) => res.json({ date: row.date, price: date.price }))
    res.send('Get wallet data route');
});


// Route pour récupérer les données des transactions
router.get('/get-data', async (req, res) => {
    try {
        const transactions = await database('transactions').select('date', 'price');
        
        res.json({
            success: true,
            data: transactions,
        });
    } catch (error) {
        console.error(`Erreur lors de la récupération des données : ${error.message}`);
        res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
    }
});

module.exports = router;