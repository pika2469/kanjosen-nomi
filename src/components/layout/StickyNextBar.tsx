type StickyNextBarProps = {
  label?: string
  onNext: () => void
  disabled?: boolean
  hint?: string
}

export function StickyNextBar({
  label = '次へ',
  onNext,
  disabled = false,
  hint,
}: StickyNextBarProps) {
  return (
    <section className="mt-8 w-full">
      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className="btn-cta"
        // {[
        //   // ★常に横幅いっぱい
        //   'w-full rounded-2xl px-4 py-3 text-base font-bold transition',
        //   disabled
        //     ? 'bg-emerald-200 text-emerald-400'
        //     : [
        //         'bg-emerald-600 text-white',
        //         'hover:bg-emerald-700',
        //         'active:bg-emerald-800 active:scale-[0.99]',
        //         'shadow-md shadow-emerald-200/60',
        //       ].join(' '),
        // ].join(' ')}
      >
        {label}
      </button>

      {hint && (
        <p className="mt-2 text-center text-[11px] text-slate-500">{hint}</p>
      )}

      {/* ページ末尾の余白（ホームバー / フッターとの干渉防止） */}
      <div className="h-6" />
      <div className="h-[env(safe-area-inset-bottom)]" />
    </section>
  )
}
