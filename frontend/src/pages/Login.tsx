import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setMsg(error.message)
    else setMsg('Check your email to confirm or logged in')
  }

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMsg(error.message)
    else {
      setMsg('Signed in')
      onSuccess && onSuccess()
    }
  }

  return (
    <div>
      <h2>Login / Sign up</h2>
      <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <div style={{ marginTop: 8 }}>
        <button onClick={signIn}>Sign in</button>
        <button onClick={signUp}>Sign up</button>
      </div>
      {msg && <div style={{ marginTop: 8 }}>{msg}</div>}
    </div>
  )
}
