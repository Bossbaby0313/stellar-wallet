import { Horizon, Networks, TransactionBuilder, Operation, Asset, BASE_FEE } from '@stellar/stellar-sdk'

export const NETWORK_PASSPHRASE = Networks.TESTNET
export const HORIZON_URL = 'https://horizon-testnet.stellar.org'
export const server = new Horizon.Server(HORIZON_URL)

export type WalletBalance = { asset: string; amount: string; issuer?: string; limit?: string }
export type WalletPayment = { id: string; type: string; amount: string; asset: string; created_at: string; from: string; to: string }

export async function loadBalances(publicKey: string): Promise<WalletBalance[]> {
  const account = await server.loadAccount(publicKey)
  return account.balances.map((balance: any) => ({
    asset: balance.asset_type === 'native' ? 'XLM' : balance.asset_code,
    amount: balance.balance,
    issuer: balance.asset_issuer,
    limit: balance.limit
  }))
}

export async function loadPayments(publicKey: string): Promise<WalletPayment[]> {
  const page = await server.payments().forAccount(publicKey).order('desc').limit(8).call()
  return page.records.map((record: any) => ({
    id: record.id, type: record.type, amount: record.amount ?? '—',
    asset: record.asset_type === 'native' ? 'XLM' : (record.asset_code ?? 'Asset'),
    created_at: record.created_at, from: record.from ?? '', to: record.to ?? ''
  }))
}

export async function buildPayment(publicKey: string, destination: string, amount: string) {
  const account = await server.loadAccount(publicKey)
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE
  }).addOperation(Operation.payment({ destination, asset: Asset.native(), amount })).setTimeout(180).build()
  return transaction.toXDR()
}

export async function submitSignedTransaction(xdr: string) {
  const transaction = TransactionBuilder.fromXDR(xdr, NETWORK_PASSPHRASE)
  return server.submitTransaction(transaction)
}