import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(r => setUser(r.data?.session?.user ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => {
      listener?.subscription?.unsubscribe?.()
    }
  }, [])

  const register = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({ email, password }, { data: { name } })
      if (error) throw error
      alert('Registration successful — please check your email to confirm (if required).')
    } catch (err) {
      console.error(err)
      alert(err.message || 'Registration error')
    } finally {
      setLoading(false)
    }
  }

  const login = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setUser(data.user || null)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Login error')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <div className="page auth-page container">
      <h1 className="text-2xl font-semibold mb-4">Auth</h1>

      {user ? (
        <div>
          <div className="mb-4">Signed in as <strong>{user.email}</strong></div>
          <button className="rounded bg-red-500 text-white px-4 py-2" onClick={logout}>Sign out</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <input className="border p-2 rounded" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />

          <div className="flex gap-2">
            <button className="rounded bg-indigo-600 text-white px-4 py-2" onClick={register} disabled={loading}>Register</button>
            <button className="rounded border px-4 py-2" onClick={login} disabled={loading}>Login</button>
          </div>
        </div>
      )}
    </div>
  )
}
