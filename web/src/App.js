import { useState, useEffect } from 'react'
import './App.css'
import { useAuth0 } from '@auth0/auth0-react'
import { LandingPage } from './pages/LandingPage'
import { Insights } from './pages/Insights'
import useAuth, { AuthProvider } from './foundation/Auth'

//TODO make moving SVG background
//TODO Add blurry foreground  

function Pages() {
  const { isAuthenticated } = useAuth()
  console.log(isAuthenticated)
  return (
    <div className="App">
        {!isAuthenticated && <LandingPage />}
        {isAuthenticated && <Insights />}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Pages />
    </AuthProvider>
  );
}

export default App;
