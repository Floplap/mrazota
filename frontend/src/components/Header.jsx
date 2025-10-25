import React from 'react'
import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-white/60 border-b border-slate-100">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 shadow-md flex items-center justify-center transform-gpu hover:scale-105 transition">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="currentColor" className="opacity-95" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">Mrazota</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-700">
            <Link to="/shop" className="nav-link">Shop</Link>
            <Link to="/media" className="nav-link">Media</Link>
            <Link to="/games" className="nav-link">Games</Link>
            <Link to="/messenger" className="nav-link">Messenger</Link>
            <Link to="/admin/products" className="nav-link">Admin</Link>
            <Link to="/admin/orders" className="nav-link">Orders</Link>
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-indigo-600 font-medium shadow-sm hover:bg-indigo-100 transition">Sign in</Link>
          </nav>

          <div className="md:hidden">
            <button className="inline-flex items-center justify-center rounded-lg p-2 bg-white border border-slate-100 shadow-sm hover:bg-slate-50 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
