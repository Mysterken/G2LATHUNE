const express = require("express");
const router = express.Router();
const database = require("../../database");

// Route to fetch transaction data
router.get("/get-data", async (req, res) => {
  try {
    const transactions = await database("transactions").select("date", "price");

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération des données : ${error.message}`);
    res.status(500).json({ success: false, error: "Erreur interne du serveur" });
  }
});

module.exports = router;