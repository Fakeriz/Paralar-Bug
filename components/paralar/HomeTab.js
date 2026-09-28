'use client'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Eye, EyeOff, Receipt, Plus, ChevronRight, Sparkles, Trash2, WifiOff, RefreshCw, ArrowLeftRight } from 'lucide-react'
import { DocumentOutline, ReceiptOutline, Profile2userOutline, ChartPieOutline } from './ReiconIcons'
import { toast } from 'sonner'
import { useApp } from './context'
import { Avatar, Card, SectionLabel, EmptyState } from './ui'
import SwipeTransactionRow from './SwipeTransactionRow'
import { BankCard, ManageCardsCard } from './BankCard'
import AccountDeck from './AccountDeck'
import { cn } from '@/lib/utils'
import { applyTxToBalances } from '@/lib/ledger'
import { deriveNotifications } from '@/lib/notifications'
import { supabase } from '@/lib/supabase'
import { APP_VERSION } from '@/lib/version'

export function safeFormatDate(d, locale = 'en-GB', options = { weekday: 'short', day: 'numeric', month: 'short' }) {
  if (!d) return '—'
  try {
    const x = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d
    if (isNaN(x.getTime())) return '—'
    return x.toLocaleDateString(locale, options)
  } catch {
    return '—'
  }
}

function Header() {
  const {
    t,
    profile,
    open,
    isGuest,
    bills = [],
    budgets = [],
    goals = [],
    transactions = [],
    home = 'USD',
    rates = {},
    fmt,
  } = useApp()
  const first = (profile?.full_name || '').trim().split(' ')[0]

  const [hasUnreadAnnouncements, setHasUnreadAnnouncements] = useState(false)
  const [isOffline, setIsOffline] = useState(() => (typeof navigator !== 'undefined' ? !navigator.onLine : false))
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const updateOnline = () => {
      setIsOffline(typeof navigator !== 'undefined' ? !navigator.onLine : false)
    }
    const handleSyncState = (e) => {
      if (e?.detail) {
        if (e.detail.isOffline !== undefined) setIsOffline(e.detail.isOffline)
        if (e.detail.isSyncing !== undefined) setIsSyncing(e.detail.isSyncing)
      }
    }
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)
    window.addEventListener('paralar_sync_state', handleSyncState)
    return () => {
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
      window.removeEventListener('paralar_sync_state', handleSyncState)
    }
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('paralar_app_version')
      if (stored !== APP_VERSION) {
        localStorage.setItem('paralar_app_version', APP_VERSION)
        toast(`Paralar diperbarui ke ${APP_VERSION}`)
      }
    } catch {}
  }, [])

  const checkUnreadAnnouncements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('id')
        .eq('is_active', true)
      if (!error && Array.isArray(data) && data.length > 0) {
        let readIds = []
        try {
          readIds = JSON.parse(localStorage.getItem('read_announcements') || '[]')
        } catch {}
        const unread = (data || []).some((a) => !(readIds || []).includes(a?.id))
        setHasUnreadAnnouncements(unread)
      } else {
        setHasUnreadAnnouncements(false)
      }
    } catch {
      setHasUnreadAnnouncements(false)
    }
  }, [])

  useEffect(() => {
    checkUnreadAnnouncements()
    const handleReadUpdated = () => checkUnreadAnnouncements()
    window.addEventListener('read_announcements_updated', handleReadUpdated)
    window.addEventListener('storage', handleReadUpdated)
    return () => {
      window.removeEventListener('read_announcements_updated', handleReadUpdated)
      window.removeEventListener('storage', handleReadUpdated)
    }
  }, [checkUnreadAnnouncements])

  const { hasUrgent } = useMemo(() => {
    return deriveNotifications({
      bills,
      budgets,
      goals,
      transactions,
      home,
      rates,
      fmt,
      t,
    })
  }, [bills, budgets, goals, transactions, home, rates, fmt, t])

  const hasBadge = hasUrgent || hasUnreadAnnouncements

  return (
    <div className="flex items-center justify-between pt-4">
      <div className="flex items-center gap-3">
        <Avatar profile={profile} onClick={() => open('profile')} data-testid="avatar" />
        <div>
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold leading-tight text-zinc-950 dark:text-white" data-testid="greeting">{t('hi')}, {first || t('user')}</p>
            {isOffline ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 shrink-0"
                data-testid="offline-badge"
              >
                <WifiOff size={13} strokeWidth={2} />
                <span>Offline Mode</span>
              </span>
            ) : isSyncing ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 shrink-0"
                data-testid="syncing-badge"
              >
                <RefreshCw size={13} strokeWidth={2} className="animate-spin" />
                <span>Syncing...</span>
              </span>
            ) : null}
          </div>
          {isGuest ? <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mt-0.5">{t('guest_mode')}</p> : null}
        </div>
      </div>
      <button
        type="button"
        onClick={() => open('notifications')}
        className="h-10 w-10 rounded-full bg-white border border-border/70 text-foreground dark:bg-[#121214] dark:border-white/10 dark:text-white flex items-center justify-center transition-colors relative shadow-xs"
        aria-label="notifications"
      >
        <Bell size={18} />
        {hasBadge && (
          <span
            className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#121214]"
            data-testid="notification-dot"
          />
        )}
      </button>
    </div>
  )
}

/**
 * TotalBalanceCard — kartu "Total" di deck Home. Diekstrak dari BalanceCarousel
 * agar bisa di-preview/diuji terpisah (dan dipakai ulang).
 *
 * Desain (comfort-first):
 *  - Hierarki tipe: caption kecil "TOTAL BALANCE" -> simbol mata uang kecil
 *    + digit besar tabular (bukan satu string raksasa).
 *  - Depth monokrom: gradient dasar + sheen diagonal + hairline highlight
 *    atas + dua cahaya radial — kartu terasa "fisik" tanpa warna norak.
 *  - Eye toggle jadi target sentuh 32px yang proper (sebelumnya ikon telanjang).
 *  - Pill income/spending: padding & tipe sedikit dibesarkan, border dilembutkan.
 */
/**
 * TotalBalanceCard — Kartu Overview Semua Akun dengan gaya Belanje Neo-Fintech Paralar.
 */
export function TotalBalanceCard() {
  const { t, fmt, home, stats, hideBalance, setHideBalance, open } = useApp()

  return (
    <BankCard
      name={t('all_accounts') || 'All Accounts'}
      balance={stats?.totalBalance || 0}
      income={stats?.income || 0}
      spending={stats?.spending || 0}
      currency={home}
      type="overview"
      theme="obsidian"
      fmt={fmt}
      hideBalance={hideBalance}
      onToggleHideBalance={() => setHideBalance(!hideBalance)}
      hintText="ALL ACCOUNTS"
      onHintClick={() => open('accounts')}
      flat={true}
      showOcclusionShadow={false}
      className="h-full w-full shadow-none"
    />
  )
}

function BalanceCarousel({ activeIdx = 0, onIndexChange }) {
  const { t, fmt, home, stats, accounts = [], transactions = [], hideBalance, setHideBalance, open, convertToHome } = useApp()

  const totalSlides = 1 + (accounts || []).length

  // Clamp posisi aktif bila akun berkurang
  useEffect(() => {
    if (activeIdx >= totalSlides && totalSlides > 0) {
      onIndexChange?.(totalSlides - 1)
    }
  }, [totalSlides, activeIdx, onIndexChange])

  const goTo = useCallback(
    (i) => {
      const clamped = Math.max(0, Math.min(i, totalSlides - 1))
      onIndexChange?.(clamped)
    },
    [totalSlides, onIndexChange]
  )

  // Hitung income & spending per akun di bulan berjalan
  const accountMonthlyStats = useMemo(() => {
    const map = {}
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const inMonth = (transactions || []).filter((tx) => {
      const d = new Date(tx?.date || tx?.transaction_date || 0)
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    ;(accounts || []).forEach((acc) => {
      if (!acc?.id) return
      let inc = 0
      let spd = 0
      inMonth.forEach((tx) => {
        const amt = Math.abs(Number(tx?.amount) || 0)
        if (tx?.type === 'income' && tx?.account_id === acc.id) {
          inc += amt
        } else if (tx?.type === 'expense' && tx?.account_id === acc.id) {
          spd += amt
        } else if (tx?.type === 'transfer') {
          if (tx?.to_account_id === acc.id) inc += amt
          if (tx?.account_id === acc.id) spd += amt
        }
      })
      map[acc.id] = { income: inc, spending: spd }
    })

    return map
  }, [accounts, transactions])

  // Slide list: Akun-akun pengguna ala Belanje
  const slides = useMemo(() => {
    if (!accounts || accounts.length === 0) {
      return [
        {
          id: 'overview',
          label: t('all_accounts') || 'All Accounts',
          node: <TotalBalanceCard />,
        },
      ]
    }

    return (accounts || []).map((a) => ({
      id: `account-${a.id}`,
      label: a.name || 'Account',
      node: (
        <BankCard
          name={a.name}
          balance={a.balance}
          currency={a.currency || home}
          theme={a.theme || (a.type === 'ewallet' ? 'plum' : a.type === 'bank' ? 'indigo' : 'obsidian')}
          logo={a.logo}
          icon={a.icon}
          type={a.type || 'bank'}
          id={a.id}
          fmt={fmt}
          hideBalance={hideBalance}
          onToggleHideBalance={() => setHideBalance(!hideBalance)}
          income={accountMonthlyStats[a.id]?.income || 0}
          spending={accountMonthlyStats[a.id]?.spending || 0}
          hintText="TAP FOR PULSE"
          onHintClick={() => open('accounts')}
          flat={true}
          showOcclusionShadow={false}
          approxHome={a.currency !== home ? fmt(convertToHome(a.balance, a.currency), home) : null}
          className="h-full w-full shadow-none"
        />
      ),
    }))
  }, [t, fmt, home, accounts, hideBalance, setHideBalance, open, convertToHome, accountMonthlyStats])

  return (
    <div className="mt-2">
      <AccountDeck
        slides={slides}
        index={activeIdx}
        onIndexChange={onIndexChange}
        regionLabel={t('accounts')}
      />

      {/* Indikator halaman: dots (aktif pill memanjang) + tombol (+) tambah akun baru */}
      <div className="flex justify-center items-center gap-1.5 mt-3">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`${s.label} (${i + 1} dari ${slides.length})`}
            aria-current={i === activeIdx ? 'true' : undefined}
            className={cn(
              'transition-all duration-300 cursor-pointer',
              i === activeIdx
                ? 'w-6 h-1.5 rounded-full bg-zinc-950 dark:bg-white shadow-2xs'
                : 'w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600'
            )}
          />
        ))}

        {/* Tombol (+) untuk tambah akun baru persis di samping dots */}
        <button
          type="button"
          onClick={() => open('newAccount')}
          className="ml-2 h-5 w-5 rounded-full border border-border/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-90 cursor-pointer"
          aria-label={t('new_account') || 'Add Account'}
          title={t('new_account') || 'Add Account'}
        >
          <Plus size={11} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  )
}

export function QuickGrid() {
  const { t, open, bills = [], transactions = [] } = useApp()

  // Hierarki + info sekilas: badge dihitung dengan logika yang sama seperti
  // BillsTrackerSheet ("belum dibayar bulan ini").
  const now = new Date()
  const mKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const today = now.getDate()
  const unpaidBills = (bills || []).filter((b) => !((b?.paid_months || {})[mKey]))
  const overdueBills = unpaidBills.filter((b) => (Number(b?.due_day) || 1) < today)
  const receiptCount = (transactions || []).filter((tx) => Boolean(tx?.receipt_url)).length

  const items = [
    {
      id: 'receipts',
      label: t('receipts'),
      icon: ReceiptOutline,
      onClick: () => open('receiptGallery'),
      badge: receiptCount,
      tone: 'quiet',
    },
    { id: 'split', label: t('bill_split'), icon: Profile2userOutline, onClick: () => open('split'), tone: 'idle' },
    {
      id: 'bills',
      label: t('bills'),
      icon: DocumentOutline,
      onClick: () => open('bills'),
      badge: unpaidBills.length,
      // Tile yang menuntut perhatian dapat aksen: overdue (rose) > due (amber).
      tone: overdueBills.length > 0 ? 'overdue' : unpaidBills.length > 0 ? 'due' : 'idle',
    },
    { id: 'analytics', label: t('analytics'), icon: ChartPieOutline, onClick: () => open('analytics'), tone: 'idle' },
  ]
  return (
    <div className="grid grid-cols-4 gap-3 mt-4">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={it.onClick}
          data-testid={`quick-${it.id}`}
          aria-label={it.badge > 0 ? `${it.label} (${it.badge})` : it.label}
          className="flex flex-col items-center gap-2 group"
        >
          <div
            className={cn(
              'relative h-14 w-14 rounded-2xl border flex items-center justify-center transition active:scale-95 shadow-xs',
              it.tone === 'overdue' && 'bg-rose-500/10 border-rose-500/60 text-rose-500 dark:text-rose-400',
              it.tone === 'due' && 'bg-amber-500/10 border-amber-500/60 text-amber-600 dark:text-amber-400',
              (it.tone === 'idle' || it.tone === 'quiet') &&
                'bg-white border-border/70 text-foreground dark:bg-[#121214] dark:border-white/10 dark:text-white group-hover:border-foreground/40'
            )}
          >
            {/* Ikon Reicon: fill/stroke bawaan dari reicon.dev, tidak perlu strokeWidth */}
            <it.icon size={24} />
            {it.badge > 0 && (
              <span
                className={cn(
                  'absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full text-[10px] font-bold tabular-nums flex items-center justify-center shadow',
                  it.tone === 'overdue' && 'bg-rose-500 text-white',
                  it.tone === 'due' && 'bg-amber-400 text-zinc-950',
                  it.tone === 'quiet' && 'bg-zinc-500/30 text-zinc-100'
                )}
              >
                {it.badge}
              </span>
            )}
          </div>
          <span
            className={cn(
              'text-[11px] font-semibold transition-colors',
              it.tone === 'idle' || it.tone === 'quiet'
                ? 'text-muted-foreground group-hover:text-foreground'
                : 'text-foreground'
            )}
          >
            {it.label}
          </span>
        </button>
      ))}
    </div>
  )
}

export default function HomeTab() {
  const { t, transactions = [], setTab, open, isGuest, store, refresh, accounts = [], rates, deleteTransaction, hideBalance } = useApp()
  const [activeCardIdx, setActiveCardIdx] = useState(0)
  const [openRowId, setOpenRowId] = useState(null)
  const [deletingTx, setDeletingTx] = useState(null)

  const handleEdit = (tx) => {
    open?.('addTx', { ...tx, editId: tx?.id })
  }

  const handleDelete = (tx) => {
    setDeletingTx(tx)
  }

  const confirmDelete = async () => {
    if (!deletingTx?.id) return
    const target = deletingTx
    setDeletingTx(null) // Close modal immediately
    try {
      if (deleteTransaction) {
        await deleteTransaction(target)
      } else {
        await applyTxToBalances(store, accounts, target, -1, rates)
        await store?.deleteTransaction?.(target.id)
        if (refresh) await refresh()
      }
      toast.success(t('deleted'))
    } catch {
      toast.error(t('error'))
    }
  }

  // Akun yang sedang aktif di-swipe (bila di slide terakhir Manage cards, activeAccount = null)
  const activeAccount = useMemo(() => {
    if (activeCardIdx >= (accounts || []).length) return null
    return (accounts || [])[activeCardIdx] || null
  }, [activeCardIdx, accounts])

  // Filter transaksi terkini berdasarkan akun aktif (seperti di referensi Belanje)
  const recent = useMemo(() => {
    if (!activeAccount) {
      return (transactions || []).slice(0, 6)
    }
    const accTxs = (transactions || []).filter(
      (tx) => tx?.account_id === activeAccount.id || tx?.to_account_id === activeAccount.id
    )
    return accTxs.slice(0, 6)
  }, [activeAccount, transactions])

  return (
    <div className="px-5 pb-28">
      <Header />
      {isGuest ? (
        <div className="mt-4 rounded-xl bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:border-white/10 px-3 py-2 text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-2"><Sparkles size={12} /> {t('demo_banner')}</div>
      ) : null}
      <BalanceCarousel activeIdx={activeCardIdx} onIndexChange={setActiveCardIdx} />
      <QuickGrid />

      {/* Jarak atas antar section mt-6, jarak bawah ke card mb-2.5 */}
      <div className="flex items-center justify-between mt-6 mb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <SectionLabel className="truncate">
            {activeAccount ? `Recent · ${activeAccount.name}` : t('recent_transactions')}
          </SectionLabel>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {activeAccount ? (
            <button
              type="button"
              onClick={() => open('addTx', { type: 'transfer', from_account_id: activeAccount.id })}
              className="text-xs font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/80 bg-background hover:bg-muted/40 text-foreground transition-all active:scale-95 shadow-2xs cursor-pointer"
              aria-label="Pindahkan dana"
            >
              <ArrowLeftRight size={12} strokeWidth={2} />
              <span>Move</span>
            </button>
          ) : null}
          <button 
            type="button" 
            onClick={() => setTab('transactions')} 
            className="text-xs font-semibold flex items-center gap-0.5 text-zinc-950 dark:text-white hover:opacity-80 transition-opacity cursor-pointer"
          >
            {t('see_all')} <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {recent.length === 0 ? (
        <Card className="px-4 py-8">
          <EmptyState
            icon={Receipt}
            title={activeAccount ? `Belum ada transaksi di ${activeAccount.name}` : t('no_transactions')}
            subtitle={activeAccount ? 'Catat pengeluaran atau pemasukan untuk akun ini' : t('no_transactions_sub')}
          />
        </Card>
      ) : (
        <div className="rounded-2xl border border-border/40 bg-card overflow-hidden divide-y divide-border/30 mb-4 touch-pan-y shadow-xs">
          <AnimatePresence mode="popLayout">
            {(recent || []).map((tx) => (
              <motion.div
                key={tx?.id || Math.random()}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
                className="transform-gpu will-change-transform"
              >
                <SwipeTransactionRow
                  transaction={tx}
                  isGrouped
                  isOpen={openRowId === tx?.id}
                  onOpenChange={(v) => setOpenRowId(v ? tx?.id : null)}
                  onOpenDetail={() => open('txDetail', tx)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  hideBalance={hideBalance}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1c1c1e] border border-zinc-200 dark:border-white/10 p-6 shadow-2xl text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                {t('clear_confirm_title')}
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                {deletingTx?.merchant || deletingTx?.note || deletingTx?.description ? `"${deletingTx.merchant || deletingTx.note || deletingTx.description}" - ` : ''}{t('clear_confirm_body')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingTx(null)}
                className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold py-2.5 text-sm transition-all active:scale-95 cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="w-full rounded-xl bg-rose-600 text-white font-bold py-2.5 text-sm transition-all active:scale-95 cursor-pointer hover:bg-rose-700"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

