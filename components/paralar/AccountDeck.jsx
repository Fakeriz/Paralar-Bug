'use client'

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { motion, useMotionValue, useTransform, useReducedMotion, animate } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * AccountDeck — Carousel kartu bertumpuk ultra-presisi ala Belanje.
 *
 * Fitur Gesture & Animasi:
 *  - Kartu aktif berada di depan (elevation z-30, scale 1, y 0).
 *  - Kartu berikutnya mengintip (peek) dari tepi atas belakang kartu aktif:
 *      * Peek #1: y = -15px, scale = 0.94, brightness = 0.88, opacity = 0.94
 *      * Peek #2: y = -26px, scale = 0.88, brightness = 0.76, opacity = 0.72
 *  - 1:1 dynamic finger tracking dengan Framer Motion:
 *      * Drag ke kiri: kartu depan tilt halus, kartu di belakang bereaksi naik & membesar secara real-time.
 *      * Drag ke kanan: kartu sebelumnya ditarik masuk dari kiri secara natural.
 *  - Spring physics completion via `animate()`: saat dilepas, kartu meluncur tuntas sebelum index berpindah
 *    sehingga 100% bebas glitch, tanpa lompatan atau flicker DOM.
 *  - Tap pada kartu peek untuk langsung loncat ke kartu tersebut.
 */

const SPRING_CONFIG = {
  type: 'spring',
  stiffness: 360,
  damping: 32,
  mass: 0.8,
}

function haptic(ms = 10) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms)
    }
  } catch {}
}

export default function AccountDeck({
  slides = [],
  index = 0,
  onIndexChange,
  regionLabel = 'Bank Accounts',
  className,
}) {
  const reduceMotion = useReducedMotion()
  const trackRef = useRef(null)
  const total = (slides || []).length

  const [activeIdx, setActiveIdx] = useState(() =>
    Math.max(0, Math.min(index || 0, Math.max(0, total - 1)))
  )
  const [isAnimating, setIsAnimating] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  // Motion value untuk pelacakan gestur drag real-time
  const dragX = useMotionValue(0)

  // Tilt fisik dinamis saat di-drag: drag ke kiri tilt -3.5deg, drag ke kanan tilt +3.5deg
  const activeRotate = useTransform(dragX, [-240, 0, 240], [-3.8, 0, 3.8])

  // Reaksi real-time kartu peek #1 saat kartu aktif ditarik ke kiri (dragX < 0)
  const peek1Y = useTransform(dragX, [-200, 0], [0, -15])
  const peek1Scale = useTransform(dragX, [-200, 0], [1.0, 0.94])
  const peek1Brightness = useTransform(dragX, [-200, 0], [1.0, 0.88])
  const peek1Opacity = useTransform(dragX, [-200, 0], [1.0, 0.94])

  // Reaksi real-time kartu peek #2
  const peek2Y = useTransform(dragX, [-200, 0], [-15, -26])
  const peek2Scale = useTransform(dragX, [-200, 0], [0.94, 0.88])
  const peek2Brightness = useTransform(dragX, [-200, 0], [0.88, 0.76])
  const peek2Opacity = useTransform(dragX, [-200, 0], [0.94, 0.72])

  // Reaksi kartu sebelumnya (diff = -1) saat ditarik ke kanan (dragX > 0)
  const prevCardX = useTransform(dragX, [0, 260], ['-105%', '-15%'])
  const prevCardOpacity = useTransform(dragX, [0, 160], [0.2, 1.0])

  const goTo = useCallback(
    (next) => {
      const clamped = Math.max(0, Math.min(next, total - 1))
      if (clamped === activeIdx) return
      setActiveIdx(clamped)
      onIndexChange?.(clamped)
      haptic(12)
    },
    [activeIdx, total, onIndexChange]
  )

  const handleDragEnd = useCallback(
    (_, info) => {
      if (isAnimating) return
      const { offset, velocity } = info
      const threshold = 38
      const velThreshold = 200

      // Swipe ke kiri -> kartu berikutnya
      if (offset.x < -threshold || velocity.x < -velThreshold) {
        if (activeIdx < total - 1) {
          setIsAnimating(true)
          haptic(10)
          animate(dragX, -380, {
            type: 'spring',
            stiffness: 380,
            damping: 34,
            velocity: velocity.x,
            onComplete: () => {
              dragX.set(0)
              setIsAnimating(false)
              goTo(activeIdx + 1)
            },
          })
          return
        }
      }
      // Swipe ke kanan -> kartu sebelumnya
      else if (offset.x > threshold || velocity.x > velThreshold) {
        if (activeIdx > 0) {
          setIsAnimating(true)
          haptic(10)
          animate(dragX, 380, {
            type: 'spring',
            stiffness: 380,
            damping: 34,
            velocity: velocity.x,
            onComplete: () => {
              dragX.set(0)
              setIsAnimating(false)
              goTo(activeIdx - 1)
            },
          })
          return
        }
      }

      // Snap kembali ke tengah jika gestur belum melewati batas
      animate(dragX, 0, {
        type: 'spring',
        stiffness: 420,
        damping: 32,
        velocity: velocity.x,
      })
    },
    [activeIdx, total, isAnimating, dragX, goTo]
  )

  // Sinkronisasi index dari kontrol luar
  useEffect(() => {
    const clamped = Math.max(0, Math.min(index ?? 0, Math.max(0, total - 1)))
    if (clamped !== activeIdx) {
      setActiveIdx(clamped)
    }
  }, [index, total, activeIdx])

  // Cegah index out-of-bounds saat daftar akun berubah
  useEffect(() => {
    setActiveIdx((prev) => Math.max(0, Math.min(prev, Math.max(0, total - 1))))
  }, [total])

  // Aksesibilitas screen reader
  useEffect(() => {
    const s = slides?.[activeIdx]
    if (s) setAnnouncement(`Kartu ${activeIdx + 1} dari ${total}: ${s.label}`)
  }, [activeIdx, slides, total])

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      goTo(activeIdx + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goTo(activeIdx - 1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      goTo(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      goTo(total - 1)
    }
  }

  const transition = useMemo(
    () => (reduceMotion ? { duration: 0 } : SPRING_CONFIG),
    [reduceMotion]
  )

  if (!slides || slides.length === 0) return null

  // Kasus hanya 1 kartu: tampil tanpa peek
  if (total === 1) {
    return (
      <div className={cn('relative', className)}>
        <div className="relative pt-2 pb-2">
          <div className="relative aspect-[1.58/1] min-h-[200px] max-h-[240px] w-full rounded-[28px] overflow-hidden select-none">
            {slides[0]?.node}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={regionLabel}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative pt-7 pb-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-visible select-none"
      >
        {/* Frame aspect ratio kartu: min-height 200px, max-height 240px */}
        <div className="relative aspect-[1.58/1] min-h-[200px] max-h-[240px] w-full select-none">
          {slides.map((slide, i) => {
            const diff = i - activeIdx
            const isActive = diff === 0
            const isPeek1 = diff === 1
            const isPeek2 = diff === 2
            const isPrev = diff === -1

            // Kartu yang terlalu jauh tidak perlu di-mount di DOM
            if (diff < -1 || diff > 2) {
              return null
            }

            // ==============================================================
            // 1. KARTU SEBELUMNYA (diff = -1)
            // ==============================================================
            if (isPrev) {
              return (
                <motion.div
                  key={slide.id}
                  style={{
                    x: prevCardX,
                    opacity: prevCardOpacity,
                    y: 0,
                    scale: 0.98,
                    zIndex: 35, // Muncul di atas kartu aktif saat ditarik ke kanan
                    transformOrigin: 'bottom center',
                    touchAction: 'pan-y',
                  }}
                  className="absolute inset-0 h-full w-full select-none pointer-events-none transform-gpu will-change-transform"
                  aria-hidden={true}
                >
                  <div className="h-full w-full rounded-[28px] overflow-hidden shadow-xl">
                    {slide.node}
                  </div>
                </motion.div>
              )
            }

            // ==============================================================
            // 2. KARTU AKTIF (diff = 0)
            // ==============================================================
            if (isActive) {
              return (
                <motion.div
                  key={slide.id}
                  style={{
                    x: dragX,
                    rotate: activeRotate,
                    zIndex: 30,
                    touchAction: 'pan-y',
                    transformOrigin: 'bottom center',
                  }}
                  drag={!reduceMotion && !isAnimating ? 'x' : false}
                  dragConstraints={{
                    left: activeIdx < total - 1 ? -320 : -45,
                    right: activeIdx > 0 ? 320 : 45,
                  }}
                  dragElastic={0.65}
                  dragMomentum={false}
                  onDragEnd={handleDragEnd}
                  className="absolute inset-0 h-full w-full select-none transform-gpu will-change-transform cursor-grab active:cursor-grabbing"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={slide.label}
                  aria-hidden={false}
                >
                  <div className="h-full w-full rounded-[28px] overflow-hidden">
                    {slide.node}
                  </div>
                </motion.div>
              )
            }

            // ==============================================================
            // 3. KARTU PEEK #1 (diff = 1)
            // ==============================================================
            if (isPeek1) {
              return (
                <motion.div
                  key={slide.id}
                  style={{
                    x: 0,
                    y: peek1Y,
                    scale: peek1Scale,
                    opacity: peek1Opacity,
                    zIndex: 20,
                    touchAction: 'pan-y',
                    transformOrigin: 'bottom center',
                    cursor: 'pointer',
                  }}
                  className="absolute inset-0 h-full w-full select-none transform-gpu will-change-transform"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={slide.label}
                  aria-hidden={true}
                  onClick={() => goTo(i)}
                >
                  <motion.div
                    style={{ filter: `brightness(${peek1Brightness})` }}
                    className="h-full w-full rounded-[28px] overflow-hidden shadow-sm"
                  >
                    {slide.node}
                  </motion.div>
                </motion.div>
              )
            }

            // ==============================================================
            // 4. KARTU PEEK #2 (diff = 2)
            // ==============================================================
            if (isPeek2) {
              return (
                <motion.div
                  key={slide.id}
                  style={{
                    x: 0,
                    y: peek2Y,
                    scale: peek2Scale,
                    opacity: peek2Opacity,
                    zIndex: 10,
                    touchAction: 'pan-y',
                    transformOrigin: 'bottom center',
                    cursor: 'pointer',
                  }}
                  className="absolute inset-0 h-full w-full select-none transform-gpu will-change-transform"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={slide.label}
                  aria-hidden={true}
                  onClick={() => goTo(i)}
                >
                  <motion.div
                    style={{ filter: `brightness(${peek2Brightness})` }}
                    className="h-full w-full rounded-[28px] overflow-hidden"
                  >
                    {slide.node}
                  </motion.div>
                </motion.div>
              )
            }

            return null
          })}
        </div>
      </div>

      {/* Screen reader live region */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  )
}

