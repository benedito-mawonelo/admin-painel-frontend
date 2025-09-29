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

// const api = axios.create({ baseURL: 'http://10.254.138.171:8004/api' })
const api = axios.create({ baseURL: 'https://mawonelo.pythonanywhere.com/api' })
// const api = axios.create({ baseURL: 'http://localhost:9000/api' })


// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Token ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor para lidar com erros 401 (Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
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
