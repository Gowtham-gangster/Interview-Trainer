export function AuthBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden bg-slate-50 dark:bg-[#070d1f]"
      aria-hidden
    >
      <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-violet-600/20 blur-[100px]" />
      <div className="absolute right-1/4 top-1/3 h-80 w-80 rounded-full bg-cyan-500/15 blur-[120px]" />
      <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-600/10 blur-[80px]" />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  )
}
