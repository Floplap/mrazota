import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
  const [open, setOpen] = useState(false)

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Store', href: '/store' },
    { name: 'AI Tools', href: '/ai-tools' },
    { name: 'Forum', href: '/forum' },
    { name: 'Arcade', href: '/games' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-black/30 shadow-lg px-4 py-3 border-b border-purple-500/30">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <a className="flex items-center cursor-pointer">
              <Image
                src="/assets/legacy-logo.png"
                alt="MRAZOTA logo"
                width={32}
                height={32}
                className="w-8 h-8 mr-2 glow-animation"
                priority={false}
              />
              <span className="text-2xl font-bold text-gradient font-['Orbitron',_sans-serif]">MRAZOTA</span>
            </a>
          </Link>
        </div>

        <nav className="hidden md:flex space-x-6">
          {navItems.map((it) => (
            <Link key={it.href} href={it.href}>
              <a className="text-lg font-medium text-gray-300 hover:text-white transition-colors duration-300 relative group">
                {it.name}
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </a>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/store">
            <a className="inline-flex items-center gap-2 rounded-full bg-pink-500/90 px-3 py-1 text-white font-semibold shadow hover:opacity-95 transition">Store</a>
          </Link>

          <div className="md:hidden">
            <button onClick={() => setOpen(!open)} className="inline-flex items-center justify-center rounded-lg p-2 bg-transparent text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>

        {open && (
          <div className="absolute top-[64px] left-0 w-full bg-black/80 backdrop-blur-md flex flex-col p-4 md:hidden border-t border-purple-500/30">
            {navItems.map((it) => (
              <Link key={it.href} href={it.href}>
                <a className="py-2 text-lg font-medium text-gray-300 hover:text-white transition-colors">{it.name}</a>
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
