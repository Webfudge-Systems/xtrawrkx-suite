'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button, Section } from '@webfudge/ui'
import { HeroBackground, HeroLines } from '../../common'

export default function HeroSection({ isAuthenticated }) {
  return (
    <Section id="about" ariaLabel="Hero" variant="hero">
      <HeroBackground />
      <div className="relative z-10 flex min-h-[55vh] flex-col items-center justify-center px-4 pt-[180px] pb-[-30px] text-center">
        <h1 className="text-4xl font-bold text-brand-dark mb-6 md:text-5xl lg:text-7xl max-w-4xl leading-tight">
          A <span className="text-brand-primary">Platform</span> Built <br /> For Green Mobility.
        </h1>
        <p className="text-lg font-medium text-gray-700 mb-10 max-w-2xl md:text-xl leading-relaxed">
          Manage your EV fleet, projects, and operations — <br /> configured and optimised exactly
          how you need.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {isAuthenticated ? (
            <Button
              as={Link}
              href="/profile"
              variant="primary"
              size="lg"
              className="btn-liquid shadow-brand-sm hover:shadow-brand"
            >
              Access Your Apps
            </Button>
          ) : (
            <>
              <Button
                as={Link}
                href="#products"
                variant="primary"
                size="lg"
                className="btn-liquid shadow-brand-sm hover:shadow-brand"
              >
                Know More
              </Button>
              <Button
                as={Link}
                href="/signup"
                variant="outline"
                size="lg"
                className="border-2 border-brand-primary bg-white hover:bg-orange-50 btn-liquid btn-liquid-outline"
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
      {/* Lines + center logo */}
      <div
        className="relative z-[1] w-full flex items-center justify-center px-0 pb-12 mt-8"
        aria-hidden
      >
        <div className="relative w-full flex items-center justify-center">
          <HeroLines />
          <Image
            src="/images/hero_center_logo.png"
            alt="Greenway Mobility"
            width={120}
            height={120}
            className="absolute left-1/2 top-1/2 w-24 h-24 md:w-28 md:h-28 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-lg"
          />
        </div>
      </div>
    </Section>
  )
}
