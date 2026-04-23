import { useEffect, useRef } from 'react'
import { useVisual } from '../context/VisualContext'

export default function VisualEffects() {
  const { isVisual } = useVisual()
  const canvasRef   = useRef(null)
  const blobRef     = useRef(null)
  const orb1Ref     = useRef(null)
  const orb2Ref     = useRef(null)
  const animRef     = useRef(null)
  const mouse       = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const blobPos     = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const parallax    = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!isVisual) return

    /* ── Canvas particles ── */
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let particles = []

    const PAD = 120 // extra px on each side so parallax shift never shows an empty edge
    const resize = () => {
      canvas.width  = window.innerWidth  + PAD * 2
      canvas.height = window.innerHeight + PAD * 2
      const n = Math.min(Math.floor(canvas.width * canvas.height / 10000), 130)
      particles = Array.from({ length: n }, () => ({
        x:  Math.random() * canvas.width,
        y:  Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.40,
        vy: (Math.random() - 0.5) * 0.40,
        r:  Math.random() * 2.4 + 0.8,
        op: Math.random() * 0.55 + 0.25,
      }))
    }
    resize()
    window.addEventListener('resize', resize)

    /* ── Unified animation loop ── */
    const loop = () => {
      /* particles */
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        else if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        else if (p.y > canvas.height) p.y = 0

        /* particle with glow */
        ctx.shadowBlur  = p.r * 5
        ctx.shadowColor = `rgba(147,197,253,0.75)`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(147,197,253,${p.op})`
        ctx.fill()
        ctx.shadowBlur = 0   /* reset before drawing lines */

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j]
          const dx = p.x - q.x, dy = p.y - q.y
          const d = dx * dx + dy * dy
          if (d < 16900) { /* 130² */
            ctx.beginPath()
            ctx.strokeStyle = `rgba(147,197,253,${(1 - Math.sqrt(d) / 130) * 0.22})`
            ctx.lineWidth = 0.6
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.stroke()
          }
        }
      }

      /* cursor blob — spring follow */
      const m  = mouse.current
      const bp = blobPos.current
      bp.x += (m.x - bp.x) * 0.075
      bp.y += (m.y - bp.y) * 0.075
      if (blobRef.current) {
        blobRef.current.style.left = `${bp.x - 220}px`
        blobRef.current.style.top  = `${bp.y - 220}px`
      }

      /* parallax orbs — background only, noticeable drift */
      const par = parallax.current
      const cx  = window.innerWidth  / 2
      const cy  = window.innerHeight / 2
      par.x += ((m.x - cx) * 0.055 - par.x) * 0.055
      par.y += ((m.y - cy) * 0.040 - par.y) * 0.055
      if (orb1Ref.current) orb1Ref.current.style.transform = `translate(${par.x * 3.2}px, ${par.y * 3.2}px)`
      if (orb2Ref.current) orb2Ref.current.style.transform = `translate(${-par.x * 2.6}px, ${-par.y * 2.6}px)`
      /* particles canvas follows parallax at its own (slower) speed */
      if (canvasRef.current) canvasRef.current.style.transform = `translate(${par.x * 1.8}px, ${par.y * 1.8}px)`

      animRef.current = requestAnimationFrame(loop)
    }

    const onMove = e => { mouse.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMove)
    animRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [isVisual])

  if (!isVisual) return null

  return (
    <>
      {/* Particle canvas — oversized by PAD on each side so parallax shift never exposes an empty border */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed pointer-events-none z-0"
        style={{ opacity: 0.92, top: -120, left: -120, willChange: 'transform' }}
      />

      {/* Cursor gradient glow */}
      <div
        ref={blobRef}
        aria-hidden="true"
        className="fixed pointer-events-none z-0 w-[440px] h-[440px]"
        style={{
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(96,165,250,0.18) 0%, rgba(59,130,246,0.07) 45%, transparent 70%)',
          willChange: 'left, top',
        }}
      />

      {/* Parallax ambient orbs */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          ref={orb1Ref}
          className="absolute rounded-full"
          style={{
            width: 560, height: 560, top: -140, right: -140,
            background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
            filter: 'blur(70px)',
            willChange: 'transform',
          }}
        />
        <div
          ref={orb2Ref}
          className="absolute rounded-full"
          style={{
            width: 440, height: 440, bottom: -100, left: -100,
            background: 'radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 70%)',
            filter: 'blur(70px)',
            willChange: 'transform',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 320, height: 320, top: '45%', left: '55%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>
    </>
  )
}
