'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import ContactCard from './ContactCard'

const sectionBackground = {
  backgroundImage: `
    linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
  `,
  backgroundSize: '40px 40px',
}

const ROUND_TRIGGER_PX = 380
const RADIUS_PX = 48
const MOVE_Y_PX = 40

export default function ContactSection() {
  const [rounded, setRounded] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > ROUND_TRIGGER_PX) setRounded(true)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section id="contact" aria-label="Contact" className="relative z-10">
      <motion.div
        animate={{
          borderBottomLeftRadius: rounded ? RADIUS_PX : 0,
          borderBottomRightRadius: rounded ? RADIUS_PX : 0,
          y: rounded ? MOVE_Y_PX : 0,
        }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ willChange: 'transform' }}
        className="relative min-h-[120vh] py-44 overflow-hidden"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom right, #ffffff 0%, rgba(255,255,255,1) 40%, #fff4e6 55%, #ffe0cc 75%, #ffd6b3 100%)',
          }}
        />
        <div className="absolute inset-0 pointer-events-none" style={sectionBackground} />

        <div
          className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, #ffffff 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-start">
          {/* Left: info */}
          <div className="pt-14 flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-black/10 bg-white/80 px-3 py-1.5 text-sm font-semibold text-orange-600">
              <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />
              Get In Touch
            </div>
            <h2 className="text-4xl font-semibold tracking-tight text-gray-900">Get In Touch</h2>
            <p className="text-gray-500 max-w-md">
              Have a question or ready to transform your mobility operations?
            </p>
            <div className="flex flex-col gap-4">
              <ContactCard
                icon="mail"
                label="contact@greenwaymobility.in"
                href="mailto:contact@greenwaymobility.in"
              />
              <ContactCard icon="phone" label="+91 98765 43210" href="tel:+919876543210" />
              <ContactCard icon="location" label="Pune, India" />
            </div>
          </div>
          {/* Right: form */}
          <div className="pt-8">
            <div className="bg-[#8C8C8C1F] border border-black/5 rounded-2xl p-6 shadow-lg backdrop-blur-md">
              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full block rounded-lg bg-white border border-gray-200 px-4 py-5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full block rounded-lg bg-white border border-gray-200 px-4 py-5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                />
                <textarea
                  placeholder="Message"
                  className="h-48 w-full block resize-none rounded-lg bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                />
                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-4 text-sm font-medium transition-all"
                >
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
