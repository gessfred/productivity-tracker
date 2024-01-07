import axios from 'axios'
import { useState, useEffect } from 'react'

const url = 'https://keylogg.pub.gessfred.xyz/api'
let failures = 0

const api = axios.create({
  baseURL: url
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('token', token, 'request', config.url)
    return config
  },
  (error) => Promise.reject(error)
)

const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken')
  const response = await axios.post('/api/token', { refreshToken })
  const { token } = response.data

  localStorage.setItem('token', token)  
  return token
}

// Add a response interceptor
api.interceptors.response.use(
    (response) => {
      ++failures
      return response
    },
    async (error) => {
      try {
        const originalRequest = error.config
        console.log("Response error:", error, "original request:", originalRequest)
        if (error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true
          originalRequest._retry_count = originalRequest._retry_count ? originalRequest._retry_count + 1 : 1
          const token = await refreshToken()
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axios(originalRequest)
        }
      } catch (e) {
        console.log("Fatal error during response error resolution. Clearing token cache. Previous")
      }
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      return Promise.reject(error)
    }
  )

export async function login(username, password) {
  console.log('try login for user', username)
    let formData = new URLSearchParams({
        username: username,
        password: password
    })
    const response = await fetch(url+"/login", {
        body: formData,
        method: 'POST',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    })
    const { access_token, refresh_token } = await response.json()
    localStorage.setItem('token', access_token)
    localStorage.setItem('refreshToken', refresh_token)
    console.log("logged in")
}

export function hasToken() {
    return localStorage.getItem('token') && localStorage.getItem('refreshToken')
}



export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasToken())
  useEffect(() => {
    const checkAuthStatus = () => {
      console.log("checking auth status")
      setIsAuthenticated(hasToken())
    }
    window.addEventListener('storage', checkAuthStatus)
    return () => {
      window.removeEventListener('storage', checkAuthStatus)
    }
  }, [])
  return isAuthenticated
}


export default api