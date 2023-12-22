import axios from 'axios';

const url = 'https://keylogg.pub.gessfred.xyz/api'

const api = axios.create({
  baseURL: url,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    console.log('token', token)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('request', config)
    return config
  },
  (error) => Promise.reject(error)
)

// Add a response interceptor
api.interceptors.response.use(
    (response) => response,
    /*async (error) => {
        console.log('ERROR TOKEN REFRESH', error, error.response.status)
      const originalRequest = error.config
      console.log('original request', originalRequest)
  
      // If the error status is 401 and there is no originalRequest._retry flag,
      // it means the token has expired and we need to refresh it
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true
  
        try {
          const refreshToken = localStorage.getItem('refreshToken')
          const response = await axios.post('/api/token', { refreshToken })
          const { token } = response.data
  
          localStorage.setItem('token', token)  
          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axios(originalRequest)
        } catch (error) {
          // Handle refresh token error or redirect to login
        }
      }
  
      return Promise.reject(error)
    }*/
    async (error) => {
        console.log('ERROR TOKEN REFRESH', error)
    }
  )

export async function login(username, password) {
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
}

export function isAuthenticated() {
    return localStorage.getItem('token') && localStorage.getItem('refreshToken')
}

export default api