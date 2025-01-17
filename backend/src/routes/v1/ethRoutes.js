const express = require('express');
const { getBalance, getTransactions } = require('../../services/Etherscan');

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

/**
 * Route : GET /transactions/:address
 * Description : Récupère les transactions d'une adresse Ethereum.
 */

router.get('/transactions/:address', async (req, res) => {
  const { address } = req.params;
  const network = req.query.network || 'mainnet'; 

  if (!isEthereumAddress(address)) {
    return res.status(400).json({ error: 'Adresse Ethereum invalide' });
  }

  try {
    const transactions = await getTransactions(address, network);
    res.json({
      network: network,
      address: address,
      transactions: transactions,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Route : GET /priceevolution/:address
 * Description : Calculates the value evolution of an Ethereum wallet based on its transactions.
 */
router.get('/priceevolution/:address', async (req, res) => {
    const { address } = req.params;
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
