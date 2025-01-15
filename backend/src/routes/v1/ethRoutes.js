const express = require('express');
const { getBalance } = require('../../services/etherscan');

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

router.get('/balance/:address', async (req, res) => {
    const { address } = req.params;
    const network = req.query.network || 'mainnet'; 
  
    if (!isEthereumAddress(address)) {
      return res.status(400).json({ error: 'Adresse Ethereum invalide' });
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
  



// router.get('/balance/:address', async (req, res) => {
//     const { address } = req.params;

//     // Validation de l'adresse Ethereum
//     if (!isEthereumAddress(address)) {
//         return res.status(400).json({ error: 'Invalid Ethereum address' });
//     }

//     try {
//         // Appel au service pour récupérer le solde
//         const balance = await getBalance(address);
//         res.json({
//             address: address,
//             balance: balance,
//         });
//     } catch (error) {
//         console.error(`Erreur lors de la récupération du solde : ${error.message}`);
//         res.status(500).json({ error: 'Unable to retrieve balance' });
//     }
// });

module.exports = router;
