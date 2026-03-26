import { useState } from 'react'
import { supabase } from './supabaseClient'
import { useLang } from './i18n'

export default function Login() {
  const { lang, toggleLang, t } = useLang()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    })
    if (error) {
      setError(error.message)
    } else {
      // Update profile with username
      if (data.user) {
        await supabase.from('profiles').upsert({ id: data.user.id, username })
      }
      setSuccess(t('signupSuccess'))
    }
    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-brand">
          <span className="brand-mark">M</span>
          <span className="brand-name">Mindset Stack</span>
        </div>
        <div className="login-tagline">
          <h1>{t('tagline1')}<br />{t('tagline2')}<br />{t('tagline3')}</h1>
        </div>
        <div className="login-decoration">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={`deco-cell ${Math.random() > 0.5 ? 'active' : ''}`} />
          ))}
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-wrapper">
          <div className="login-top-bar">
            <div className="login-tabs">
              <button
                className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
                onClick={() => { setMode('login'); setError(''); setSuccess('') }}
              >
                {t('loginTab')}
              </button>
              <button
                className={`tab-btn ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
              >
                {t('signupTab')}
              </button>
            </div>
            <button className="lang-toggle" onClick={toggleLang}>
              {lang === 'it' ? 'EN' : 'IT'}
            </button>
          </div>

          <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="login-form">
            {mode === 'signup' && (
              <div className="field-group">
                <label className="field-label">{t('username')}</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder={t('usernamePlaceholder')}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="field-group">
              <label className="field-label">{t('email')}</label>
              <input
                type="email"
                className="field-input"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label">{t('password')}</label>
              <input
                type="password"
                className="field-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && <p className="error-msg">{error}</p>}
            {success && <p className="success-msg">{success}</p>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? '...' : mode === 'login' ? t('loginBtn') : t('signupBtn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
