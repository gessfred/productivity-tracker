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

function LandingCard({caption, children}) {
  return (
    <div className='landing-card-container'>
      <span className='landing-card-caption'>{caption}</span>
      <div className='landing-card-content-container'>
        {children}
      </div>
    </div>
  )
}

function LandingGraph() {
  return (
    <svg width="577" height="367" viewBox="0 0 577 367" fill="none" xmlns="http://www.w3.org/2000/svg" className='landing-page-artifact'>
      <path d="M577 358L562.061 349.235L561.94 366.555L577 358ZM3.98953 355.5L563.49 359.406L563.511 356.406L4.01047 352.5L3.98953 355.5Z" fill="white"/>
      <path d="M9.04273 0.000607019L0.169697 14.8757L17.4884 15.1224L9.04273 0.000607019ZM5.49985 354.021L10.3503 13.5206L7.35059 13.4779L2.50015 353.979L5.49985 354.021Z" fill="white"/>
      <path d="M99 88C43 89 19 179 19 179V344L519 349V117C519 117 453 13 389 11C325 9.00003 284 255 225 255C166 255 155 87 99 88Z" fill="#6BAF53" stroke="black"/>
    </svg>
  )
}

function LandingPage({show}) {
  const { loginWithRedirect, isAuthenticated } = useAuth0()
  return (
    <div id='landing-page'>
      
      <LandingBackground />
      <BlurOverlay>
        <h1>Keylogg</h1>
        <span className='landing-page-motto'>Get the most from yourself</span>
        <div>
          <a className='landing-page-action-item' href='https://gessfred.xyz'>Get the extension</a>
          <button className='landing-page-action-item' onClick={() => loginWithRedirect()}>Log In</button>
        </div>
        <LandingCard caption="Analysis of typing patterns">
          <div className='landing-card-text-container'>
            <p>Find the best time of the day to work</p>
            <p>Get notified to take a break when you stop being productive</p>
          </div>
          <LandingGraph />
        </LandingCard>
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
