import { useState, useEffect } from 'react'
import './App.css'
import { useAuth0 } from '@auth0/auth0-react'


//TODO make moving SVG background
//TODO Add blurry foreground  
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
      width,
      height
  };
}
function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());
  useEffect(() => {
      function handleResize() {
          setWindowDimensions(getWindowDimensions());
      }
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);
  return windowDimensions;
}

function BlurOverlay({children}) {
  return (
    <div className='blur-overlay'>
      {children}
    </div>
  )
}

function LandingBackground({}) {
  const { width, height } = useWindowDimensions()
  const colors = ['#C0B8DF', '#F9FB95', '#FBBC95']
  return (
    <svg className='background' xmlns="http://www.w3.org/2000/svg">
      {[...Array(10).keys()].map(i => (
        <circle 
          cx={getRandomInt(0, width)} 
          cy={getRandomInt(0, height)} 
          r={getRandomInt(50, 200)} 
          fill={colors[getRandomInt(0, 4)]} />
      ))}
    </svg>
  )
}

function LandingPage({show}) {
  const { loginWithRedirect, isAuthenticated } = useAuth0()
  return (
    <div id='landing-page'>
      
      <LandingBackground />
      <BlurOverlay>
        <span>Keylogg</span>
        <span>Maximise productivity</span>
        <button onClick={() => loginWithRedirect()}>Log In</button>
      </BlurOverlay>
    </div>
  )
}

function App() {
  const { loginWithRedirect, isAuthenticated } = useAuth0()
  return (
    <div className="App">
        <LandingPage />

    </div>
  );
}

export default App;
