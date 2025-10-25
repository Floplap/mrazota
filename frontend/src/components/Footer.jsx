import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-100 bg-white">
      <div className="container py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-pink-500 shadow flex items-center justify-center text-white font-bold">M</div>
            <div>
              <div className="font-semibold">Mrazota</div>
              <div className="text-sm text-slate-500">Design system & UI patterns</div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-600">
            <Link to="/about" className="hover:text-slate-900 transition">About</Link>
            <Link to="/contact" className="hover:text-slate-900 transition">Contact</Link>
            <Link to="/privacy" className="hover:text-slate-900 transition">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-900 transition">Terms</Link>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-slate-500">© {new Date().getFullYear()} Mrazota. All rights reserved.</div>
          <div className="flex items-center gap-3">
            <a href="#" className="text-slate-500 hover:text-slate-900 transition">Facebook</a>
            <a href="#" className="text-slate-500 hover:text-slate-900 transition">Twitter</a>
            <a href="#" className="text-slate-500 hover:text-slate-900 transition">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
