const express = require('express');
const knex = require('../../database'); // Import de Knex
const { getBalance } = require('../../services/etherscan');

const router = express.Router();

const isEthereumAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address);

router.get('/balance/:id', async (req, res) => {
  const userId = req.params.id;
  const network = req.query.network || 'mainnet';

  try {
    const user = await knex('User').select('wallet').where({ id: userId }).first();

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
