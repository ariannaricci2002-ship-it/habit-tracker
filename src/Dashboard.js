import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { format, getDaysInMonth } from 'date-fns'
import { it as itLocale } from 'date-fns/locale'
import { enUS as enLocale } from 'date-fns/locale'
import { useLang } from './i18n'

const COLOR_MAP = {
  teal: '#1D9E75',
  pink: '#D4537E',
  purple: '#7F77DD',
  amber: '#BA7517',
  blue: '#378ADD',
  green: '#639922',
  coral: '#D85A30',
}

const MOOD_LABELS = ['😐', '🙁', '😊', '😄', '🤩']
const MOTIVATION_LABELS = ['💤', '😴', '⚡', '🔥', '🚀']

export default function Dashboard({ session }) {
  const { lang, toggleLang, t } = useLang()
  const [habits, setHabits] = useState([])
  const [completions, setCompletions] = useState({})
  const [mentalState, setMentalState] = useState({})
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState('tracker')
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitColor, setNewHabitColor] = useState('teal')
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')

  const dateLocale = lang === 'it' ? itLocale : enLocale
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(currentDate)
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const monthKey = format(currentDate, 'yyyy-MM')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const userId = session.user.id

    // Profile
    const { data: profile } = await supabase
      .from('profiles').select('username').eq('id', userId).single()
    if (profile) setUsername(profile.username)

    // Habits
    const { data: habitsData } = await supabase
      .from('habits').select('*').eq('user_id', userId).order('position')
    setHabits(habitsData || [])

    // Completions for this month
    const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = `${year}-${String(month + 1).padStart(2, '0')}-${daysInMonth}`
    const { data: compData } = await supabase
      .from('habit_completions')
      .select('habit_id, completed_date')
      .eq('user_id', userId)
      .gte('completed_date', firstDay)
      .lte('completed_date', lastDay)

    const compMap = {}
    ;(compData || []).forEach(c => {
      if (!compMap[c.habit_id]) compMap[c.habit_id] = {}
      compMap[c.habit_id][c.completed_date] = true
    })
    setCompletions(compMap)

    // Mental states for this month
    const { data: mentalData } = await supabase
      .from('mental_states')
      .select('*')
      .eq('user_id', userId)
      .gte('state_date', firstDay)
      .lte('state_date', lastDay)

    const mentalMap = {}
    ;(mentalData || []).forEach(m => { mentalMap[m.state_date] = m })
    setMentalState(mentalMap)

    setLoading(false)
  }, [session.user.id, year, month, daysInMonth])

  useEffect(() => { fetchAll() }, [fetchAll])

  const toggleCompletion = async (habitId, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const isCompleted = completions[habitId]?.[dateStr]

    setCompletions(prev => ({
      ...prev,
      [habitId]: { ...prev[habitId], [dateStr]: !isCompleted }
    }))

    if (isCompleted) {
      await supabase.from('habit_completions')
        .delete()
        .eq('habit_id', habitId)
        .eq('completed_date', dateStr)
    } else {
      await supabase.from('habit_completions').insert({
        habit_id: habitId,
        user_id: session.user.id,
        completed_date: dateStr
      })
    }
  }

  const saveMentalState = async (date, field, value) => {
    const existing = mentalState[date]
    const newData = { ...existing, [field]: value, state_date: date, user_id: session.user.id }

    setMentalState(prev => ({ ...prev, [date]: newData }))

    await supabase.from('mental_states').upsert(newData, { onConflict: 'user_id,state_date' })
  }

  const addHabit = async () => {
    if (!newHabitName.trim()) return
    const { data } = await supabase.from('habits').insert({
      user_id: session.user.id,
      name: newHabitName.trim(),
      goal: daysInMonth,
      color: newHabitColor,
      position: habits.length
    }).select().single()
    if (data) {
      setHabits(prev => [...prev, data])
      setNewHabitName('')
      setShowAddHabit(false)
    }
  }

  const deleteHabit = async (habitId) => {
    await supabase.from('habits').delete().eq('id', habitId)
    setHabits(prev => prev.filter(h => h.id !== habitId))
  }

  const getHabitCount = (habitId) => {
    return Object.values(completions[habitId] || {}).filter(Boolean).length
  }

  const getTotalCompleted = () => {
    return habits.reduce((sum, h) => sum + getHabitCount(h.id), 0)
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const todayMentalState = mentalState[todayStr]

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <span className="brand-mark">M</span>
            <span className="brand-name">Mindset Stack</span>
          </div>
          <div className="sidebar-user">
            <div className="user-avatar">{username ? username[0].toUpperCase() : '?'}</div>
            <span className="user-name">{username || t('defaultUser')}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: 'tracker', icon: '▦', label: t('navTracker') },
            { id: 'mental', icon: '◯', label: t('navMental') },
            { id: 'progress', icon: '↗', label: t('navProgress') },
          ].map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="lang-toggle" onClick={toggleLang}>
            {lang === 'it' ? 'EN' : 'IT'}
          </button>
          <button className="logout-btn" onClick={() => supabase.auth.signOut()}>
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {/* Header */}
        <div className="content-header">
          <div className="month-nav">
            <button className="month-btn" onClick={prevMonth}>←</button>
            <h2 className="month-title">
              {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
            </h2>
            <button className="month-btn" onClick={nextMonth}>→</button>
          </div>
          <div className="header-stats">
            <div className="stat-pill">
              <span className="stat-num">{habits.length}</span>
              <span className="stat-lbl">{t('habits')}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num">{getTotalCompleted()}</span>
              <span className="stat-lbl">{t('completed')}</span>
            </div>
          </div>
        </div>

        {loading && <div className="spinner" />}

        {/* TRACKER TAB */}
        {!loading && activeTab === 'tracker' && (
          <div className="tracker-section">
            <div className="habit-grid-wrapper">
              <div className="habit-grid">
                {/* Header row */}
                <div className="grid-habit-col">
                  <span className="grid-header">{t('habitHeader')}</span>
                </div>
                <div className="grid-days-row">
                  {days.map(d => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                    const isToday = dateStr === todayStr
                    return (
                      <div key={d} className={`day-header ${isToday ? 'today' : ''}`}>
                        {d}
                      </div>
                    )
                  })}
                  <div className="grid-header count-header">✓</div>
                </div>

                {/* Habit rows */}
                {habits.map(habit => (
                  <div key={habit.id} className="habit-row">
                    <div className="habit-name-cell">
                      <span
                        className="habit-color-dot"
                        style={{ background: COLOR_MAP[habit.color] || '#1D9E75' }}
                      />
                      <span className="habit-label">{habit.name}</span>
                      <button
                        className="delete-habit-btn"
                        onClick={() => deleteHabit(habit.id)}
                        title={t('delete')}
                      >×</button>
                    </div>
                    <div className="habit-cells-row">
                      {days.map(d => {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                        const done = completions[habit.id]?.[dateStr]
                        const isFuture = dateStr > todayStr && monthKey === format(new Date(), 'yyyy-MM')
                        return (
                          <button
                            key={d}
                            className={`cell-btn ${done ? 'done' : ''} ${isFuture ? 'future' : ''}`}
                            style={done ? { background: COLOR_MAP[habit.color] || '#1D9E75' } : {}}
                            onClick={() => !isFuture && toggleCompletion(habit.id, d)}
                            disabled={isFuture}
                            title={dateStr}
                          />
                        )
                      })}
                      <div className="count-cell">
                        {getHabitCount(habit.id)}/{daysInMonth}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add habit row */}
                {showAddHabit ? (
                  <div className="add-habit-row">
                    <input
                      autoFocus
                      className="add-habit-input"
                      placeholder={t('habitPlaceholder')}
                      value={newHabitName}
                      onChange={e => setNewHabitName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addHabit()}
                    />
                    <div className="color-picker">
                      {Object.entries(COLOR_MAP).map(([name, hex]) => (
                        <button
                          key={name}
                          className={`color-dot ${newHabitColor === name ? 'selected' : ''}`}
                          style={{ background: hex }}
                          onClick={() => setNewHabitColor(name)}
                        />
                      ))}
                    </div>
                    <div className="add-habit-actions">
                      <button className="confirm-btn" onClick={addHabit}>{t('add')}</button>
                      <button className="cancel-btn" onClick={() => setShowAddHabit(false)}>{t('cancel')}</button>
                    </div>
                  </div>
                ) : (
                  <button className="add-habit-trigger" onClick={() => setShowAddHabit(true)}>
                    {t('newHabit')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MENTAL STATE TAB */}
        {!loading && activeTab === 'mental' && (
          <div className="mental-section">
            <div className="mental-today">
              <h3 className="section-title">{t('howAreYou')}</h3>
              <div className="mental-today-card">
                <div className="mental-field">
                  <span className="mental-label">{t('mood')}</span>
                  <div className="emoji-scale">
                    {MOOD_LABELS.map((emoji, i) => (
                      <button
                        key={i}
                        className={`emoji-btn ${todayMentalState?.mood === i + 1 ? 'selected' : ''}`}
                        onClick={() => saveMentalState(todayStr, 'mood', i + 1)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mental-field">
                  <span className="mental-label">{t('motivation')}</span>
                  <div className="emoji-scale">
                    {MOTIVATION_LABELS.map((emoji, i) => (
                      <button
                        key={i}
                        className={`emoji-btn ${todayMentalState?.motivation === i + 1 ? 'selected' : ''}`}
                        onClick={() => saveMentalState(todayStr, 'motivation', i + 1)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mental-field">
                  <span className="mental-label">{t('freeNotes')}</span>
                  <textarea
                    className="mental-note"
                    placeholder={t('notePlaceholder')}
                    value={todayMentalState?.note || ''}
                    onChange={e => saveMentalState(todayStr, 'note', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="mental-history">
              <h3 className="section-title">{t('thisMonth')}</h3>
              <div className="mental-calendar">
                {days.map(d => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                  const state = mentalState[dateStr]
                  const isToday = dateStr === todayStr
                  const isFuture = dateStr > todayStr
                  return (
                    <div
                      key={d}
                      className={`mental-day-cell ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}`}
                      title={state?.note || ''}
                    >
                      <span className="mental-day-num">{d}</span>
                      {state?.mood && (
                        <span className="mental-day-emoji">{MOOD_LABELS[state.mood - 1]}</span>
                      )}
                      {!state?.mood && !isFuture && (
                        <span className="mental-day-empty">·</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* PROGRESS TAB */}
        {!loading && activeTab === 'progress' && (
          <div className="progress-section">
            <h3 className="section-title">{t('habitProgress')}</h3>
            <div className="progress-list">
              {habits.map(habit => {
                const count = getHabitCount(habit.id)
                const pct = Math.round((count / daysInMonth) * 100)
                const color = COLOR_MAP[habit.color] || '#1D9E75'
                return (
                  <div key={habit.id} className="progress-item">
                    <div className="progress-item-header">
                      <div className="progress-name">
                        <span className="habit-color-dot" style={{ background: color }} />
                        {habit.name}
                      </div>
                      <span className="progress-pct">{pct}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <div className="progress-count">{count} / {daysInMonth} {t('days')}</div>
                  </div>
                )
              })}
            </div>

            <div className="progress-summary">
              <div className="summary-card">
                <span className="summary-num">{getTotalCompleted()}</span>
                <span className="summary-lbl">{t('totalCompletions')}</span>
              </div>
              <div className="summary-card">
                <span className="summary-num">
                  {habits.length > 0
                    ? Math.round((getTotalCompleted() / (habits.length * daysInMonth)) * 100)
                    : 0}%
                </span>
                <span className="summary-lbl">{t('globalRate')}</span>
              </div>
              <div className="summary-card">
                <span className="summary-num">
                  {habits.filter(h => getHabitCount(h.id) > 0).length}
                </span>
                <span className="summary-lbl">{t('activeHabits')}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
