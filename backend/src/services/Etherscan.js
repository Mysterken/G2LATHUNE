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

async function getTransactions(address, network = 'mainnet') {
  try {
    // Récupère l'URL en fonction du réseau choisi
    const baseUrl = NETWORK_URLS[network];
    if (!baseUrl) {
      throw new Error(`Réseau invalide : ${network}`);
    }

    // Requête vers l'API Etherscan
    const normalResponse = await axios.get(baseUrl, {
      params: {
        module: 'account',
        action: 'txlist',
        address: address,
        startblock: 0,
        endblock: 99999999,
        sort: 'asc',
        offset: 10000,
        page: 1,
        apikey: ETHERSCAN_API_KEY,
      },
    });

    const internalResponse = await axios.get(baseUrl, {
      params: {
        module: 'account',
        action: 'txlistinternal',
        address: address,
        startblock: 0,
        endblock: 99999999,
        sort: 'asc',
        offset: 10000,
        page: 1,
        apikey: ETHERSCAN_API_KEY,
      },
    });

    // Vérification 
    const normalData = normalResponse.data;
    const internalData = internalResponse.data;

    if (normalData.status !== '1' && internalData.status !== '1') {
      throw new Error(`Erreur API Etherscan : ${normalData.result}, ${internalData.result}`);
    }

    const normalTransactions = normalData.result;
    const internalTransactions = internalData.result;
    let sum = BigInt(0);

    normalTransactions.push(...internalTransactions);
    normalTransactions.sort((a, b) => a.timestamp - b.timestamp);

    normalTransactions.forEach(tx => {
      const gasPayed = tx.gasUsed && tx.gasPrice ? BigInt(tx.gasUsed) * BigInt(tx.gasPrice) : BigInt(0);

      if (address.toLowerCase() === tx.from.toLowerCase()) {
        sum -= BigInt(tx.value) + gasPayed;
      } else {
        sum += BigInt(tx.value);
      }

      tx.sum = sum.toString();
    });

    return normalTransactions;
  } catch (error) {
    console.error(`Erreur lors de la récupération des transactions : ${error.message}`);
    throw new Error('Échec de récupération des transactions Ethereum');
  }
}

module.exports = { getBalance, getTransactions };
