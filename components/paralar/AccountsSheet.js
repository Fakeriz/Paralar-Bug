'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Reorder, motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  ArrowUpDown,
  CreditCard,
  X,
  Layers,
  Sparkles,
  Shield,
  Wallet as WalletIcon,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from './context'
import { BankCard } from './BankCard'
import ExtrudedDeck3D from './ExtrudedDeck3D'
import { EmptyState } from './ui'
import { CARD_THEMES, ACCOUNT_TYPES } from '@/lib/categories'
import { cn } from '@/lib/utils'

export default function AccountsSheet({ open, onClose }) {
  const {
    t = (k) => k,
    accounts = [],
    setAccounts,
    fmt,
    store,
    refresh,
    open: openSheet,
    session,
  } = useApp()

  const scope = session?.user?.id || 'guest'
  const orderKey = `paralar_accounts_order_${scope}`
  const lockedKey = `paralar_accounts_locked_${scope}`

  // State: Ordered accounts & active selection
  const [orderedAccounts, setOrderedAccounts] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [viewMode, setViewMode] = useState('3d') // '3d' | 'list'
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const [sortIndex, setSortIndex] = useState(0)
  const [isLockedMap, setIsLockedMap] = useState({})

  // Ref to track latest reordered accounts for drag completion
  const orderedAccountsRef = useRef(orderedAccounts)
  useEffect(() => {
    orderedAccountsRef.current = orderedAccounts
  }, [orderedAccounts])

  // Modals inside full-page wallet
  const [editingAccount, setEditingAccount] = useState(null)
  const [deletingAccount, setDeletingAccount] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editTheme, setEditTheme] = useState('obsidian')
  const [editType, setEditType] = useState('bank')

  // Load frozen/locked card map
  useEffect(() => {
    try {
      const raw = localStorage.getItem(lockedKey)
      if (raw) setIsLockedMap(JSON.parse(raw))
    } catch {}
  }, [lockedKey])

  // Toggle freeze/lock status
  const handleToggleLock = useCallback(
    (id) => {
      if (!id) return
      setIsLockedMap((prev) => {
        const next = { ...prev, [id]: !prev[id] }
        try {
          localStorage.setItem(lockedKey, JSON.stringify(next))
        } catch {}
        if (next[id]) {
          toast.info('Kartu berhasil dibekukan (Locked)')
        } else {
          toast.success('Kartu dibuka kuncinya (Active)')
        }
        return next
      })
    },
    [lockedKey]
  )

  // Sync ordered accounts with incoming accounts & preserved localStorage order
  useEffect(() => {
    if (!Array.isArray(accounts)) return

    let savedOrder = []
    try {
      const raw = localStorage.getItem(orderKey)
      if (raw) savedOrder = JSON.parse(raw)
    } catch {}

    if (Array.isArray(savedOrder) && savedOrder.length > 0) {
      const sorted = [...accounts].sort((a, b) => {
        const ia = savedOrder.indexOf(a.id)
        const ib = savedOrder.indexOf(b.id)
        if (ia === -1 && ib === -1) return 0
        if (ia === -1) return 1
        if (ib === -1) return -1
        return ia - ib
      })
      setOrderedAccounts(sorted)
    } else {
      setOrderedAccounts(accounts)
    }
  }, [accounts, orderKey])

  // Ensure activeIndex is always within valid bounds
  useEffect(() => {
    if (activeIndex >= (orderedAccounts?.length || 0)) {
      setActiveIndex(Math.max(0, (orderedAccounts?.length || 1) - 1))
    }
  }, [orderedAccounts, activeIndex])

  // Body scroll lock management with safe cleanup
  useEffect(() => {
    if (!open) return

    document.body.style.overflow = 'hidden'
    document.body.setAttribute('data-paralar-sheet-open', 'true')
    try {
      window.dispatchEvent(new CustomEvent('paralar-sheet-toggle', { detail: { open: true } }))
    } catch {}

    return () => {
      document.body.style.overflow = ''
      document.body.removeAttribute('data-paralar-sheet-open')
      try {
        window.dispatchEvent(new CustomEvent('paralar-sheet-toggle', { detail: { open: false } }))
      } catch {}
    }
  }, [open])

  // Lightweight reorder handler
  const handleReorder = useCallback((newOrder) => {
    setOrderedAccounts(newOrder || [])
  }, [])

  // Commit order to persistent storage
  const commitOrder = useCallback(
    (finalOrder) => {
      if (!Array.isArray(finalOrder)) return
      try {
        const ids = finalOrder.map((a) => a.id)
        localStorage.setItem(orderKey, JSON.stringify(ids))
      } catch {}

      if (typeof setAccounts === 'function') {
        setAccounts(finalOrder)
      }
    },
    [orderKey, setAccounts]
  )

  // Sort shortcut cycle
  const sortOptions = [
    { label: '↓↑ Urutkan', fn: null },
    { label: 'Saldo Tertinggi', fn: (a, b) => (Number(b.balance) || 0) - (Number(a.balance) || 0) },
    { label: 'Saldo Terendah', fn: (a, b) => (Number(a.balance) || 0) - (Number(b.balance) || 0) },
    { label: 'Nama A-Z', fn: (a, b) => (a.name || '').localeCompare(b.name || '') },
  ]

  const handleSortCycle = () => {
    const nextIdx = (sortIndex + 1) % sortOptions.length
    setSortIndex(nextIdx)
    const opt = sortOptions[nextIdx]
    if (opt.fn) {
      const sorted = [...orderedAccounts].sort(opt.fn)
      setOrderedAccounts(sorted)
      commitOrder(sorted)
      toast.success(`Diurutkan: ${opt.label}`)
    } else {
      const original = [...accounts]
      setOrderedAccounts(original)
      commitOrder(original)
      toast.info('Urutan kartu dikembalikan semula')
    }
  }

  // Active account in 3D deck
  const activeAccount = useMemo(() => {
    const list = orderedAccounts || []
    return list[activeIndex] || list[0] || null
  }, [orderedAccounts, activeIndex])

  // Open Edit Modal
  const handleEdit = (a) => {
    if (!a) return
    setEditingAccount(a)
    setEditName(a.name || '')
    setEditTheme(a.theme || 'obsidian')
    setEditType(a.type || 'bank')
  }

  // Save Edit
  const saveEdit = async () => {
    if (!editingAccount || !editName.trim()) return
    setSavingEdit(true)
    try {
      const patch = {
        name: editName.trim(),
        theme: editTheme,
        type: editType,
      }
      if (store?.updateAccount) {
        await store.updateAccount(editingAccount.id, patch)
      }
      if (refresh) await refresh()
      setEditingAccount(null)
      toast.success(t('saved_msg') || 'Perubahan disimpan')
    } catch (e) {
      toast.error(e?.message || t('error'))
    } finally {
      setSavingEdit(false)
    }
  }

  // Delete Account
  const confirmDelete = async () => {
    if (!deletingAccount?.id) return
    const id = deletingAccount.id
    setDeletingAccount(null)
    try {
      if (store?.deleteAccount) {
        await store.deleteAccount(id)
      }
      if (refresh) await refresh()
      const updated = (orderedAccounts || []).filter((x) => x.id !== id)
      setOrderedAccounts(updated)
      commitOrder(updated)
      if (activeIndex >= updated.length) {
        setActiveIndex(Math.max(0, updated.length - 1))
      }
      toast.success(t('deleted') || 'Akun berhasil dihapus')
    } catch (e) {
      toast.error(e?.message || t('error'))
    }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 30, mass: 0.8 }}
        className="h-[100dvh] w-full fixed inset-0 z-50 bg-background flex flex-col overflow-hidden select-none transform-gpu will-change-transform"
      >
        {/* ======================================================================
            1. NAVIGASI ATAS (LIQUID GLASS HEADER)
           ====================================================================== */}
        <div className="pt-safe safe-top shrink-0 bg-background/95 backdrop-blur-md z-30 border-b border-border/40">
          <div className="flex items-center justify-between px-5 h-14">
            {/* Kiri: Teks "Selesai" untuk menutup */}
            <button
              type="button"
              onClick={onClose}
              className="text-[15px] font-semibold text-zinc-950 dark:text-white hover:opacity-70 transition-opacity cursor-pointer py-1 pr-2"
              data-testid="wallet-done-btn"
            >
              {t('done') || 'Selesai'}
            </button>

            {/* Tengah: Judul "Wallet" */}
            <h1 className="text-base font-bold text-foreground tracking-tight text-center">
              {t('wallet') || 'Wallet'}
            </h1>

            {/* Kanan: Ikon "+" untuk tambah kartu */}
            <button
              type="button"
              onClick={() => {
                onClose?.()
                setTimeout(() => openSheet('newAccount'), 120)
              }}
              className="h-8 w-8 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center transition-transform active:scale-95 shadow-sm cursor-pointer"
              aria-label="Add account"
              data-testid="wallet-add-btn"
            >
              <Plus size={18} strokeWidth={2.4} />
            </button>
          </div>

          {/* Sub-header: View Mode Switcher (3D Extruded Deck vs List Reorder) */}
          <div className="flex items-center justify-between px-5 pb-3 pt-0.5">
            <div className="flex items-center gap-1 p-0.5 bg-muted/60 rounded-xl border border-border/30">
              <button
                type="button"
                onClick={() => setViewMode('3d')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  viewMode === '3d'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                data-testid="wallet-view-3d-btn"
              >
                <Sparkles size={12} strokeWidth={2.2} />
                <span>3D Deck</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  viewMode === 'list'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                data-testid="wallet-view-list-btn"
              >
                <Layers size={12} strokeWidth={2} />
                <span>Semua ({orderedAccounts?.length || 0})</span>
              </button>
            </div>

            {viewMode === 'list' && (
              <button
                type="button"
                onClick={handleSortCycle}
                className="text-xs font-semibold text-foreground/80 hover:text-foreground flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted transition-colors active:scale-95 cursor-pointer"
                data-testid="wallet-sort-btn"
              >
                <ArrowUpDown size={12} strokeWidth={2} />
                <span>{sortOptions[sortIndex]?.label || 'Urutkan'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ======================================================================
            2. KONTEN UTAMA: EMPTY STATE ATAU CARD DECK
           ====================================================================== */}
        {(orderedAccounts || []).length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <EmptyState
              icon={CreditCard}
              title={t('no_transactions') || 'Belum ada kartu'}
              subtitle={t('new_account') || 'Tambah kartu atau rekening pertama Anda'}
            />
            <button
              type="button"
              onClick={() => {
                onClose?.()
                setTimeout(() => openSheet('newAccount'), 120)
              }}
              className="mt-6 flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold text-sm shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={18} strokeWidth={2.2} />
              <span>{t('new_account') || 'Tambah Akun'}</span>
            </button>
          </div>
        ) : viewMode === '3d' ? (
          /* ======================================================================
              MODE 1: DEPTH STACK 3D (EXTRUDED 3D DECK)
             ====================================================================== */
          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col items-center px-4 pb-32 pt-2">
            {/* 3D Extruded Card Deck Engine */}
            <ExtrudedDeck3D
              accounts={orderedAccounts}
              activeIndex={activeIndex}
              onSelectIndex={(idx) => setActiveIndex(idx)}
              fmt={fmt}
              isLockedMap={isLockedMap}
              onToggleLock={handleToggleLock}
            />

            {/* Active Card Detail Panel & Management Actions */}
            {activeAccount && (
              <motion.div
                key={activeAccount.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-[390px] mt-6 space-y-4"
              >
                {/* Account Details Box */}
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                        Nama Rekening / Akun
                      </span>
                      <h3 className="font-bold text-base text-foreground mt-0.5">
                        {activeAccount.name || '—'}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                        Status Kartu
                      </span>
                      <div className="flex items-center gap-1.5 justify-end mt-0.5">
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full',
                            isLockedMap?.[activeAccount.id] ? 'bg-amber-500' : 'bg-emerald-500'
                          )}
                        />
                        <span className="text-xs font-bold text-foreground">
                          {isLockedMap?.[activeAccount.id] ? 'Terkunci' : 'Aktif'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-border/40" />

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tipe Akun</span>
                    <span className="font-semibold text-foreground uppercase tracking-wider">
                      {activeAccount.type || 'Bank'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Mata Uang</span>
                    <span className="font-semibold text-foreground font-mono">
                      {activeAccount.currency || 'USD'}
                    </span>
                  </div>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleEdit(activeAccount)}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-foreground font-bold text-xs transition active:scale-95 cursor-pointer"
                    data-testid={`deck3d-edit-btn-${activeAccount.id}`}
                  >
                    <Pencil size={15} />
                    <span>{t('edit') || 'Ubah Akun'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingAccount(activeAccount)}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs transition active:scale-95 cursor-pointer"
                    data-testid={`deck3d-delete-btn-${activeAccount.id}`}
                  >
                    <Trash2 size={15} />
                    <span>{t('delete') || 'Hapus Akun'}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          /* ======================================================================
              MODE 2: DAFTAR KARTU DENGAN DRAG-TO-REORDER
             ====================================================================== */
          <Reorder.Group
            axis="y"
            values={orderedAccounts}
            onReorder={handleReorder}
            className="relative flex flex-col px-5 pt-3 pb-56 overflow-y-auto flex-1 no-scrollbar touch-pan-y"
          >
            {orderedAccounts.map((a, index) => {
              const isSelected = selectedCardId === a.id || (orderedAccounts.length === 1 && !draggingId)
              const isDragging = draggingId === a.id
              const selectedIndex = orderedAccounts.findIndex((item) => item.id === selectedCardId)

              const targetY = (() => {
                if (selectedCardId === null || orderedAccounts.length <= 1) return 0
                if (index === selectedIndex) return -12
                if (index > selectedIndex) return 245
                return 0
              })()

              const cardZIndex = isDragging ? 60 : isSelected ? 50 : index + 1

              return (
                <Reorder.Item
                  key={a.id}
                  value={a}
                  onDragStart={() => {
                    setDraggingId(a.id)
                    if (selectedCardId) setSelectedCardId(null)
                  }}
                  onDragEnd={() => {
                    setDraggingId(null)
                    commitOrder(orderedAccountsRef.current)
                  }}
                  whileDrag={{
                    scale: 1.03,
                    cursor: 'grabbing',
                  }}
                  style={{
                    zIndex: cardZIndex,
                  }}
                  className={cn(
                    'relative select-none transform-gpu will-change-transform',
                    orderedAccounts.length === 1 ? 'h-auto mb-6' : 'h-[56px]',
                    isDragging && 'shadow-2xl z-60'
                  )}
                  data-testid={`wallet-card-item-${a.id}`}
                >
                  <motion.div
                    animate={{ y: targetY }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28, mass: 0.8 }}
                    style={{
                      zIndex: cardZIndex,
                    }}
                    className="relative w-full transform-gpu will-change-transform"
                  >
                    <BankCard
                      name={a.name}
                      balance={a.balance}
                      currency={a.currency}
                      theme={a.theme}
                      logo={a.logo}
                      icon={a.icon}
                      type={a.type}
                      id={a.id}
                      fmt={fmt}
                      isCollapsed={!isSelected}
                      onClick={() => {
                        if (orderedAccounts.length > 1) {
                          setSelectedCardId(isSelected ? null : a.id)
                        }
                      }}
                      className={cn(
                        'cursor-pointer active:scale-[0.99] transition-shadow',
                        isSelected && 'ring-2 ring-white/20'
                      )}
                    />

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 28, mass: 0.8 }}
                          className="flex items-center justify-between gap-2.5 mt-3.5 mb-2 px-1"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingAccount(a)
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold active:scale-95 transition cursor-pointer"
                            data-testid={`wallet-delete-${a.id}`}
                          >
                            <Trash2 size={14} />
                            <span>{t('delete') || 'Hapus'}</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(a)
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-foreground text-xs font-bold active:scale-95 transition cursor-pointer"
                              data-testid={`wallet-edit-${a.id}`}
                            >
                              <Pencil size={14} />
                              <span>{t('edit') || 'Ubah'}</span>
                            </button>

                            {orderedAccounts.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedCardId(null)
                                }}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold active:scale-95 transition cursor-pointer shadow-xs"
                                data-testid={`wallet-collapse-${a.id}`}
                              >
                                <Check size={14} strokeWidth={2.5} />
                                <span>{t('done') || 'Selesai'}</span>
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Reorder.Item>
              )
            })}
          </Reorder.Group>
        )}

        {/* ======================================================================
            MODAL EDIT AKUN / KARTU
           ====================================================================== */}
        {editingAccount && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#121214] border border-zinc-200 dark:border-white/10 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                  {t('edit') || 'Ubah'} {editingAccount.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Input Nama Akun */}
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('account_name') || 'Nama Akun'}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-zinc-100 dark:bg-[#1c1c1e] border border-zinc-200 dark:border-white/10 text-sm font-semibold text-foreground outline-none focus:border-zinc-400 dark:focus:border-white/20"
                />
              </div>

              {/* Pilihan Tema Kartu Solid */}
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('theme') || 'Tema Kartu'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CARD_THEMES.map((th) => {
                    const active = editTheme === th.id
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => setEditTheme(th.id)}
                        className={cn(
                          'p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer',
                          active
                            ? 'border-zinc-950 dark:border-white ring-2 ring-zinc-950/20 dark:ring-white/20'
                            : 'border-zinc-200 dark:border-white/10 hover:border-zinc-400'
                        )}
                      >
                        <div className={cn('w-full h-6 rounded-md shadow-xs', th.swatchClass)} />
                        <span className="text-[10px] font-bold truncate max-w-full text-foreground">
                          {th.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Pilihan Tipe Akun */}
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('account_type') || 'Tipe Akun'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {ACCOUNT_TYPES.map((ty) => (
                    <button
                      key={ty.id}
                      type="button"
                      onClick={() => setEditType(ty.id)}
                      className={cn(
                        'py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                        editType === ty.id
                          ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {ty.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tombol Simpan & Batal */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold py-2.5 text-xs transition active:scale-95 cursor-pointer"
                >
                  {t('cancel') || 'Batal'}
                </button>
                <button
                  type="button"
                  disabled={savingEdit || !editName.trim()}
                  onClick={saveEdit}
                  className="w-full rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold py-2.5 text-xs transition active:scale-95 cursor-pointer disabled:opacity-40"
                >
                  {savingEdit ? 'Menyimpan...' : t('save') || 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================
            MODAL KONFIRMASI HAPUS AKUN
           ====================================================================== */}
        {deletingAccount && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#121214] border border-zinc-200 dark:border-white/10 p-6 shadow-2xl text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                <Trash2 size={26} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                  {t('delete_account') || 'Hapus Akun'} "{deletingAccount.name}"?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  Semua transaksi yang tertaut dengan akun ini mungkin terpengaruh. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeletingAccount(null)}
                  className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold py-2.5 text-xs transition active:scale-95 cursor-pointer"
                >
                  {t('cancel') || 'Batal'}
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="w-full rounded-xl bg-rose-600 text-white font-bold py-2.5 text-xs transition active:scale-95 cursor-pointer hover:bg-rose-700"
                >
                  {t('delete') || 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
