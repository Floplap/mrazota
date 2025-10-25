import React from 'react'

export default function PostCard({ post }) {
  return (
    <article className="group relative rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm hover:shadow-lg transition">
      <div className="relative h-44 sm:h-52">
        <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />
        <div className="absolute left-4 bottom-4 right-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-800 backdrop-blur">
            {post.tag}
          </span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-indigo-600">{post.title}</h3>
        <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>

        <div className="mt-4 flex items-center justify-between">
          <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition inline-flex items-center gap-2">
            Read
          </a>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <div className="rounded-full bg-slate-100 w-8 h-8 flex items-center justify-center text-xs font-semibold">M</div>
            <div>
              <div className="text-xs font-medium">Mrazota</div>
              <div className="text-xs text-slate-400">Oct 21</div>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
