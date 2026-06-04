'use client'

import Image from 'next/image'

const iconMap = {
  mail: { src: '/logo/mail.png', alt: 'Email' },
  phone: { src: '/logo/phone.png', alt: 'Phone' },
  location: { src: null, alt: 'Location' },
}

export default function ContactCard({ icon, label, href }) {
  const content = (
    <>
      <div className="size-12 shrink-0 rounded-lg bg-[#8C8C8C1F] border border-[#8C8C8C3A] flex items-center justify-center shadow-sm">
        {icon === 'location' ? (
          <svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-800"
          >
            <path d="M12 21c4.5-4.5 7.5-7.5 7.5-10.5a7.5 7.5 0 10-15 0c0 3 3 6 7.5 10.5z" fill="none" />
            <circle cx="12" cy="10.5" r="2.5" fill="none" />
          </svg>
        ) : (
          <Image
            src={iconMap[icon].src}
            alt={iconMap[icon].alt}
            width={24}
            height={24}
            className="object-contain"
          />
        )}
      </div>
      <span className="font-medium text-gray-900">{label}</span>
    </>
  )

  const className =
    'flex items-center gap-4 rounded-xl border border-[#8C8C8C3A] bg-[#8C8C8C1F] backdrop-blur-sm shadow-sm px-4 py-3.5 transition-all duration-300 hover:shadow-md'

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    )
  }

  return <div className={className}>{content}</div>
}
