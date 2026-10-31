import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowLeftRight, ArrowUpRight, Copy, ExternalLink, Eye, EyeOff, Fuel, Globe2, LayoutDashboard, LoaderCircle, LogOut, Menu, RefreshCw, ShieldCheck, Wallet, X, Zap } from 'lucide-react'
import { getAddress, isConnected, signTransaction } from '@stellar/freighter-api'
import { buildPayment, loadBalances, loadPayments, submitSignedTransaction, type WalletBalance, type WalletPayment } from './lib/stellar'

type Notice = { kind: 'success' | 'error' | 'info'; text: string }
const short = (value: string) => value ? value.slice(0, 7) + '…' + value.slice(-6) : '—'
const money = (value: string) => Number(value).toLocaleString('en-US', { maximumFractionDigits: 4 })
const date = (value: string) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

export default function App() {
  const [address, setAddress] = useState('')
  const [balances, setBalances] = useState<WalletBalance[]>([])
  const [payments, setPayments] = useState<WalletPayment[]>([])
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [sending, setSending] = useState(false)
  const [showBalance, setShowBalance] = useState(true)
  const [sendOpen, setSendOpen] = useState(false)
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const totalXlm = useMemo(() => balances.find(item => item.asset === 'XLM')?.amount ?? '0', [balances])

  const refresh = useCallback(async (key = address) => {
    if (!key) return
    setLoading(true)
    try {
      const [nextBalances, nextPayments] = await Promise.all([loadBalances(key), loadPayments(key)])
      setBalances(nextBalances); setPayments(nextPayments)
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not load wallet data.' })
    } finally { setLoading(false) }
  }, [address])
  useEffect(() => { if (address) void refresh(address) }, [address, refresh])

  const connect = async () => {
    setConnecting(true)
    try {
      const available = await isConnected()
      if (!available.isConnected) {
        setNotice({ kind: 'error', text: 'Freighter was not detected. Install the Freighter browser extension and try again.' })
        return
      }
      const result = await getAddress()
      if (result.error || !result.address) throw new Error(result.error?.message ?? 'Wallet connection was not approved.')
      setAddress(result.address)
      setNotice({ kind: 'success', text: 'Wallet connected to Stellar Testnet.' })
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Unable to connect wallet.' })
    } finally { setConnecting(false) }
  }
  const disconnect = () => { setAddress(''); setBalances([]); setPayments([]); setNotice({ kind: 'info', text: 'Wallet disconnected.' }) }
  const copyAddress = async () => {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setNotice({ kind: 'success', text: 'Public address copied.' })
  }
  const send = async (event: FormEvent) => {
    event.preventDefault()
    if (!address || !destination.trim() || !amount || Number(amount) <= 0) return
    setSending(true)
    try {
      const xdr = await buildPayment(address, destination.trim(), amount)
      const signed = await signTransaction(xdr, { networkPassphrase: 'Test SDF Network ; September 2015' })
      if (signed.error || !signed.signedTxXdr) throw new Error(signed.error?.message ?? 'Transaction signing was cancelled.')
      await submitSignedTransaction(signed.signedTxXdr)
      setNotice({ kind: 'success', text: 'Payment submitted to Stellar Testnet.' })
      setDestination(''); setAmount(''); setSendOpen(false)
      await refresh(address)
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Transaction failed.' })
    } finally { setSending(false) }
  }

  return <div className="app-shell">
    <aside className={mobileNav ? 'sidebar open' : 'sidebar'}>
      <div className="brand"><div className="brand-mark"><Zap size={21} fill="currentColor" /></div><span>orbit<span className="brand-dot">.</span></span><button className="icon-btn close-nav" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
      <div className="network-pill"><span className="live-dot"/> Stellar Testnet <span className="network-arrow">⌄</span></div>
      <div className="nav-label">WORKSPACE</div>
      <button className="nav-item active"><LayoutDashboard size={18}/> Overview</button>
      <button className="nav-item" onClick={() => setSendOpen(true)}><ArrowLeftRight size={18}/> Send & receive</button>
      <div className="nav-label nav-label-bottom">PREFERENCES</div>
      <a className="nav-item" href="https://www.stellar.org/" target="_blank" rel="noreferrer"><Globe2 size={18}/> Stellar network <ExternalLink size={13} className="nav-ext"/></a>
      <a className="nav-item" href="https://freighter.app/" target="_blank" rel="noreferrer"><ShieldCheck size={18}/> Freighter wallet <ExternalLink size={13} className="nav-ext"/></a>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon">?</div><div><b>Need a hand?</b><span>Explore the Stellar docs</span></div><a href="https://developers.stellar.org/" target="_blank" rel="noreferrer"><ExternalLink size={14}/></a></div><div className="sidebar-foot">Built for the Stellar community <span>✦</span></div></div>
    </aside>
    {mobileNav && <div className="scrim" onClick={() => setMobileNav(false)}/>}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="icon-btn menu-btn" onClick={() => setMobileNav(true)}><Menu size={19}/></button><span className="breadcrumb">Wallet <span>/</span> Overview</span></div><div className="topbar-right"><span className="secure-label"><ShieldCheck size={14}/> Non-custodial</span>{address ? <div className="account-menu"><span className="avatar">O</span><span className="account-address">{short(address)}</span><button className="icon-btn" title="Disconnect" onClick={disconnect}><LogOut size={16}/></button></div> : <button className="connect-btn top-connect" onClick={connect} disabled={connecting}>{connecting ? <LoaderCircle className="spin" size={16}/> : <Wallet size={16}/>} Connect wallet</button>}</div></header>
      <div className="content">
        <div className="page-heading"><div><div className="eyebrow">YOUR WEB3 HOME</div><h1>Wallet overview<span className="heading-period">.</span></h1><p>One place for your Stellar assets and activity.</p></div><button className="refresh-btn" onClick={() => void refresh()} disabled={!address || loading}><RefreshCw size={15} className={loading ? 'spin' : ''}/> Refresh</button></div>
        {notice && <div className={'notice ' + notice.kind}><span>{notice.text}</span><button onClick={() => setNotice(null)}><X size={15}/></button></div>}
        <section className="hero-card"><div className="hero-glow"/><div className="hero-top"><div><span className="hero-label">TOTAL XLM BALANCE</span><button className="eye-btn" onClick={() => setShowBalance(!showBalance)}>{showBalance ? <Eye size={15}/> : <EyeOff size={15}/>}</button></div><span className="testnet-tag"><span className="live-dot"/> TESTNET</span></div><div className="hero-balance">{address ? (showBalance ? money(totalXlm) : '••••••') : '—'} <span>XLM</span></div><div className="hero-caption">{address ? 'Available on Stellar Testnet' : 'Connect your wallet to view your balance'}</div><div className="hero-actions"><button className="primary-action" onClick={() => setSendOpen(true)} disabled={!address}><ArrowUpRight size={17}/> Send XLM</button><button className="secondary-action" onClick={copyAddress} disabled={!address}><Copy size={15}/> Copy address</button></div><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/></section>
        <div className="section-heading"><div><h2>Your assets</h2><p>Tokens held in your connected account</p></div><span className="count-chip">{balances.length} {balances.length === 1 ? 'asset' : 'assets'}</span></div>
        <section className="asset-card"><div className="asset-head"><span>ASSET</span><span>NETWORK</span><span className="align-right">BALANCE</span></div>{!address ? <div className="empty-state"><div className="empty-icon"><Wallet size={21}/></div><b>Your wallet is waiting</b><span>Connect Freighter to see your assets here.</span><button onClick={connect}>Connect wallet <ArrowUpRight size={14}/></button></div> : loading && balances.length === 0 ? <div className="loading-state"><LoaderCircle className="spin" size={20}/> Loading your assets…</div> : balances.length ? balances.map((item, index) => <div className="asset-row" key={item.asset + (item.issuer ?? index)}><div className="asset-name"><div className={'coin-icon ' + (item.asset === 'XLM' ? 'xlm' : '')}>{item.asset === 'XLM' ? '✦' : item.asset.slice(0,1)}</div><div><b>{item.asset}</b><span>{item.asset === 'XLM' ? 'Stellar Lumens' : 'Stellar asset'}</span></div></div><span className="network-name"><i/> Stellar Testnet</span><b className="asset-amount">{showBalance ? money(item.amount) : '••••••'}</b></div>) : <div className="empty-state compact">No assets found for this account.</div>}</section>
        <div className="section-heading activity-heading"><div><h2>Recent activity</h2><p>Your latest on-chain transactions</p></div><span className="count-chip">Latest 8</span></div>
        <section className="activity-card">{!address ? <div className="empty-state compact">Connect your wallet to see transaction activity.</div> : loading && !payments.length ? <div className="loading-state"><LoaderCircle className="spin" size={20}/> Loading activity…</div> : payments.length ? payments.map(payment => <div className="activity-row" key={payment.id}><div className="activity-icon"><ArrowLeftRight size={16}/></div><div className="activity-info"><b>{payment.type === 'create_account' ? 'Account created' : payment.type === 'payment' ? 'Payment' : payment.type.replaceAll('_',' ')}</b><span>{short(payment.from || payment.to)} · {date(payment.created_at)}</span></div><div className="activity-value"><b>{payment.amount} {payment.asset}</b><span>Confirmed on-chain</span></div></div>) : <div className="empty-state compact">No transactions yet. Your activity will appear here.</div>}</section>
        <footer className="footer"><span>© 2026 Orbit Wallet</span><span><span className="live-dot"/> Connected to Stellar Testnet</span><a href="https://stellar.expert/explorer/testnet" target="_blank" rel="noreferrer">Testnet explorer <ExternalLink size={12}/></a></footer>
      </div>
    </main>
    {sendOpen && <div className="modal-backdrop" onClick={() => setSendOpen(false)}><div className="send-modal" onClick={event => event.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">STELLAR TESTNET</span><h2>Send XLM</h2><p>Transfer Lumens to another Stellar account.</p></div><button className="icon-btn" onClick={() => setSendOpen(false)}><X size={19}/></button></div><form onSubmit={send}><label>Recipient public address<input value={destination} onChange={event => setDestination(event.target.value)} placeholder="G…" required minLength={56} maxLength={56}/></label><label>Amount<div className="amount-input"><input type="number" min="0.0000001" step="0.0000001" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" required/><span>XLM</span></div></label><div className="fee-note"><Fuel size={15}/> Network fee is estimated at 0.00001 XLM</div><div className="modal-warning"><ShieldCheck size={16}/> Review the destination carefully. Transactions on Stellar cannot be reversed.</div><button className="submit-send" type="submit" disabled={sending || !address}>{sending ? <><LoaderCircle size={17} className="spin"/> Waiting for wallet…</> : <><ArrowUpRight size={17}/> Review & send</>}</button></form></div></div>}
  </div>
}
