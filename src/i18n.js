import { createContext, useContext, useState } from 'react'

const translations = {
  it: {
    // Login
    tagline1: 'Le tue abitudini.',
    tagline2: 'Il tuo ritmo.',
    tagline3: 'La tua versione migliore.',
    loginTab: 'Accedi',
    signupTab: 'Registrati',
    username: 'Username',
    email: 'Email',
    password: 'Password',
    usernamePlaceholder: 'il_tuo_nome',
    emailPlaceholder: 'nome@email.com',
    loginBtn: 'Entra',
    signupBtn: 'Crea account',
    signupSuccess: 'Account creato! Controlla la tua email per confermare.',

    // Dashboard - Sidebar
    defaultUser: 'Utente',
    navTracker: 'Tracker',
    navMental: 'Mental State',
    navProgress: 'Progress',
    logout: 'Esci',

    // Dashboard - Header
    habits: 'abitudini',
    completed: 'completati',

    // Dashboard - Tracker
    habitHeader: 'Abitudine',
    delete: 'Elimina',
    habitPlaceholder: 'Nome abitudine...',
    add: 'Aggiungi',
    cancel: 'Annulla',
    newHabit: '+ Nuova abitudine',

    // Dashboard - Mental State
    howAreYou: 'Come stai oggi?',
    mood: 'Umore',
    motivation: 'Motivazione',
    freeNotes: 'Note libere',
    notePlaceholder: 'Come è andata oggi?',
    thisMonth: 'Questo mese',

    // Dashboard - Progress
    habitProgress: 'Avanzamento abitudini',
    days: 'giorni',
    totalCompletions: 'completamenti totali',
    globalRate: 'tasso globale',
    activeHabits: 'abitudini attive',
  },
  en: {
    // Login
    tagline1: 'Your habits.',
    tagline2: 'Your rhythm.',
    tagline3: 'Your best self.',
    loginTab: 'Log in',
    signupTab: 'Sign up',
    username: 'Username',
    email: 'Email',
    password: 'Password',
    usernamePlaceholder: 'your_name',
    emailPlaceholder: 'name@email.com',
    loginBtn: 'Enter',
    signupBtn: 'Create account',
    signupSuccess: 'Account created! Check your email to confirm.',

    // Dashboard - Sidebar
    defaultUser: 'User',
    navTracker: 'Tracker',
    navMental: 'Mental State',
    navProgress: 'Progress',
    logout: 'Log out',

    // Dashboard - Header
    habits: 'habits',
    completed: 'completed',

    // Dashboard - Tracker
    habitHeader: 'Habit',
    delete: 'Delete',
    habitPlaceholder: 'Habit name...',
    add: 'Add',
    cancel: 'Cancel',
    newHabit: '+ New habit',

    // Dashboard - Mental State
    howAreYou: 'How are you today?',
    mood: 'Mood',
    motivation: 'Motivation',
    freeNotes: 'Free notes',
    notePlaceholder: 'How was your day?',
    thisMonth: 'This month',

    // Dashboard - Progress
    habitProgress: 'Habit progress',
    days: 'days',
    totalCompletions: 'total completions',
    globalRate: 'global rate',
    activeHabits: 'active habits',
  }
}

const LangContext = createContext()

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'it')

  const toggleLang = () => {
    const next = lang === 'it' ? 'en' : 'it'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  const t = (key) => translations[lang][key] || key

  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
