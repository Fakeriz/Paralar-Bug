'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Copy, Check, Lock, Unlock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { SolidFintechCard, generateCardNumber } from './SolidFintechCard'
import { cn } from '@/lib/utils'

export default function ExtrudedDeck3D({
  accounts = [],
  activeIndex = 0,
  onSelectIndex = () => {},
  fmt = null,
  isLockedMap = {},
  onToggleLock = () => {},
  className = '',
}) {
  const total = accounts?.length || 0
  const [showFullNumber, setShowFullNumber] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // Drag physics motion values
  const dragX = useMotionValue(0)

  // 3D Yaw & Roll transformations for front card
  const rotateY = useTransform(dragX, [-220, 0, 220], [22, 0, -22])
  const rotateZ = useTransform(dragX, [-220, 0, 220], [-3.5, 0, 3.5])
  const translateZ = useTransform(dragX, [-200, 0, 200], [20, 0, 20])

  // Dynamic push-forward reaction for the card behind (layer 1)
  const layer1TranslateZ = useTransform(dragX, [-200, 0, 200], [0, -68, 0])
  const layer1Y = useTransform(dragX, [-200, 0, 200], [0, -24, 0])
  const layer1Scale = useTransform(dragX, [-200, 0, 200], [1.0, 0.92, 1.0])
  const layer1Brightness = useTransform(dragX, [-200, 0, 200], [1.0, 0.85, 1.0])

  // Dynamic push-forward reaction for layer 2
  const layer2TranslateZ = useTransform(dragX, [-200, 0, 200], [-68, -135, -68])
  const layer2Y = useTransform(dragX, [-200, 0, 200], [-24, -46, -24])
  const layer2Scale = useTransform(dragX, [-200, 0, 200], [0.92, 0.84, 0.92])

  // Reset drag position on index change
  useEffect(() => {
    dragX.set(0)
    setIsAnimating(false)
  }, [activeIndex, dragX])

  // Navigation handlers with haptic feedback
  const triggerHaptic = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(12)
      }
    } catch {}
  }, [])

  const handleNext = useCallback(() => {
    if (total <= 1 || isAnimating) return
    setIsAnimating(true)
    triggerHaptic()
    animate(dragX, -180, {
      type: 'spring',
      stiffness: 400,
      damping: 32,
      onComplete: () => {
        onSelectIndex((activeIndex + 1) % total)
        dragX.set(0)
        setIsAnimating(false)
      },
    })
  }, [total, isAnimating, triggerHaptic, dragX, onSelectIndex, activeIndex])

  const handlePrev = useCallback(() => {
    if (total <= 1 || isAnimating) return
    setIsAnimating(true)
    triggerHaptic()
    animate(dragX, 180, {
      type: 'spring',
      stiffness: 400,
      damping: 32,
      onComplete: () => {
        onSelectIndex((activeIndex - 1 + total) % total)
        dragX.set(0)
        setIsAnimating(false)
      },
    })
  }, [total, isAnimating, triggerHaptic, dragX, onSelectIndex, activeIndex])

  // Drag End handler with release physics
  const handleDragEnd = (_, info) => {
    if (isAnimating) return
    const offset = info.offset.x
    const velocity = info.velocity.x
    const threshold = 75

    if (offset < -threshold || velocity < -350) {
      // Swiped Left -> Go Next
      handleNext()
    } else if (offset > threshold || velocity > 350) {
      // Swiped Right -> Go Prev
      handlePrev()
    } else {
      // Return to center spring
      animate(dragX, 0, {
        type: 'spring',
        stiffness: 350,
        damping: 26,
      })
    }
  }

  // Active account
  const activeAccount = accounts?.[activeIndex] || accounts?.[0] || null

  // Copy card number to clipboard
  const handleCopyCard = () => {
    if (!activeAccount) return
    const num = generateCardNumber(activeAccount.id, activeAccount.name)
    try {
      navigator.clipboard?.writeText(num)
      setCopied(true)
      toast.success('Nomor kartu disalin ke clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Gagal menyalin nomor kartu')
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handlePrev])

  if (!total || !activeAccount) return null

  return (
    <div className={cn('w-full flex flex-col items-center select-none', className)}>
      {/* ======================================================================
          3D VIEWPORT CONTAINER (PERSPECTIVE STAGE)
         ====================================================================== */}
      <div
        className="w-full max-w-[420px] px-3 pt-6 pb-2 flex items-center justify-center relative touch-pan-y"
        style={{
          perspective: 1200,
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className="relative w-full aspect-[1.586/1] max-w-[390px] flex items-center justify-center"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {accounts.map((acc, idx) => {
            // Distance from active card in circular queue
            const diff = (idx - activeIndex + total) % total

            // Only render top 3 cards in the extruded depth stack
            if (diff > 2 && diff !== total - 1) return null

            // Active Card (Front)
            if (diff === 0) {
              const isLocked = Boolean(isLockedMap?.[acc.id])
              return (
                <motion.div
                  key={acc.id}
                  drag="x"
                  dragElastic={0.8}
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={handleDragEnd}
                  style={{
                    x: dragX,
                    rotateY,
                    rotateZ,
                    z: translateZ,
                    zIndex: 30,
                    transformStyle: 'preserve-3d',
                  }}
                  className="absolute inset-0 cursor-grab active:cursor-grabbing transform-gpu will-change-transform"
                  data-testid="deck3d-active-card"
                >
                  <SolidFintechCard
                    account={acc}
                    fmt={fmt}
                    isLocked={isLocked}
                    showFullNumber={showFullNumber}
                  />
                </motion.div>
              )
            }

            // Layer 1 Behind (Extruded Depth Level 1)
            if (diff === 1) {
              return (
                <motion.div
                  key={acc.id}
                  onClick={() => handleNext()}
                  style={{
                    y: layer1Y,
                    z: layer1TranslateZ,
                    scale: layer1Scale,
                    rotateX: 5,
                    zIndex: 20,
                    opacity: 0.95,
                    transformStyle: 'preserve-3d',
                  }}
                  className="absolute inset-0 cursor-pointer transform-gpu will-change-transform hover:opacity-100 transition-opacity"
                  title="Ketuk untuk ke kartu ini"
                  data-testid="deck3d-layer1-card"
                >
                  <SolidFintechCard
                    account={acc}
                    fmt={fmt}
                    isLocked={Boolean(isLockedMap?.[acc.id])}
                    showFullNumber={false}
                    className="pointer-events-none"
                  />
                  {/* Depth Occlusion Shadow overlay */}
                  <motion.div
                    style={{
                      opacity: useTransform(layer1Brightness, [0.85, 1.0], [0.18, 0]),
                    }}
                    className="absolute inset-0 bg-black rounded-[24px] sm:rounded-[26px] pointer-events-none"
                  />
                </motion.div>
              )
            }

            // Layer 2 Behind (Extruded Depth Level 2)
            if (diff === 2) {
              return (
                <motion.div
                  key={acc.id}
                  onClick={() => {
                    if (total > 2) {
                      onSelectIndex((activeIndex + 2) % total)
                      triggerHaptic()
                    }
                  }}
                  style={{
                    y: layer2Y,
                    z: layer2TranslateZ,
                    scale: layer2Scale,
                    rotateX: 8,
                    zIndex: 10,
                    opacity: 0.78,
                    transformStyle: 'preserve-3d',
                  }}
                  className="absolute inset-0 cursor-pointer transform-gpu will-change-transform"
                  title="Ketuk untuk ke kartu ini"
                  data-testid="deck3d-layer2-card"
                >
                  <SolidFintechCard
                    account={acc}
                    fmt={fmt}
                    isLocked={Boolean(isLockedMap?.[acc.id])}
                    showFullNumber={false}
                    className="pointer-events-none"
                  />
                  {/* Deeper Occlusion Overlay */}
                  <div className="absolute inset-0 bg-black/35 rounded-[24px] sm:rounded-[26px] pointer-events-none" />
                </motion.div>
              )
            }

            return null
          })}
        </div>
      </div>

      {/* ======================================================================
          CONTROLS & ACTION TOOLBAR (UNDER 3D CARD)
         ====================================================================== */}
      <div className="w-full max-w-[390px] px-3 mt-4 flex flex-col gap-3">
        {/* Navigation Indicator & Stepper */}
        <div className="flex items-center justify-between px-1">
          {/* Previous Button */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={total <= 1}
            className="w-8 h-8 rounded-full bg-muted/60 hover:bg-muted dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-foreground flex items-center justify-center transition-transform active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            aria-label="Previous Card"
            data-testid="deck3d-prev-btn"
          >
            <ChevronLeft size={18} strokeWidth={2.2} />
          </button>

          {/* Dots Indicator & Card Count */}
          <div className="flex items-center gap-1.5">
            {accounts.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onSelectIndex(i)
                  triggerHaptic()
                }}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300 cursor-pointer',
                  i === activeIndex
                    ? 'w-6 bg-zinc-950 dark:bg-white'
                    : 'w-1.5 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600'
                )}
                aria-label={`Go to card ${i + 1}`}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={total <= 1}
            className="w-8 h-8 rounded-full bg-muted/60 hover:bg-muted dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-foreground flex items-center justify-center transition-transform active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            aria-label="Next Card"
            data-testid="deck3d-next-btn"
          >
            <ChevronRight size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* Quick Card Features Bar (Salin No. Kartu, Show/Hide, Kunci) */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {/* 1. Toggle Show/Hide Full 16-Digits */}
          <button
            type="button"
            onClick={() => setShowFullNumber((prev) => !prev)}
            className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#222226] border border-border/40 text-foreground text-xs font-semibold transition active:scale-95 cursor-pointer shadow-xs"
            data-testid="deck3d-toggle-digits-btn"
          >
            {showFullNumber ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showFullNumber ? 'Sembunyi' : 'Lihat Digit'}</span>
          </button>

          {/* 2. Copy Card Number */}
          <button
            type="button"
            onClick={handleCopyCard}
            className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#222226] border border-border/40 text-foreground text-xs font-semibold transition active:scale-95 cursor-pointer shadow-xs"
            data-testid="deck3d-copy-btn"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copied ? 'Tersalin' : 'Salin No'}</span>
          </button>

          {/* 3. Freeze / Lock Toggle */}
          <button
            type="button"
            onClick={() => onToggleLock(activeAccount.id)}
            className={cn(
              'flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl border text-xs font-semibold transition active:scale-95 cursor-pointer shadow-xs',
              isLockedMap?.[activeAccount.id]
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181b] dark:hover:bg-[#222226] border-border/40 text-foreground'
            )}
            data-testid="deck3d-lock-btn"
          >
            {isLockedMap?.[activeAccount.id] ? <Unlock size={14} /> : <Lock size={14} />}
            <span>{isLockedMap?.[activeAccount.id] ? 'Buka Kunci' : 'Kunci Kartu'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
