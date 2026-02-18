import { boot } from 'quasar/wrappers'
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.API_URL || 'https://web-production-8746c.up.railway.app/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
})

export default boot(({ app }) => {
  app.config.globalProperties.$api = api
})

export { api }
