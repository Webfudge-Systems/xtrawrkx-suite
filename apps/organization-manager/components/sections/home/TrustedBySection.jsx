'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { Container, Section } from '@webfudge/ui'
import { SectionHeader } from '../../common'

const testimonialQuote =
  'Greenway Mobility cut our fleet admin work by more than half. Our team now focuses on operations rather than paperwork.'

const gridItems = [
  {
    type: 'stat',
    value: '60%',
    label: 'admin work',
    sublabel: 'reduced',
    variant: 'orange',
    gradientDirection: 135,
  },
  {
    type: 'testimonial',
    quote: testimonialQuote,
    name: 'Rahul Sharma',
    title: 'Fleet Operations Head',
    variant: 'dark',
  },
  {
    type: 'stat',
    value: '45%',
    label: 'operational',
    sublabel: 'efficiency boost',
    variant: 'orange',
    gradientDirection: 225,
  },
  {
    type: 'stat',
    value: '35%',
    label: 'team',
    sublabel: 'productivity',
    variant: 'white',
  },
  {
    type: 'stat',
    value: '3x',
    label: 'faster',
    sublabel: 'project delivery',
    variant: 'orange',
    gradientDirection: 45,
  },
  {
    type: 'testimonial',
    quote: testimonialQuote,
    name: 'Priya Nair',
    title: 'Project Manager',
    variant: 'light',
  },
]

const GRADIENT_STOPS = '#fbbf24 0%, #fb923c 40%, #ea580c 80%, #c2410c 100%'

function AnimatedStatCard({ value, label, sublabel, variant, gradientDirection = 135 }) {
  const cardRef = useRef(null)
  const gradientRef = useRef(null)
  const idleTweenRef = useRef(null)

  useEffect(() => {
    if (variant !== 'orange' || !gradientRef.current) return
    const ctx = gsap.context(() => {
      idleTweenRef.current = gsap.to(gradientRef.current, {
        backgroundPosition: '100% 100%',
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    })
    return () => ctx.revert()
  }, [variant])

  const handleMouseEnter = () => {
    if (variant !== 'orange' || !cardRef.current) return
    if (idleTweenRef.current) idleTweenRef.current.pause()
    gsap.to(cardRef.current, {
      scale: 1.03,
      duration: 0.35,
      ease: 'power2.out',
      boxShadow: '0 20px 40px -12px rgba(245, 99, 15, 0.35)',
    })
  }

  const handleMouseMove = (e) => {
    if (variant !== 'orange' || !cardRef.current || !gradientRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const bgX = (1 - x) * 100
    const bgY = (1 - y) * 100
    gsap.to(gradientRef.current, {
      backgroundPosition: `${bgX}% ${bgY}%`,
      duration: 0.2,
      ease: 'power2.out',
    })
  }

  const handleMouseLeave = () => {
    if (variant !== 'orange' || !cardRef.current) return
    if (idleTweenRef.current) idleTweenRef.current.play()
    gsap.to(cardRef.current, {
      scale: 1,
      duration: 0.35,
      ease: 'power2.out',
      boxShadow: 'none',
    })
  }

  if (variant === 'white') {
    return (
      <div className="w-full rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[180px] bg-white border border-gray-200 text-brand-dark">
        <span className="text-3xl md:text-4xl font-bold leading-none">{value}</span>
        <span className="mt-1 text-sm text-gray-700">{label}</span>
        <span className="text-xs text-gray-500">{sublabel}</span>
      </div>
    )
  }

  return (
    <div
      ref={cardRef}
      className="relative w-full rounded-2xl min-h-[180px] overflow-hidden cursor-default"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={gradientRef}
        className="absolute inset-0 bg-[length:200%_200%]"
        style={{
          backgroundImage: `linear-gradient(${gradientDirection}deg, ${GRADIENT_STOPS})`,
          backgroundPosition: '0% 0%',
        }}
        aria-hidden
      />
      <div className="relative z-10 p-6 flex flex-col items-center justify-center text-center min-h-[180px] text-white">
        <span className="text-3xl md:text-4xl font-bold leading-none">{value}</span>
        <span className="mt-1 text-sm text-white/95">{label}</span>
        <span className="text-xs text-white/80">{sublabel}</span>
      </div>
    </div>
  )
}

export default function TrustedBySection() {
  return (
    <Section id="trusted-by" ariaLabel="Trusted by growing companies">
      <Container>
        <SectionHeader
          tagText="Testimonials"
          title="Trusted by mobility leaders worldwide"
          className="text-center mb-10 md:mb-14"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
          {gridItems.map((item, index) => (
            <div
              key={index}
              className={`flex ${item.type === 'stat' ? 'lg:col-span-1' : 'lg:col-span-2'}`}
            >
              {item.type === 'stat' ? (
                <AnimatedStatCard
                  value={item.value}
                  label={item.label}
                  sublabel={item.sublabel}
                  variant={item.variant}
                  gradientDirection={item.gradientDirection}
                />
              ) : (
                <div
                  className={`w-full rounded-2xl p-6 flex flex-col justify-center min-h-[180px] ${
                    item.variant === 'dark'
                      ? 'bg-brand-dark text-white'
                      : 'bg-white border border-gray-200 text-brand-dark'
                  }`}
                >
                  <p
                    className={`text-sm leading-relaxed text-center ${
                      item.variant === 'dark' ? 'text-gray-200' : 'text-gray-700'
                    }`}
                  >
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <span
                      className={`w-10 h-10 rounded-full flex-shrink-0 ${
                        item.variant === 'dark' ? 'bg-white/20' : 'bg-gray-200'
                      }`}
                      aria-hidden
                    />
                    <div className="text-left">
                      <p
                        className={`font-semibold text-sm ${item.variant === 'dark' ? 'text-white' : 'text-brand-dark'}`}
                      >
                        {item.name}
                      </p>
                      <p
                        className={`text-xs ${item.variant === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                      >
                        {item.title}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}
