# React-Node-Mysql Application

## Description

Ce projet est une application web composée d'un frontend en React, d'un backend en Express js et d'une base de données MariaDbL. L'application permet aux utilisateurs de s'inscrire, de se connecter, de gérer leur profil et de consulter l'évolution des prix de leur portefeuille crypto.

## Prérequis

- Docker
- Docker Compose

## Installation

1. Clonez le dépôt :

```sh'
git clone https://github.com/Mysterken/G2LATHUNE
cd G2LATHUNE

2. Créez un fichier .env dans le dossier backend avec les variables d'environnement nécessaires :


ETHERSCAN_API_KEY=<votre-cle-api-etherscan>


3. Démarrez les services avec Docker Compose :
docker compose up -d

Utilisation

Accédez à l'application frontend à l'adresse http://localhost:3000.
L'API backend est accessible à l'adresse http://localhost:80.

Fonctionnalités

Backend

Authentification et gestion des utilisateurs
Limitation du taux de requêtes
Intégration avec l'API Etherscan pour récupérer les soldes des portefeuilles Ethereum
Routes pour gérer les transactions et les profils des utilisateurs

Frontend

Inscription et connexion des utilisateurs
Gestion du profil utilisateur
Visualisation de l'évolution des prix du portefeuille crypto
Protection des routes avec des composants protégés

Licence
Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.


