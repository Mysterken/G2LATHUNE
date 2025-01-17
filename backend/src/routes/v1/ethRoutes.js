const express = require("express");
const { getBalance } = require("../../services/etherscan");
const database = require("../../database")

const router = express.Router();

/**
 * Valide une adresse Ethereum.
 * @param {string} address - Adresse Ethereum
 * @returns {boolean}
 */
const isEthereumAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address);

/**
 * Route : GET /balance/:address
 * Description : Récupère le solde d'une adresse Ethereum.
 */
router.get("/balance/:address", async (req, res) => {
  const { address } = req.params;
  const network = req.query.network || "mainnet";

  if (!isEthereumAddress(address)) {
    return res.status(400).json({ error: "Adresse Ethereum invalide" });
  }

  try {
    const balance = await getBalance(address, network);
    res.json({
      network: network,
      address: address,
      balance: balance,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/balanceid/:id', async (req, res) => {
    const userId = req.params.id;
    const network = req.query.network || 'mainnet';
  
    try {
      const sql = "select * from User where Id = ?"
      const user = await database.raw(sql, [userId]);
      console.log(user)
  
      if (!user || !user.wallet) {
        return res.status(404).json({ error: 'Utilisateur ou adresse wallet non trouvé(e)' });
      }
  
      const address = user.wallet;
  
      if (!isEthereumAddress(address)) {
        return res.status(400).json({ error: 'Adresse Ethereum invalide' });
      }
  
      const balance = await getBalance(address, network);
  
      res.json({
        network: network,
        address: address,
        balance: balance,
      });
    } catch (error) {
      console.error(`Erreur : ${error.message}`);
      res.status(500).json({ error: 'Erreur interne' });
    }
  });

module.exports = router;