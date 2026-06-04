'use client'

import Image from 'next/image'
import { Container, Section } from '@webfudge/ui'

export default function QuoteSection() {
  return (
    <Section id="quote" ariaLabel="Quote" variant="fullscreen">
      {/* Animated blobs */}
      <div className="absolute inset-0 z-0" aria-hidden>
        <div
          className="absolute w-[min(85vw,560px)] h-[min(85vw,560px)] rounded-full blob-float-1"
          style={{
            left: '8%',
            top: '12%',
            background:
              'radial-gradient(circle, rgba(251, 146, 60, 0.7) 0%, rgba(253, 186, 116, 0.45) 45%, transparent 70%)',
            filter: 'blur(32px)',
          }}
        />
        <div
          className="absolute w-[min(75vw,480px)] h-[min(75vw,480px)] rounded-full blob-float-2"
          style={{
            right: '8%',
            top: '35%',
            background:
              'radial-gradient(circle, rgba(254, 215, 170, 0.65) 0%, rgba(254, 243, 199, 0.4) 45%, transparent 70%)',
            filter: 'blur(36px)',
          }}
        />
        <div
          className="absolute w-[min(70vw,440px)] h-[min(70vw,440px)] rounded-full blob-float-3"
          style={{
            left: '30%',
            bottom: '8%',
            background:
              'radial-gradient(circle, rgba(253, 186, 116, 0.65) 0%, rgba(251, 191, 36, 0.35) 45%, transparent 70%)',
            filter: 'blur(38px)',
          }}
        />
      </div>
      {/* Background image */}
      <div className="absolute inset-0 z-[1]" aria-hidden>
        <Image
          src="/images/cubic_glass.png"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority={false}
        />
      </div>
      <div className="absolute inset-0 bg-white/30 z-[2]" aria-hidden />
      {/* Content */}
      <Container className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center">
        <blockquote className="max-w-3xl">
          <p className="text-4xl md:text-4xl lg:text-5xl font-bold text-brand-dark mb-4">
            &ldquo;What gets measured <br /> gets managed.&rdquo;
          </p>
          <footer className="text-lg md:text-2xl text-gray-700 font-medium">— Peter Drucker</footer>
        </blockquote>
      </Container>
    </Section>
  )
}
