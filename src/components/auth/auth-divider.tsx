export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-slate-200 dark:border-cyan-500/20" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-wide">
        <span className="bg-white px-3 text-slate-500 dark:bg-[#0f1a35] dark:text-slate-400">
          or
        </span>
      </div>
    </div>
  )
}
