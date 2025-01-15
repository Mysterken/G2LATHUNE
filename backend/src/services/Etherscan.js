const axios = require('axios'); 
require('dotenv').config(); 

// Clé API Etherscan
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

// URLs des réseaux
const NETWORK_URLS = {
  mainnet: 'https://api.etherscan.io/api',
  sepolia: 'https://api-sepolia.etherscan.io/api',
  holesky: 'https://api-holesky.etherscan.io/api',
};


async function getBalance(address, network = 'mainnet') {
  try {
    // Récupère l'URL en fonction du réseau choisi
    const baseUrl = NETWORK_URLS[network];
    if (!baseUrl) {
      throw new Error(`Réseau invalide : ${network}`);
    }

    // Requête vers l'API Etherscan
    const response = await axios.get(baseUrl, {
      params: {
        module: 'account',
        action: 'balance',
        address: address,
        tag: 'latest',
        apikey: ETHERSCAN_API_KEY,
      },
    });

    // Vérification 
    const data = response.data;
    if (data.status !== '1') {
      throw new Error(`Erreur API Etherscan : ${data.result}`);
    }

    // solde en Ether
    const balanceInWei = data.result;
    const balanceInEther = (parseInt(balanceInWei, 10) / 10 ** 18).toFixed(18);

    return balanceInEther;
  } catch (error) {
    console.error(`Erreur lors de la récupération du solde : ${error.message}`);
    throw new Error('Échec de récupération du solde Ethereum');
  }
}

module.exports = { getBalance };
