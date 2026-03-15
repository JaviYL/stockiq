/**
 * Profile persistence service
 * Stores investor profile data in localStorage
 */

const STORAGE_KEY = 'stockiq_profile'
const ACTIVITY_KEY = 'stockiq_activity_log'

const DEFAULT_PROFILE = {
  name: '',
  email: '',
  avatar: null, // initials-based
  experienceLevel: 'intermediate', // beginner, intermediate, advanced
  riskProfile: 'moderate', // conservative, moderate, aggressive
  investmentHorizon: 'medium', // short (< 2y), medium (2-7y), long (> 7y)
  favoriteSectors: [],
  targetAnnualReturn: 10, // %
  targetPortfolioValue: 100000, // in user's currency
  targetYears: 10,
  country: '',
  currency: 'USD',
  createdAt: null,
}

export function getProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
    }
  } catch {}
  return { ...DEFAULT_PROFILE }
}

export function saveProfile(profile) {
  const data = { ...profile }
  if (!data.createdAt) data.createdAt = new Date().toISOString()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  return data
}

export function getProfileInitials(profile) {
  if (!profile?.name) return '?'
  const parts = profile.name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0].substring(0, 2).toUpperCase()
}

// ─── Activity Log ───

export function getActivityLog() {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function logActivity(action, detail = '') {
  const log = getActivityLog()
  log.unshift({
    action,
    detail,
    timestamp: new Date().toISOString(),
  })
  // Keep last 100 entries
  const trimmed = log.slice(0, 100)
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(trimmed))
  return trimmed
}

// Predefined activity types
export const ACTIVITY = {
  WATCHLIST_ADD: 'watchlist_add',
  WATCHLIST_REMOVE: 'watchlist_remove',
  PORTFOLIO_CREATE: 'portfolio_create',
  PORTFOLIO_DELETE: 'portfolio_delete',
  HOLDING_ADD: 'holding_add',
  HOLDING_REMOVE: 'holding_remove',
  DCF_ANALYSIS: 'dcf_analysis',
  AI_ANALYSIS: 'ai_analysis',
  STOCK_VIEW: 'stock_view',
  PROFILE_UPDATE: 'profile_update',
}

export function getActivityLabel(action, isEs = true) {
  const labels = {
    [ACTIVITY.WATCHLIST_ADD]: isEs ? 'Añadido a watchlist' : 'Added to watchlist',
    [ACTIVITY.WATCHLIST_REMOVE]: isEs ? 'Eliminado de watchlist' : 'Removed from watchlist',
    [ACTIVITY.PORTFOLIO_CREATE]: isEs ? 'Cartera creada' : 'Portfolio created',
    [ACTIVITY.PORTFOLIO_DELETE]: isEs ? 'Cartera eliminada' : 'Portfolio deleted',
    [ACTIVITY.HOLDING_ADD]: isEs ? 'Empresa añadida' : 'Company added',
    [ACTIVITY.HOLDING_REMOVE]: isEs ? 'Empresa eliminada' : 'Company removed',
    [ACTIVITY.DCF_ANALYSIS]: isEs ? 'Análisis DCF' : 'DCF analysis',
    [ACTIVITY.AI_ANALYSIS]: isEs ? 'Análisis IA' : 'AI analysis',
    [ACTIVITY.STOCK_VIEW]: isEs ? 'Empresa consultada' : 'Company viewed',
    [ACTIVITY.PROFILE_UPDATE]: isEs ? 'Perfil actualizado' : 'Profile updated',
  }
  return labels[action] || action
}
