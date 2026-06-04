'use client'

export default function HeroBackground() {
  return (
    <>
      {/* Vector.svg grid with pulsing animation */}
      <div
        className="absolute inset-0 z-0 bg-no-repeat bg-center bg-cover animate-hero-grid-pulse"
        style={{
          backgroundImage: "url('/images/Vector.svg')",
          backgroundPosition: 'center bottom',
          backgroundSize: 'cover',
        }}
        aria-hidden
      />
      <div className="hero-corner-gradient absolute inset-0 z-[1] pointer-events-none" aria-hidden />
    </>
  )
}
