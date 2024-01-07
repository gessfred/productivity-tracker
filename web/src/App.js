import { useState, useEffect } from 'react'
import './App.css'
import { LandingPage } from './pages/LandingPage'
import { Insights } from './pages/Insights'
import api, { useAuth } from './foundation/api'

//TODO make moving SVG background
//TODO Add blurry foreground  

function Pages() {
  const [flag, setFlag] = useState(false)
  const authenticated = useAuth()
  return (
    <div className="App">
        {!authenticated && <LandingPage onLogin={() => setFlag(p => !p)} />}
        {authenticated && <Insights />}
    </div>
  )
}

function App() {
  return (
      <Pages />
  )
}

export default App
