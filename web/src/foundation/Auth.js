import { useContext, createContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [identity, setIdentity] = useState(null) // contains user metadata and credentials
  const isAuthenticated = identity !== null
  //init hook
  useEffect(() => {
    const creds = localStorage.getItem("credentials")
    if(creds) {
      setIdentity(JSON.parse(creds))
    } else {
      setIdentity(null)
    }
  }, [])
  const url = "https://keylogg.pub.gessfred.xyz"
  const saveIdentity = (id) => {
    localStorage.setItem("credentials", JSON.stringify(id))
    setIdentity(id)
  }
  return (
    <AuthContext.Provider
      value={{
        identity: identity,
        setIdentity: saveIdentity,
        isAuthenticated: isAuthenticated,
        url: url
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}


export default function useAuth() {
  console.log("useAuth")
  const { url, identity, setIdentity, isAuthenticated } = useContext(AuthContext)
  const [test, setTest] = useState()
  const refreshToken = async () => {
    console.log("refreshing token")
    const response = await fetch(url+"/api/token", {
      method: 'POST',
      headers: Object.assign({}, {
        Authorization: 'Bearer ' + identity.refresh_token
      })
    })
    const token = await response.json()    
    console.log("TOKEN!!!!", token)
    token["last_update"] = new Date()
    return token
  }
  const call = useCallback(async (method, endpoint, data, access_token) => {
    console.log(method, identity, access_token)
    const params = {
      method: method,
      headers: Object.assign({}, {
        Authorization: 'Bearer ' + (access_token || identity.access_token),
        "Content-Type": "application/json",
        Accept: 'application/json'
      })
    }
    const response = await fetch(url+endpoint, params)
    return await response.json()
  }, [identity && identity.access_token])
  const callOrRefreshToken = async (method, endpoint, data) => {
    try {
      return await call(method, endpoint, data)
    }
    catch(e) {
      const token = await refreshToken()
      console.log("refreshing token")
      setIdentity(token)
      console.log("refreshed token", token)
      return await call(method, endpoint, data, token)

    }
  }
  const api = {
    typingStats: async (lookback, interval) => {
      console.log("get typing stats", lookback, interval)
      const { stats } = await callOrRefreshToken("GET", "/api/stats/typing")
      if(stats) return JSON.parse(stats)
      return []
    },
    topSites: async (lookback) => {
      console.log("fetching top sites", lookback)
      const { data } = await callOrRefreshToken("GET", "/api/stats/top-sites")
      if(data) return JSON.parse(data)
      return []
    }
  }
  const login = async (username, password) => {
    console.log("login@", url)
    let formData = new URLSearchParams({
      username: username,
      password: password
    })
    const response = await fetch(url+"/api/login", {
      body: formData,
      method: 'POST',
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    })
    const credentials = await response.json()
    credentials["last_update"] = new Date()
    setIdentity(credentials)
    return credentials
  }
  return {
    api,
    login,
    isAuthenticated
  }
}
