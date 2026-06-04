'use client'

export default function SectionHeader({
  tagText,
  title,
  subtitle,
  showDot = true,
  tagClassName = 'bg-brand-primary',
  className = '',
  titleAs: TitleTag = 'h2',
}) {
  return (
    <div className={className}>
      {tagText && (
        <div
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-white mb-4 ${tagClassName}`}
        >
          {showDot && <span className="w-2 h-2 rounded-full bg-white/90" aria-hidden />}
          {tagText}
        </div>
      )}
      <TitleTag className="text-3xl md:text-4xl font-bold text-brand-dark mb-3">{title}</TitleTag>
      {subtitle && <p className="text-gray-600 text-lg">{subtitle}</p>}
    </div>
  )
}
