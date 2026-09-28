'use client'

import React, { useMemo } from 'react'
import { Eye, EyeOff, CreditCard, Wallet, Plus, Layers, Landmark, Banknote } from 'lucide-react'
import { getTheme, ACCOUNT_TYPES } from '@/lib/categories'
import { getCurrency } from '@/lib/currencies'
import { LogoBadge } from './ui'
import { cn } from '@/lib/utils'

// Deterministic last-4 digits
export function digits4(s) {
  let h = 0
  const str = String(s || 'paralar')
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return String(h % 10000).padStart(4, '0')
}

// Gold EMV Chip standar kartu fisik (dipertahankan untuk kompatibilitas preview)
export function EmvChip({ className = '', isLight = false }) {
  return (
    <div
      className={cn(
        'w-[32px] h-[24px] rounded-[3px] relative overflow-hidden shrink-0 select-none shadow-xs border border-amber-600/60 bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600',
        className
      )}
    >
      <div className="absolute inset-[1.5px] border border-amber-800/40 rounded-[2px]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-2 border border-amber-800/40 rounded-[1px] bg-amber-400/30" />
        <div className="absolute top-1/2 inset-x-0 h-px bg-amber-800/35 -translate-y-1/2" />
        <div className="absolute inset-y-0 left-[30%] w-px bg-amber-800/35" />
        <div className="absolute inset-y-0 right-[30%] w-px bg-amber-800/35" />
      </div>
    </div>
  )
}

// Contactless / NFC Wave Icon (kompatibilitas)
export function ContactlessWave({ className = '' }) {
  return (
    <svg className={cn('w-4 h-4 shrink-0', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M6.5 9a6 6 0 0 1 0 6" opacity="0.65" />
      <path d="M10.5 6a10 10 0 0 1 0 12" opacity="0.85" />
      <path d="M14.5 3a14 14 0 0 1 0 18" />
    </svg>
  )
}

// Network Logo (VISA or Mastercard) (kompatibilitas)
export function NetworkBadge({ network = 'visa', isLight = false, className = '' }) {
  if (network === 'mastercard') {
    return (
      <div className={cn('flex items-center -space-x-2 shrink-0', className)} title="Mastercard">
        <div className="w-5 h-5 rounded-full bg-[#EB001B] shadow-sm" />
        <div className="w-5 h-5 rounded-full bg-[#F79E1B] mix-blend-screen opacity-95 shadow-sm" />
      </div>
    )
  }
  return (
    <span
      className={cn(
        'font-black italic tracking-tighter text-sm shrink-0 font-sans select-none',
        isLight ? 'text-[#09090B] font-black' : 'text-white/95 drop-shadow-sm',
        className
      )}
    >
      VISA
    </span>
  )
}

// Backward-compatible Motif Texture
export function CardMotifTexture({ motif = 'parang', isLight = false }) {
  return <CardBelanjeTexture isLight={isLight} theme={motif} />
}

/**
 * Belanje Neo-Fintech Card Texture:
 * Gradient halus + pattern diagonal yang sangat samar — elegan, tidak norak.
 */
export function CardBelanjeTexture({ isLight = false, theme = 'obsidian' }) {
  const strokeColor = isLight ? '#09090B' : '#FFFFFF'

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* Pattern garis lengkung diagonal kontur yang sangat halus di sudut kanan atas */}
      <svg
        className="absolute -right-8 -top-12 w-[340px] h-[300px] pointer-events-none opacity-[0.08]"
        viewBox="0 0 260 230"
        fill="none"
        preserveAspectRatio="none"
      >
        <path d="M 30 0 C 110 35, 175 110, 240 220" stroke={strokeColor} strokeWidth="1.4" />
        <path d="M 70 0 C 140 45, 195 120, 240 180" stroke={strokeColor} strokeWidth="1.2" />
        <path d="M 110 0 C 170 55, 215 130, 240 145" stroke={strokeColor} strokeWidth="1" />
        <path d="M 5 0 C 90 30, 155 105, 220 230" stroke={strokeColor} strokeWidth="1.2" />
        <path d="M 150 0 C 195 60, 225 140, 240 115" stroke={strokeColor} strokeWidth="0.8" />
        <path d="M -15 20 C 65 60, 135 140, 195 230" stroke={strokeColor} strokeWidth="0.8" />
      </svg>

      {/* Subtle radial gloss in corner */}
      <div
        className={cn(
          'absolute -top-12 -right-12 w-52 h-52 rounded-full blur-3xl pointer-events-none',
          isLight ? 'bg-sky-400/10' : 'bg-white/[0.04]'
        )}
      />

      {/* Subtle diagonal sheen specular highlight */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.05] pointer-events-none" />

      {/* Specular hairline di tepi atas */}
      <div
        className={cn(
          'absolute inset-x-6 top-0 h-px pointer-events-none',
          isLight
            ? 'bg-gradient-to-r from-transparent via-white/80 to-transparent'
            : 'bg-gradient-to-r from-transparent via-white/25 to-transparent'
        )}
      />
    </div>
  )
}

/**
 * Tile Logo Bank / E-Wallet:
 * Rounded square (squircle) dengan logo bank jika ada, atau fallback ikon/monogram dari nama akun.
 */
export function CardLogoTile({ logo = null, name = '', type = 'bank', icon = 'card', theme = 'obsidian', isLight = false, className = '' }) {
  if (logo) {
    return (
      <div className={cn('shrink-0 select-none', className)}>
        <LogoBadge logoId={logo} size="md" className="rounded-xl shadow-xs" />
      </div>
    )
  }

  const lowerName = String(name || '').toLowerCase()
  if (lowerName.includes('maybank') || lowerName.includes('qwert')) {
    return <LogoBadge logoId="maybank" size="md" className={cn('rounded-xl shadow-xs shrink-0', className)} />
  }
  if (lowerName.includes('tng') || lowerName.includes('touch')) {
    return <LogoBadge logoId="tng" size="md" className={cn('rounded-xl shadow-xs shrink-0', className)} />
  }
  if (lowerName.includes('bca')) {
    return <LogoBadge logoId="bca" size="md" className={cn('rounded-xl shadow-xs shrink-0', className)} />
  }
  if (lowerName.includes('mandiri')) {
    return <LogoBadge logoId="mandiri" size="md" className={cn('rounded-xl shadow-xs shrink-0', className)} />
  }
  if (lowerName.includes('cimb')) {
    return <LogoBadge logoId="cimb" size="md" className={cn('rounded-xl shadow-xs shrink-0', className)} />
  }
  if (lowerName.includes('grab')) {
    return <LogoBadge logoId="grabpay" size="md" className={cn('rounded-xl shadow-xs shrink-0', className)} />
  }
  if (lowerName.includes('gopay')) {
    return <LogoBadge logoId="gopay" size="md" className={cn('rounded-xl shadow-xs shrink-0', className)} />
  }
  if (lowerName.includes('jago')) {
    return <LogoBadge logoId="jago" size="md" className={cn('rounded-xl shadow-xs shrink-0', className)} />
  }

  // Tipe Cash
  if (type === 'cash' || icon === 'cash' || lowerName.includes('cash') || lowerName.includes('tunai')) {
    return (
      <div
        className={cn(
          'h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center border shrink-0 shadow-xs select-none',
          isLight
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700'
            : 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400',
          className
        )}
      >
        <Banknote size={20} strokeWidth={1.75} />
      </div>
    )
  }

  // Tipe E-Wallet
  if (type === 'ewallet' || icon === 'wallet' || lowerName.includes('wallet')) {
    return (
      <div
        className={cn(
          'h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center border shrink-0 shadow-xs select-none',
          isLight
            ? 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-700'
            : 'bg-fuchsia-500/15 border-fuchsia-500/25 text-fuchsia-300',
          className
        )}
      >
        <Wallet size={19} strokeWidth={1.75} />
      </div>
    )
  }

  // Fallback monogram dari nama akun (2 huruf besar) dengan tile style ala Belanje
  const words = String(name || '').trim().split(/\s+/).filter(Boolean)
  const monogram = words.length > 1
    ? `${words[0][0]}${words[1][0]}`.toUpperCase()
    : (words[0] || 'PA').slice(0, 2).toUpperCase()

  let tileStyle = isLight
    ? 'bg-zinc-950/5 border-zinc-300 text-zinc-900'
    : 'bg-white/10 border-white/20 text-white'

  if (theme === 'plum' || lowerName === 'leh') {
    tileStyle = 'bg-rose-500/20 border-rose-400/30 text-rose-200'
  } else if (theme === 'indigo' || lowerName.includes('qwert')) {
    tileStyle = 'bg-amber-400 border-amber-500/40 text-zinc-950 font-black'
  } else if (theme === 'glacier') {
    tileStyle = 'bg-[#005eb8] border-blue-400/30 text-white'
  }

  return (
    <div
      className={cn(
        'h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center border shrink-0 font-extrabold text-[12px] sm:text-[13px] tracking-tight shadow-xs select-none',
        tileStyle,
        className
      )}
      title={name || 'Account'}
    >
      {monogram}
    </div>
  )
}

/**
 * Helper untuk memecah string format uang menjadi prefix simbol dan angka nominal
 * Misal: "Rp 555" -> prefix "Rp", digits "555"
 */
export function splitFormattedAmount(raw, fallbackCurrency = '') {
  if (!raw) return { prefix: fallbackCurrency, digits: '0' }
  const str = String(raw).trim()
  const m = str.match(/^(-?[^\d\s]+)\s*(.+)$/)
  if (m) {
    return { prefix: m[1], digits: m[2] }
  }
  return { prefix: fallbackCurrency, digits: str }
}

/**
 * BankCard — Desain Kartu Neo-Fintech Paralar (mengikuti gaya kartu Belanje)
 */
export function BankCard({
  name,
  balance = 0,
  currency = 'USD',
  theme = 'obsidian',
  logo = null,
  icon = 'card',
  type = 'bank',
  id = null,
  fmt = null,
  className = '',
  hideBalance = false,
  onToggleHideBalance = null,
  income = 0,
  spending = 0,
  hintText = 'TAP FOR PULSE',
  approxHome = null,
  isCollapsed = false,
  showOcclusionShadow = true,
  flat = false,
  onClick = null,
  onHintClick = null,
  style = {},
}) {
  const th = getTheme(theme)
  const cur = getCurrency(currency)
  const isCardLight = Boolean(th?.isLight || theme === 'glacier' || theme === 'white')

  // Label tipe (BANK / E-WALLET / CASH / OVERVIEW)
  const typeLabel = useMemo(() => {
    if (type === 'overview' || type === 'total') return 'OVERVIEW'
    const found = ACCOUNT_TYPES.find((x) => x.id === type)
    if (found?.label) return found.label.toUpperCase()
    return String(type || 'ACCOUNT').toUpperCase()
  }, [type])

  // Gradient warna kartu mengikuti konsep Paralar & referensi Belanje
  const bgGradientCls = useMemo(() => {
    if (isCardLight) {
      // Glacier / Ice-Blue (Screenshot 3 / TnG di video)
      return 'bg-gradient-to-br from-[#dff2fe] via-[#e8f5fe] to-[#cfe8fc] text-[#09090B]'
    }

    const t = String(theme || '').toLowerCase()
    const accType = String(type || '').toLowerCase()

    if (t === 'plum' || accType === 'ewallet') {
      // Plum / Wine gelap (Screenshot 1 / leh di video)
      return 'bg-gradient-to-br from-[#201220] via-[#140b15] to-[#0c070e] text-white'
    }

    if (t === 'indigo' || (accType === 'bank' && t !== 'obsidian')) {
      // Indigo / Midnight Charcoal (Screenshot 2 / Qwert di video)
      return 'bg-gradient-to-br from-[#131222] via-[#0d0c18] to-[#080710] text-white'
    }

    if (t === 'spider') {
      return 'bg-gradient-to-br from-[#2b0c12] via-[#18060a] to-[#0d0305] text-white'
    }

    if (t === 'matrix') {
      return 'bg-gradient-to-br from-[#0c181f] via-[#081014] to-[#04080a] text-white'
    }

    if (t === 'parang') {
      return 'bg-gradient-to-br from-[#181510] via-[#110e0a] to-[#090705] text-white'
    }

    // Base Paralar Obsidian / Charcoal default (Main account di video)
    return 'bg-gradient-to-br from-[#161619] via-[#0f0f12] to-[#09090b] text-white'
  }, [isCardLight, theme, type])

  // Typographic colors
  const titleCls = isCardLight ? 'text-zinc-950' : 'text-white'
  const subCls = isCardLight ? 'text-zinc-600' : 'text-zinc-400'
  const wordmarkCls = isCardLight ? 'text-zinc-900/40' : 'text-white/40'
  const dividerCls = isCardLight ? 'bg-zinc-900/15' : 'bg-white/15'
  const hintCls = isCardLight ? 'text-zinc-700/60' : 'text-white/40'
  const eyeBtnCls = isCardLight
    ? 'text-zinc-700/70 hover:text-zinc-950'
    : 'text-white/50 hover:text-white'

  // Format Saldo & Pisahkan Simbol
  const { prefix: currencyPrefix, digits: balanceDigits } = useMemo(() => {
    const raw = fmt ? fmt(balance ?? 0, currency) : `${cur?.symbol || currency} ${Number(balance || 0).toLocaleString()}`
    return splitFormattedAmount(raw, cur?.symbol || currency)
  }, [fmt, balance, currency, cur?.symbol])

  // Format Income & Spending
  const formattedIncome = useMemo(() => {
    return fmt ? fmt(income ?? 0, currency) : `${cur?.symbol || currency} ${Number(income || 0).toLocaleString()}`
  }, [fmt, income, currency, cur?.symbol])

  const formattedSpending = useMemo(() => {
    return fmt ? fmt(spending ?? 0, currency) : `${cur?.symbol || currency} ${Number(spending || 0).toLocaleString()}`
  }, [fmt, spending, currency, cur?.symbol])

  // Border & Shadow
  const topBorderCls = isCardLight
    ? 'border-t border-t-white/80 border-sky-300/40'
    : 'border-t border-t-white/20 border-white/10'

  const shadowCls = (!flat && showOcclusionShadow)
    ? 'shadow-[0_1px_2px_rgba(16,16,20,0.06),0_18px_38px_-12px_rgba(16,16,20,0.32)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_18px_38px_-12px_rgba(0,0,0,0.65)]'
    : 'shadow-none'

  return (
    <div
      onClick={onClick}
      style={style}
      className={cn(
        'w-full aspect-[1.58/1] min-h-[195px] max-h-[235px] rounded-[28px] p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between shrink-0 select-none transform-gpu will-change-transform',
        bgGradientCls,
        topBorderCls,
        shadowCls,
        className
      )}
    >
      {/* 1) Gradient halus + pattern diagonal yang samar */}
      <CardBelanjeTexture isLight={isCardLight} theme={theme} />

      {/* 2) Header Kiri Atas & Kanan Atas */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        {/* Kiri Atas: Tile Logo Bank + Nama Akun + Label Tipe */}
        <div className="flex items-center gap-3 min-w-0">
          <CardLogoTile logo={logo} name={name} type={type} icon={icon} theme={theme} isLight={isCardLight} />
          <div className="flex flex-col justify-center min-w-0">
            <p className={cn('font-bold text-base sm:text-lg tracking-tight leading-tight truncate', titleCls)}>
              {name || '—'}
            </p>
            <span className={cn('text-[10px] font-semibold uppercase tracking-[0.16em] leading-none mt-1 select-none', subCls)}>
              {typeLabel}
            </span>
          </div>
        </div>

        {/* Kanan Atas: Wordmark PARALAR kecil caps */}
        <span className={cn('text-[10px] font-bold uppercase tracking-[0.25em] select-none shrink-0', wordmarkCls)}>
          PARALAR
        </span>
      </div>

      {/* 3) Bagian Tengah: Label BALANCE + Eye Toggle + Nominal Besar Bold */}
      <div className="relative z-10 my-auto py-1">
        <div className="flex items-center gap-1.5 select-none">
          <span className={cn('text-[10px] font-semibold uppercase tracking-[0.16em]', subCls)}>
            BALANCE
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleHideBalance?.()
            }}
            className={cn('h-5 w-5 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer', eyeBtnCls)}
            aria-label="Toggle nominal saldo"
          >
            {hideBalance ? <EyeOff size={13} strokeWidth={1.8} /> : <Eye size={13} strokeWidth={1.8} />}
          </button>
        </div>

        <div className="flex items-baseline gap-1 mt-1 truncate">
          {hideBalance ? (
            <span className={cn('text-3xl sm:text-[34px] font-extrabold tracking-tight tabular-nums select-none', titleCls)}>
              ••••••
            </span>
          ) : (
            <>
              <span className={cn('text-base sm:text-lg font-bold opacity-80 shrink-0 select-none mr-1', titleCls)}>
                {currencyPrefix}
              </span>
              <span className={cn('text-3xl sm:text-[34px] font-extrabold tracking-tight tabular-nums truncate select-none', titleCls)}>
                {balanceDigits}
              </span>
            </>
          )}
        </div>

        {approxHome && !hideBalance ? (
          <p className={cn('text-[11px] font-medium mt-0.5 truncate opacity-70', subCls)}>
            {String(approxHome).startsWith('≈') ? approxHome : `≈ ${approxHome}`}
          </p>
        ) : null}
      </div>

      {/* 4) Section Bawah Dua Kolom: INCOME | SPENDING + Kanan Bawah: Teks Hint */}
      <div className="flex items-end justify-between relative z-10 pt-2 border-t border-current/10">
        <div className="flex items-center min-w-0">
          {/* Kolom Income */}
          <div className="min-w-0">
            <span className={cn('text-[9px] font-semibold uppercase tracking-[0.14em] block select-none', subCls)}>
              INCOME
            </span>
            <span className={cn('text-xs sm:text-sm font-bold tabular-nums block mt-0.5 truncate', titleCls)}>
              {hideBalance ? '••••' : formattedIncome}
            </span>
          </div>

          {/* Divider Vertikal di Tengah */}
          <div className={cn('h-6 w-px mx-3 sm:mx-4 shrink-0', dividerCls)} />

          {/* Kolom Spending */}
          <div className="min-w-0">
            <span className={cn('text-[9px] font-semibold uppercase tracking-[0.14em] block select-none', subCls)}>
              SPENDING
            </span>
            <span className={cn('text-xs sm:text-sm font-bold tabular-nums block mt-0.5 truncate', titleCls)}>
              {hideBalance ? '••••' : formattedSpending}
            </span>
          </div>
        </div>

        {/* Kanan Bawah: Teks Hint Kecil Caps yang Elegan */}
        <div className="flex items-center shrink-0 self-end mb-0.5 pl-2">
          <span
            onClick={(e) => {
              if (onHintClick) {
                e.stopPropagation()
                onHintClick()
              }
            }}
            className={cn(
              'text-[9px] font-semibold uppercase tracking-[0.18em] select-none hover:opacity-90 transition-opacity',
              hintCls,
              onHintClick && 'cursor-pointer'
            )}
          >
            {hintText || 'TAP FOR PULSE'}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * ManageCardsCard — Kartu ke-5 (terakhir) pada carousel Home (Frame 00:04 - 00:05 video).
 * Menampilkan ringkasan AVAILABLE FUNDS, tombol bulat (+) Manage cards, dan hint TAP TO OPEN.
 */
export function ManageCardsCard({
  totalBalance = 0,
  currency = 'IDR',
  fmt = null,
  hideBalance = false,
  onToggleHideBalance = null,
  onClick = null,
  className = '',
}) {
  const { prefix: currencyPrefix, digits: balanceDigits } = useMemo(() => {
    const raw = fmt ? fmt(totalBalance ?? 0, currency) : `Rp ${Number(totalBalance || 0).toLocaleString()}`
    return splitFormattedAmount(raw, currency)
  }, [fmt, totalBalance, currency])

  return (
    <div
      onClick={onClick}
      className={cn(
        'w-full aspect-[1.58/1] min-h-[195px] max-h-[235px] rounded-[28px] p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between shrink-0 select-none transform-gpu will-change-transform cursor-pointer',
        'bg-white dark:bg-[#121214] text-foreground border border-zinc-200/80 dark:border-white/10 shadow-xs active:scale-[0.99] transition-transform',
        className
      )}
    >
      {/* Specular hairline di atas */}
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-zinc-950/10 dark:via-white/20 to-transparent pointer-events-none" />

      {/* Header: AVAILABLE FUNDS + Eye + Wordmark PARALAR */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <div className="flex items-center gap-1.5 select-none">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              AVAILABLE FUNDS
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleHideBalance?.()
              }}
              className="h-4.5 w-4.5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {hideBalance ? <EyeOff size={12} strokeWidth={2} /> : <Eye size={12} strokeWidth={2} />}
            </button>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            {hideBalance ? (
              <span className="text-2xl sm:text-[26px] font-extrabold tracking-tight tabular-nums text-foreground">
                ••••••••
              </span>
            ) : (
              <>
                <span className="text-sm font-bold text-muted-foreground mr-0.5">
                  {currencyPrefix}
                </span>
                <span className="text-2xl sm:text-[28px] font-extrabold tracking-tight tabular-nums text-foreground">
                  {balanceDigits}
                </span>
              </>
            )}
          </div>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/50 select-none">
          PARALAR
        </span>
      </div>

      {/* Center: Tombol Bundar (+) Manage cards + Subteks */}
      <div className="flex flex-col items-center justify-center relative z-10 py-1 my-auto">
        <div className="w-11 h-11 rounded-full border border-border/80 bg-muted/40 dark:bg-white/5 flex items-center justify-center text-foreground shadow-2xs group-hover:scale-105 transition-transform">
          <Plus size={19} strokeWidth={2.2} />
        </div>
        <p className="font-bold text-sm sm:text-base text-foreground mt-2 tracking-tight">
          Manage cards
        </p>
        <p className="text-[11px] text-muted-foreground text-center mt-0.5">
          Add, reorder & customise your accounts
        </p>
      </div>

      {/* Footer kanan: TAP TO OPEN */}
      <div className="flex items-center justify-end relative z-10 pt-1">
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80 select-none">
          TAP TO OPEN
        </span>
      </div>
    </div>
  )
}

/**
 * OverallBalanceCard — Kartu summary di bagian bawah Wallet modal (Frame 00:07 - 00:08 video).
 */
export function OverallBalanceCard({
  totalBalance = 0,
  currency = 'IDR',
  accountCount = 0,
  fmt = null,
  hideBalance = false,
  onToggleHideBalance = null,
  onClick = null,
  className = '',
}) {
  const { prefix: currencyPrefix, digits: balanceDigits } = useMemo(() => {
    const raw = fmt ? fmt(totalBalance ?? 0, currency) : `Rp ${Number(totalBalance || 0).toLocaleString()}`
    return splitFormattedAmount(raw, currency)
  }, [fmt, totalBalance, currency])

  return (
    <div
      onClick={onClick}
      className={cn(
        'w-full aspect-[1.58/1] min-h-[195px] max-h-[235px] rounded-[28px] p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between shrink-0 select-none transform-gpu will-change-transform text-white border border-white/10 bg-gradient-to-br from-[#161619] via-[#0f0f12] to-[#09090b] shadow-lg',
        className
      )}
    >
      <CardBelanjeTexture isLight={false} theme="obsidian" />

      {/* Header: Left Tile with deck icon + Overall balance + Subtitle; Right: PARALAR */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Layers size={19} strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-bold text-base sm:text-lg text-white tracking-tight leading-tight">
              Overall balance
            </p>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50 leading-none mt-1 block">
              PERSONAL OVERVIEW
            </span>
          </div>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 select-none">
          PARALAR
        </span>
      </div>

      {/* Middle: AVAILABLE FUNDS + Eye + Big Amount */}
      <div className="relative z-10 my-auto py-1">
        <div className="flex items-center gap-1.5 select-none">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
            AVAILABLE FUNDS
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleHideBalance?.()
            }}
            className="h-5 w-5 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            {hideBalance ? <EyeOff size={13} strokeWidth={1.8} /> : <Eye size={13} strokeWidth={1.8} />}
          </button>
        </div>

        <div className="flex items-baseline gap-1 mt-1 truncate">
          {hideBalance ? (
            <span className="text-3xl sm:text-[34px] font-extrabold tracking-tight tabular-nums text-white">
              ••••••••
            </span>
          ) : (
            <>
              <span className="text-base sm:text-lg font-bold opacity-80 shrink-0 select-none mr-1 text-white">
                {currencyPrefix}
              </span>
              <span className="text-3xl sm:text-[34px] font-extrabold tracking-tight tabular-nums truncate select-none text-white">
                {balanceDigits}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Bottom: ACCOUNTS • count | TAP FOR DETAILS */}
      <div className="flex items-center justify-between relative z-10 pt-2 border-t border-white/10">
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/50">
          ACCOUNTS • {accountCount}
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">
          TAP FOR DETAILS
        </span>
      </div>
    </div>
  )
}

export default BankCard
