import React, { useEffect, useState } from 'react'
import Login from './pages/Login'
import Feed from './pages/Feed'
import Products from './pages/Products'
import Checkout from './pages/Checkout'

export default function App() {
  const [route, setRoute] = useState(window.location.pathname || '/')

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = (path: string) => {
    window.history.pushState({}, '', path)
    setRoute(path)
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <header style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <button onClick={() => navigate('/')}>Home</button>
        <button onClick={() => navigate('/login')}>Login</button>
        <button onClick={() => navigate('/feed')}>Feed</button>
        <button onClick={() => navigate('/products')}>Products</button>
        <button onClick={() => navigate('/checkout')}>Checkout</button>
      </header>

      <main>
        {route === '/' && <div>Welcome — use the nav to explore.</div>}
        {route === '/login' && <Login onSuccess={() => navigate('/feed')} />}
        {route === '/feed' && <Feed />}
        {route === '/products' && <Products onAddToCart={() => navigate('/checkout')} />}
        {route === '/checkout' && <Checkout onDone={() => navigate('/feed')} />}
      </main>
    </div>
  )
}
