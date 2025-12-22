import type { ReactNode } from 'react'

type CardSectionProps = {
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
}

export function CardSection({
  title,
  subtitle,
  children,
  className = '',
}: CardSectionProps) {
  return (
    <section
      className={[
        'rounded-2xl border bg-white/80 p-3 shadow-sm',
        className,
      ].join(' ')}
    >
      {(title || subtitle) && (
        <div className="mb-3 space-y-1">
          {title && (
            <p className="text-sm font-semibold text-slate-800 text-left">
              {title}
            </p>
          )}
          {subtitle && (
            <p className="text-[11px] text-slate-500 text-left">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </section>
  )
}
