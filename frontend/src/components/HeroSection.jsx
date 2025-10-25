import React from 'react'

export default function HeroSection() {
  return (
    <section className="mt-8 sm:mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center container">
      <div className="max-w-2xl">
        <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 mb-4 shadow-sm">
          New ✦ UI Kit
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
          Beautiful interfaces, engineered for performance and accessibility.
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-xl">
          Pixel-perfect components and thoughtful interactions. Build faster with reusable patterns,
          micro-interactions and a robust Tailwind utility base.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#"
            className="inline-flex items-center gap-3 rounded-lg bg-gradient-to-br from-indigo-600 to-pink-500 px-5 py-3 text-white font-semibold shadow-lg transform-gpu hover:-translate-y-0.5 hover:scale-105 transition"
          >
            Get started
          </a>

          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Live demo
          </a>
        </div>
      </div>

      <div className="relative">
        <div className="rounded-2xl overflow-hidden shadow-2xl transform-gpu transition hover:scale-102">
          <div className="relative h-64 sm:h-80 lg:h-96">
            <img
              src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1600&auto=format&fit=crop"
              alt="Hero"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-pink-500/10 opacity-80" style={{ mixBlendMode: 'screen' }} />
            <div className="absolute left-6 bottom-6 right-6 sm:left-8 sm:bottom-8">
              <div className="rounded-xl bg-white/90 backdrop-blur-md p-4 sm:p-6 shadow-lg border border-white/60">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">Latest release</div>
                    <div className="mt-1 text-base font-medium">Component library v2.3</div>
                    <div className="mt-1 text-sm text-slate-600">Includes accessible dialogs and tabs</div>
                  </div>
                  <div>
                    <a href="#" className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition">
                      Try it
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
