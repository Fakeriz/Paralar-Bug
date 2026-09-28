'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Lock, Copy, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { getTheme, ACCOUNT_TYPES } from '@/lib/categories'
import { getCurrency } from '@/lib/currencies'
import { LogoBadge } from './ui'
import { cn } from '@/lib/utils'

// Deterministic 16-digit card number generator from account ID/name
export function generateCardNumber(id = '', name = '') {
  let h1 = 0
  let h2 = 0
  const s = String(id || name || 'paralar-vault')
  for (let i = 0; i < s.length; i++) {
    h1 = (h1 * 31 + s.charCodeAt(i)) >>> 0
    h2 = (h2 * 37 + s.charCodeAt(i) * (i + 1)) >>> 0
  }
  const part1 = '4' + String(h1 % 1000).padStart(3, '5')
  const part2 = String((h1 >>> 10) % 10000).padStart(4, '8')
  const part3 = String((h2 >>> 5) % 10000).padStart(4, '3')
  const part4 = String(h2 % 10000).padStart(4, '2')
  return `${part1} ${part2} ${part3} ${part4}`
}

// Generate realistic expiry date from account ID
export function generateExpiry(id = '') {
  let sum = 0
  for (let i = 0; i < String(id || '').length; i++) sum += id.charCodeAt(i)
  const month = String((sum % 12) + 1).padStart(2, '0')
  const year = String(28 + (sum % 4))
  return `${month}/${year}`
}

/**
 * Realistic Gold EMV Chip with micro-circuit lines
 */
export function MetallicChip({ isLight = false, className = '' }) {
  return (
    <div
      className={cn(
        'w-11 h-8 rounded-[6px] relative overflow-hidden select-none shrink-0 shadow-sm border',
        isLight
          ? 'bg-gradient-to-br from-[#dfb76c] via-[#f7e096] to-[#b88c3a] border-[#a07422]/60'
          : 'bg-gradient-to-br from-[#e0b86d] via-[#fae39d] to-[#af832f] border-[#8a6319]/70',
        className
      )}
    >
      {/* Circuit lines */}
      <div className="absolute inset-[1.5px] border border-black/30 rounded-[4px] pointer-events-none">
        {/* Center contact pad */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-3.5 border border-black/35 rounded-[2px] bg-black/10" />
        <div className="absolute top-1/2 inset-x-0 h-px bg-black/30 -translate-y-1/2" />
        <div className="absolute inset-y-0 left-[28%] w-px bg-black/30" />
        <div className="absolute inset-y-0 right-[28%] w-px bg-black/30" />
        {/* Specular metallic sheen */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none" />
      </div>
    </div>
  )
}

/**
 * Contactless / NFC waves icon
 */
export function ContactlessWaves({ className = '', strokeColor = 'currentColor' }) {
  return (
    <svg
      className={cn('w-5 h-5 shrink-0 select-none opacity-80', className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke={strokeColor}
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M7 9a5 5 0 0 1 0 6" opacity="0.6" />
      <path d="M11 6a9 9 0 0 1 0 12" opacity="0.8" />
      <path d="M15 3a13 13 0 0 1 0 18" />
    </svg>
  )
}

/**
 * Solid FinTech Card Brand Badge:
 * Mastercard dual interlocking circles or VISA metallic badge
 */
export function CardNetworkLogo({ network = 'mastercard', isLight = false, className = '' }) {
  if (network === 'mastercard') {
    return (
      <div className={cn('flex items-center -space-x-2.5 shrink-0 select-none', className)} title="Mastercard">
        <div className="w-6 h-6 rounded-full bg-[#EB001B] shadow-xs" />
        <div className="w-6 h-6 rounded-full bg-[#F79E1B] mix-blend-screen opacity-95 shadow-xs" />
      </div>
    )
  }
  return (
    <span
      className={cn(
        'font-black italic tracking-tighter text-base sm:text-lg select-none font-sans',
        isLight ? 'text-zinc-950 font-black' : 'text-white drop-shadow-sm',
        className
      )}
    >
      VISA
    </span>
  )
}

/**
 * SolidFintechCard — Kartu Fisik Mewah & Solid (3D Depth Stack Ready)
 */
export function SolidFintechCard({
  account = {},
  fmt = null,
  isLocked = false,
  showFullNumber = false,
  isLightOverride = false,
  className = '',
  onClick = null,
  style = {},
}) {
  const {
    id = '',
    name = 'PARALAR CARD',
    balance = 0,
    currency = 'USD',
    theme = 'obsidian',
    type = 'bank',
    logo = null,
  } = account || {}

  const th = getTheme(theme)
  const cur = getCurrency(currency)
  const isLight = isLightOverride || Boolean(th?.isLight || theme === 'glacier' || theme === 'white')
  const network = th?.network || (type === 'ewallet' ? 'mastercard' : 'visa')

  // 16 digit number
  const fullCardNumber = useMemo(() => generateCardNumber(id, name), [id, name])
  const maskedCardNumber = useMemo(() => {
    const parts = fullCardNumber.split(' ')
    return `${parts[0] || '••••'}  ••••  ••••  ${parts[3] || '8842'}`
  }, [fullCardNumber])

  const expiry = useMemo(() => generateExpiry(id), [id])

  // Solid theme backgrounds
  const cardSurfaceClass = useMemo(() => {
    if (isLight) {
      // Solid Glacier White / Light Platinum with silver edge
      return 'bg-[#fcfcfd] text-[#09090B] border border-zinc-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.12)]'
    }

    const t = String(theme || '').toLowerCase()
    if (t === 'plum') {
      return 'bg-gradient-to-br from-[#220d1c] via-[#140811] to-[#0b0309] text-white border border-rose-500/20'
    }
    if (t === 'indigo') {
      return 'bg-gradient-to-br from-[#0e122b] via-[#090c1c] to-[#04060e] text-white border border-indigo-500/25'
    }
    if (t === 'spider') {
      return 'bg-gradient-to-br from-[#2a0b12] via-[#170509] to-[#0a0204] text-white border border-red-500/25'
    }
    if (t === 'parang') {
      return 'bg-gradient-to-br from-[#1a150c] via-[#100d07] to-[#070503] text-white border border-amber-500/25'
    }
    if (t === 'matrix') {
      return 'bg-gradient-to-br from-[#08181c] via-[#050f12] to-[#020708] text-white border border-emerald-500/25'
    }
    // Obsidian Titanium (default deep solid matte black)
    return 'bg-gradient-to-br from-[#151518] via-[#0f0f12] to-[#09090b] text-white border border-white/15'
  }, [isLight, theme])

  const formattedBalance = useMemo(() => {
    if (fmt) return fmt(balance ?? 0, currency)
    return `${cur?.symbol || currency} ${Number(balance || 0).toLocaleString()}`
  }, [fmt, balance, currency, cur?.symbol])

  const typeLabel = useMemo(() => {
    const found = ACCOUNT_TYPES.find((x) => x.id === type)
    return found?.label ? found.label.toUpperCase() : String(type || 'CARD').toUpperCase()
  }, [type])

  return (
    <div
      onClick={onClick}
      style={style}
      className={cn(
        'w-full max-w-[390px] aspect-[1.586/1] rounded-[24px] sm:rounded-[26px] p-5 sm:p-6 relative overflow-hidden select-none flex flex-col justify-between transform-gpu will-change-transform',
        'shadow-[0_22px_45px_-12px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.25)]',
        cardSurfaceClass,
        className
      )}
    >
      {/* Dynamic Specular Sheen & Bevel Highlights */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top edge hairline highlight */}
        <div
          className={cn(
            'absolute inset-x-6 top-0 h-[1.5px]',
            isLight
              ? 'bg-gradient-to-r from-transparent via-white to-transparent'
              : 'bg-gradient-to-r from-transparent via-white/35 to-transparent'
          )}
        />
        {/* Subtle diagonal metallic sheen */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.06] pointer-events-none" />
        {/* Soft radial reflection corner */}
        <div
          className={cn(
            'absolute -top-16 -right-16 w-56 h-56 rounded-full blur-2xl pointer-events-none',
            isLight ? 'bg-sky-200/20' : 'bg-white/[0.05]'
          )}
        />
      </div>

      {/* Row 1: Header (Bank Tile / Monogram + Contactless Wave + Wordmark) */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {logo ? (
            <LogoBadge logoId={logo} size="sm" className="rounded-lg shadow-xs" />
          ) : (
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-[11px] tracking-tight border shadow-xs shrink-0',
                isLight ? 'bg-zinc-950/5 border-zinc-300 text-zinc-900' : 'bg-white/10 border-white/20 text-white'
              )}
            >
              {(name || 'PA').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h4
              className={cn(
                'font-bold text-xs sm:text-sm tracking-tight truncate leading-tight',
                isLight ? 'text-zinc-950' : 'text-white'
              )}
            >
              {name || 'Paralar Card'}
            </h4>
            <span
              className={cn(
                'text-[9px] font-semibold uppercase tracking-[0.16em] block',
                isLight ? 'text-zinc-500' : 'text-zinc-400'
              )}
            >
              {typeLabel}
            </span>
          </div>
        </div>

        {/* Brand Wordmark & Elite tag */}
        <div className="flex flex-col items-end shrink-0">
          <span
            className={cn(
              'font-extrabold text-[11px] sm:text-xs tracking-[0.26em] uppercase',
              isLight ? 'text-zinc-900/70' : 'text-white/80'
            )}
          >
            PARALAR
          </span>
          <span
            className={cn(
              'text-[8px] font-bold tracking-[0.18em] uppercase',
              isLight ? 'text-zinc-400' : 'text-white/40'
            )}
          >
            WORLD ELITE
          </span>
        </div>
      </div>

      {/* Row 2: Chip + Contactless Wave + Balance Nominal */}
      <div className="relative z-10 flex items-center justify-between my-auto py-1">
        <div className="flex items-center gap-3">
          <MetallicChip isLight={isLight} />
          <ContactlessWaves
            strokeColor={isLight ? '#09090B' : '#FFFFFF'}
            className={isLight ? 'text-zinc-900' : 'text-white'}
          />
        </div>

        {/* Live Balance display directly on the card */}
        <div className="text-right">
          <span
            className={cn(
              'text-[9px] font-bold uppercase tracking-[0.16em] block',
              isLight ? 'text-zinc-500' : 'text-white/45'
            )}
          >
            BALANCE
          </span>
          <span
            className={cn(
              'font-extrabold text-base sm:text-lg tracking-tight tabular-nums block leading-tight',
              isLight ? 'text-zinc-950' : 'text-white'
            )}
          >
            {formattedBalance}
          </span>
        </div>
      </div>

      {/* Row 3: Embossed 16-Digit Card Number */}
      <div className="relative z-10 pt-1">
        <p
          className={cn(
            'font-mono text-sm sm:text-base font-medium tracking-[0.16em] sm:tracking-[0.2em] select-none',
            isLight
              ? 'text-zinc-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]'
              : 'text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
          )}
        >
          {showFullNumber ? fullCardNumber : maskedCardNumber}
        </p>
      </div>

      {/* Row 4: Cardholder Name + Expiry + Network Logo */}
      <div className="relative z-10 flex items-end justify-between pt-1">
        {/* Name & Expiry */}
        <div className="flex items-center gap-6 min-w-0">
          <div className="min-w-0">
            <span
              className={cn(
                'text-[8px] font-bold uppercase tracking-[0.14em] block leading-none mb-0.5',
                isLight ? 'text-zinc-400' : 'text-white/40'
              )}
            >
              CARDHOLDER
            </span>
            <span
              className={cn(
                'font-bold text-[11px] sm:text-xs uppercase tracking-[0.14em] truncate block leading-tight',
                isLight ? 'text-zinc-900' : 'text-white'
              )}
            >
              {name || 'PARALAR MEMBER'}
            </span>
          </div>

          <div className="shrink-0">
            <span
              className={cn(
                'text-[8px] font-bold uppercase tracking-[0.14em] block leading-none mb-0.5',
                isLight ? 'text-zinc-400' : 'text-white/40'
              )}
            >
              EXPIRES
            </span>
            <span
              className={cn(
                'font-mono font-bold text-[11px] sm:text-xs tracking-wider block leading-tight',
                isLight ? 'text-zinc-900' : 'text-white'
              )}
            >
              {expiry}
            </span>
          </div>
        </div>

        {/* Card Network Logo */}
        <CardNetworkLogo network={network} isLight={isLight} />
      </div>

      {/* Frozen / Security Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-2 p-4 text-center rounded-[24px] sm:rounded-[26px]">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-lg">
            <Lock size={18} strokeWidth={2.2} />
          </div>
          <p className="text-white font-bold text-xs uppercase tracking-widest">
            KARTU TERKUNCI (FROZEN)
          </p>
          <span className="text-white/60 text-[10px]">
            Ketuk tombol buka kunci untuk mengaktifkan
          </span>
        </div>
      )}
    </div>
  )
}
