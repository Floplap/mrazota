import React from 'react'
import HeroSection from '../components/HeroSection'
import PostCard from '../components/PostCard'

const samplePosts = [
  { id:1, image: 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=1200&auto=format&fit=crop', title: 'New single released', excerpt: 'Listen to my latest track now', tag: 'Music' },
  { id:2, image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop', title: 'Live photos', excerpt: 'Concert photos from last week', tag: 'Photos' }
]

export default function Home(){
  return (
    <div className="page">
      <HeroSection />

      <section className="mt-12 container">
        <h2 className="text-2xl font-semibold mb-6">Latest posts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {samplePosts.map(p => <PostCard key={p.id} post={p} />)}
        </div>
      </section>
    </div>
  )
}
