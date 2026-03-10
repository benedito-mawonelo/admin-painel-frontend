// import { boot } from 'quasar/wrappers'
// import axios from 'axios'

// const api = axios.create({ baseURL: 'http://192.168.1.114:8004/api' })

// export default boot(({ app }) => {
//   app.config.globalProperties.$axios = axios
//   app.config.globalProperties.$api = api
// })

// export { api }

// boot/axios.js
import { boot } from 'quasar/wrappers'
import axios from 'axios'

// BaseURL: use variável VITE_API_URL (ex.: em .env) ou fallback para backend Carta Fácil local
// const baseURL = import.meta.env.VITE_API_URL || 'https://web-production-8746c.up.railway.app/api'
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const api = axios.create({ baseURL })


// Interceptor: enviar JWT (Carta Fácil) como Bearer em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor: em 401 limpar tokens e redirecionar para login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
