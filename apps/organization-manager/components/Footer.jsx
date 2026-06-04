import Link from 'next/link'
import Logo from './common/Logo'

function SocialIconButton({ href, label, children }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="w-12 h-12 rounded-full border border-white flex items-center justify-center text-white hover:opacity-90 transition-opacity"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  )
}

function Icon({ children }) {
  return <span className="w-5 h-5 inline-flex items-center justify-center">{children}</span>
}

export default function Footer() {
  return (
    <footer className="bg-[#111111] px-8 py-20 md:px-16 md:py-32">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-start justify-between gap-12 md:gap-20">
        <div className="flex flex-col">
          <div className="flex items-start gap-4">
            <div className="shrink-0 pt-1 scale-[1.15] origin-top-left">
              <Logo />
            </div>
            <span className="text-white font-semibold text-lg leading-[1.05] pt-2">
              Greenway
              <br />
              Mobility
            </span>
          </div>
          <p className="text-white/35 text-2xl mt-6 leading-snug">Drive the green future</p>
          <p className="text-white/80 text-base mt-10 mb-4">Connect With Us</p>
          <div className="flex gap-3">
            <SocialIconButton href="#" label="Facebook">
              <Icon>
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
                  <path d="M14 8.5V7.2C14 6.54 14.54 6 15.2 6H17V3H15.2C12.88 3 11 4.88 11 7.2V8.5H9V11.5H11V21H14V11.5H16.7L17 8.5H14Z" fill="currentColor" />
                </svg>
              </Icon>
            </SocialIconButton>
            <SocialIconButton href="#" label="Instagram">
              <Icon>
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
                  <path d="M7.5 2.8H16.5C19.12 2.8 21.2 4.88 21.2 7.5V16.5C21.2 19.12 19.12 21.2 16.5 21.2H7.5C4.88 21.2 2.8 19.12 2.8 16.5V7.5C2.8 4.88 4.88 2.8 7.5 2.8ZM12 8.2C9.9 8.2 8.2 9.9 8.2 12C8.2 14.1 9.9 15.8 12 15.8C14.1 15.8 15.8 14.1 15.8 12C15.8 9.9 14.1 8.2 12 8.2ZM17.4 6.6C16.83 6.6 16.4 7.03 16.4 7.6C16.4 8.17 16.83 8.6 17.4 8.6C17.97 8.6 18.4 8.17 18.4 7.6C18.4 7.03 17.97 6.6 17.4 6.6Z" fill="currentColor" />
                </svg>
              </Icon>
            </SocialIconButton>
            <SocialIconButton href="#" label="YouTube">
              <Icon>
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
                  <path d="M21.5 7.7C21.5 6.6 20.7 5.7 19.7 5.6C17.7 5.3 15 5 12 5C9 5 6.3 5.3 4.3 5.6C3.3 5.7 2.5 6.6 2.5 7.7C2.3 9.1 2.2 10.5 2.2 12C2.2 13.5 2.3 14.9 2.5 16.3C2.5 17.4 3.3 18.3 4.3 18.4C6.3 18.7 9 19 12 19C15 19 17.7 18.7 19.7 18.4C20.7 18.3 21.5 17.4 21.5 16.3C21.7 14.9 21.8 13.5 21.8 12C21.8 10.5 21.7 9.1 21.5 7.7ZM10.3 15.3V8.7L16 12L10.3 15.3Z" fill="currentColor" />
                </svg>
              </Icon>
            </SocialIconButton>
            <SocialIconButton href="#" label="Twitter">
              <Icon>
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
                  <path d="M18.9 3H21.7L15.6 10L22.8 21H17.2L12.8 14.4L7 21H4.2L10.8 13.5L3.9 3H9.6L13.5 8.9L18.9 3ZM18 19.2H19.6L8.7 4.7H7L18 19.2Z" fill="currentColor" />
                </svg>
              </Icon>
            </SocialIconButton>
          </div>
        </div>

        <div className="flex flex-col gap-12 md:gap-16 md:ml-auto md:items-start md:text-left md:pt-2">
          <div>
            <p className="text-white text-lg font-semibold mb-5">Navigation</p>
            <div className="flex flex-wrap gap-x-12 gap-y-5">
              <Link href="/" className="text-white/70 hover:text-white text-base transition-colors">Home</Link>
              <Link href="/about" className="text-white/70 hover:text-white text-base transition-colors">About us</Link>
              <Link href="/pm" className="text-white/70 hover:text-white text-base transition-colors">Products</Link>
              <Link href="/contact" className="text-white/70 hover:text-white text-base transition-colors">Contact Us</Link>
            </div>
          </div>
          <div>
            <p className="text-white text-lg font-semibold mb-5">Company</p>
            <div className="flex flex-wrap gap-x-12 gap-y-5">
              <Link href="/resources" className="text-white/70 hover:text-white text-base transition-colors">Resources</Link>
              <Link href="/how-we-work" className="text-white/70 hover:text-white text-base transition-colors">How we work</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
