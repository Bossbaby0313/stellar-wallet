import { Horizon, Networks, TransactionBuilder, Operation, Asset, BASE_FEE } from '@stellar/stellar-sdk'

export const NETWORK_PASSPHRASE = Networks.TESTNET
export const HORIZON_URL = 'https://horizon-testnet.stellar.org'
export const server = new Horizon.Server(HORIZON_URL)

export type WalletBalance = { asset: string; amount: string; issuer?: string; limit?: string }
export type WalletPayment = { id: string; type: string; amount: string; asset: string; created_at: string; from: string; to: string; direction: 'incoming' | 'outgoing' | 'other' }

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
  // Query account operations so both credits and debits are included.
  const page = await server.operations().forAccount(publicKey).order('desc').limit(8).call()
  return page.records.map((record: any) => {
    const from = record.from ?? ''
    const to = record.to ?? record.account ?? ''
    const amount = record.amount ?? record.starting_balance ?? '—'
    return {
      id: String(record.id), type: record.type,
      amount,
      asset: record.asset_type === 'native' || record.type === 'create_account' ? 'XLM' : (record.asset_code ?? 'Asset'),
      created_at: record.created_at, from, to,
      direction: to === publicKey ? 'incoming' : from === publicKey ? 'outgoing' : 'other'
    }
  })
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