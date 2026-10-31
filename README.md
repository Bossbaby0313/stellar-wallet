# Orbit — Stellar Wallet

A TypeScript-first, non-custodial wallet interface for the **Stellar Testnet**.

## Stack
- React 18 + TypeScript + Vite
- `@stellar/stellar-sdk` for Horizon account reads and XLM payment transactions
- `@stellar/freighter-api` for wallet authorization and transaction signing
- Lucide React icons

## Run locally
```bash
npm install
npm run dev
```

## Production build
```bash
npm run build
npm run preview
```

## Connect and test
1. Install the [Freighter wallet](https://freighter.app/) browser extension.
2. Switch Freighter to **Testnet** and connect from the app.
3. Fund a test account with the [Stellar Friendbot](https://friendbot.stellar.org/).
4. View XLM and issued-asset balances, inspect recent payments, and send test XLM.

## Network safety
This app is configured for Stellar **Testnet only**. Horizon requests use `https://horizon-testnet.stellar.org`; transactions are built with the Testnet network passphrase and signed in Freighter. The app never asks for or stores secret keys. Never enter a secret key into this app.

## Deployment
The Vite build output is `dist/`. GitHub Actions builds the app and deploys it to GitHub Pages on every push to `main`. In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.

## Important
This is a starter wallet interface, not an audited production wallet. Review every transaction carefully before signing.
