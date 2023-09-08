import { useContext, createContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function API(url, access_token, refresh_token) {
  const refresh_tok = () => {

  }
  return {
    login: async (username, password) => {
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
      return credentials
    },
    refresh_token: async () => {
      console.log("refreshing token")
      const response = await fetch(url+"/api/token", {

      })
      const credentials = await response.json()
      console.log("successfully refresh token")
      refresh_token(credentials)
      return credentials
    },
    get: async (route) => {
      console.log(url+route)
      try {
        const response = await fetch(url+route,{
          headers: {
            'Authorization': 'Bearer ' + access_token
          }
        })
        console.log(response)
        if(!response.ok) {
          console.log("Bad response received:", response.text, response)
        }
        const json = await response.json()
        return json

      }
      catch(e) {
        this.refresh_token()
        this.get(route)
      }
    }
  }
}

export function AuthProvider({ children }) {
  const [identity, setIdentity] = useState(null) // contains user metadata and credentials
  const api = API("https://keylogg.pub.gessfred.xyz", identity && identity.access_token, (credentials) => {
    setIdentity(credentials)
  })
  const login = async (username, password) => {
    const credentials = await api.login( username, password )
    setIdentity(credentials)
    localStorage.setItem("credentials", JSON.stringify(credentials))
  }
  const isAuthenticated = identity !== null
  useEffect(() => {
    const creds = localStorage.getItem("credentials")
    if(creds) {
      setIdentity(JSON.parse(creds))
    }
  }, [])
  return (
    <AuthContext.Provider
      value={{
        identity,
        login,
        isAuthenticated,
        api
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default function useAuth() {
  return useContext(AuthContext)
}