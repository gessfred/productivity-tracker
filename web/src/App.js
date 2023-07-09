import { useState, useEffect } from 'react'
import './App.css'
import { useAuth0 } from '@auth0/auth0-react'
import { LandingPage } from './pages/LandingPage'
import { Insights } from './pages/Insights'


//TODO make moving SVG background
//TODO Add blurry foreground  

function App() {
  const { isAuthenticated } = useAuth0()
  return (
    <div className="App">
        {!isAuthenticated && <LandingPage />}
        {isAuthenticated && <Insights />}
    </div>
  );
}

export default App;
