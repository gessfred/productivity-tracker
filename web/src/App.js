import { useState, useEffect } from 'react'
import './App.css'
import { useAuth0 } from '@auth0/auth0-react'
import { LandingPage } from './pages/LandingPage'


//TODO make moving SVG background
//TODO Add blurry foreground  






function App() {
  const { loginWithRedirect, isAuthenticated } = useAuth0()
  return (
    <div className="App">
        <LandingPage />

    </div>
  );
}

export default App;
