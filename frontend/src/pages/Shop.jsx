import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient'
import { useCart } from '../lib/useCart'
import ShoppingCart from '../components/ShoppingCart'

export default function Shop() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const cart = useCart()

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const { data: prods, error } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(100)
        if (error) throw error
        setProducts(prods || [])
        const cats = Array.from(new Set((prods || []).map(p => p.category).filter(Boolean)))
        setCategories(cats)
      } catch (err) {
        console.error('Error fetching products', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return (
    <div className="page shop-page container">
      <h1 className="text-2xl font-semibold mb-4">Магазин</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="mb-4">
            <h3 className="font-medium">Категории</h3>
            <div className="flex gap-2 mt-2">
              {loading ? <div>Загрузка...</div> : (categories.length ? categories.map(c => <button key={c} className="px-3 py-1 rounded bg-slate-100">{c}</button>) : <div>Нет категорий</div>)}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Товары</h3>
            {loading ? <div>Загрузка товаров...</div> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.length ? products.map(p => (
                  <div key={p.id} className="bg-white rounded-lg p-4 shadow-sm flex flex-col">
                    {p.image_url && <img src={p.image_url} alt={p.title} className="w-full h-44 object-cover rounded" />}
                    <div className="mt-2 flex-1">
                      <h4 className="font-semibold">{p.title}</h4>
                      <div className="text-sm text-slate-600">{p.category}</div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="font-medium">€{p.price}</div>
                      <button className="rounded bg-indigo-600 text-white px-3 py-1" onClick={() => cart.add(p)}>Add</button>
                    </div>
                  </div>
                )) : <div>Нет товаров</div>}
              </div>
            )}
          </div>
        </div>

        <aside>
          <ShoppingCart cart={cart} />
        </aside>
      </div>

      <p className="mt-6 text-sm text-slate-500">Добавлять товары можно через панель администратора (или через SQL insert в Supabase).</p>
    </div>
  )
}
