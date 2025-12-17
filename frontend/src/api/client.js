/**
 * HTTP клиент для API.
 * Автоматически добавляет JWT токен к запросам.
 */

const API_URL = ''  // Пустая строка — используем proxy в dev, относительные пути в prod

// Получаем токен из store
const getToken = () => {
  try {
    const stored = localStorage.getItem('tochka-opory-storage')
    if (stored) {
      const data = JSON.parse(stored)
      return data.state?.token
    }
  } catch (e) {
    console.error('Failed to get token:', e)
  }
  return null
}

/**
 * Базовый запрос к API.
 */
async function request(endpoint, options = {}) {
  const token = getToken()
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }
  
  // Stringify body if it's an object
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body)
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, config)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }
  
  // Handle empty responses
  const text = await response.text()
  if (!text) return null
  
  return JSON.parse(text)
}

// =============================================
// AUTH API
// =============================================

export async function verifyAuth(initData) {
  return request('/auth/verify', {
    method: 'POST',
    body: { init_data: initData },
  })
}

export async function recoverAccount(recoveryCode) {
  return request('/auth/recover', {
    method: 'POST',
    body: { recovery_code: recoveryCode },
  })
}

export async function getMe() {
  return request('/auth/me')
}

// =============================================
// CHECKINS API
// =============================================

export async function createCheckin(data) {
  return request('/checkins', {
    method: 'POST',
    body: data,
  })
}

export async function getCheckins(limit = 30) {
  return request(`/checkins?limit=${limit}`)
}

export async function getTodayCheckin() {
  return request('/checkins/today')
}

// =============================================
// STREAK API
// =============================================

export async function getStreak() {
  return request('/streak')
}

// =============================================
// TESTS API
// =============================================

export async function getNextTest(checkinData = null) {
  const params = new URLSearchParams()
  if (checkinData) {
    if (checkinData.urge !== undefined) params.append('urge', checkinData.urge)
    if (checkinData.stress !== undefined) params.append('stress', checkinData.stress)
    if (checkinData.relapse !== undefined) params.append('relapse', checkinData.relapse)
    if (checkinData.note) params.append('note', checkinData.note)
  }
  const query = params.toString()
  return request(`/tests/next${query ? '?' + query : ''}`)
}

export async function submitTest(testCode, answers) {
  // Преобразуем объект {Q1: value, Q2: value} в массив [{question_code, value}]
  const answersArray = Object.entries(answers).map(([code, val]) => ({
    question_code: code,
    value: val
  }))
  
  return request('/tests/submit', {
    method: 'POST',
    body: { test_code: testCode, answers: answersArray },
  })
}

export async function setTrack(track) {
  return request('/tests/onboarding/track', {
    method: 'POST',
    body: { track },
  })
}

export async function getTestProfile() {
  return request('/tests/profile')
}

export async function getTestStats() {
  return request('/tests/stats')
}

export async function getTestAnalytics() {
  return request('/tests/analytics')
}

export async function getTestHistory(limit = 30) {
  return request(`/tests/history?limit=${limit}`)
}

// =============================================
// ARTICLES API
// =============================================

export async function getArticles() {
  return request('/articles')
}

export async function getArticle(id) {
  return request(`/articles/${id}`)
}

export async function getRandomArticle() {
  return request('/articles/random')
}

// =============================================
// SOS API
// =============================================

export async function logSosEvent(triggerType = null) {
  return request('/sos', {
    method: 'POST',
    body: { trigger_type: triggerType },
  })
}

export async function getSosTechniques() {
  return request('/sos/techniques')
}

// =============================================
// DIARY API (КПТ дневник мыслей)
// =============================================

export async function getThoughtEntries(limit = 50) {
  return request(`/diary?limit=${limit}`)
}

export async function createThoughtEntry(data) {
  return request('/diary', {
    method: 'POST',
    body: data,
  })
}

export async function deleteThoughtEntry(id) {
  return request(`/diary/${id}`, {
    method: 'DELETE',
  })
}

export async function getDiaryStats() {
  return request('/diary/stats')
}

// =============================================
// MONEY API (Финансы)
// =============================================

export async function getMoneySettings() {
  return request('/money/settings')
}

export async function updateMoneySettings(settings) {
  return request('/money/settings', {
    method: 'PUT',
    body: settings,
  })
}

export async function getMoneyEntries(limit = 50) {
  return request(`/money/entries?limit=${limit}`)
}

export async function addMoneyEntry(data) {
  return request('/money/entries', {
    method: 'POST',
    body: data,
  })
}

export async function getMoneyStats() {
  return request('/money/stats')
}

// =============================================
// REMINDERS API (Уведомления)
// =============================================

export async function updateReminderSettings(enabled, hour) {
  return request('/auth/reminders', {
    method: 'PUT',
    body: { enabled, hour },
  })
}
