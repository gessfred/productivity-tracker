import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { BlurOverlay } from '../foundation/Overlays'
import './LandingPage.css'
import { Background } from '../foundation/Backgrounds'
import useAuth from '../foundation/Auth'



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

//TODO auth provider

function LoginCard(onLogin) {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  return (
    <div className='login-card'>
      <label htmlFor='login-username'>Username</label>
      <input id='login-username' type='text' onChange={e => setUsername(e.target.value)} value={username} />
      <label htmlFor='login-password'>Password</label>
      <input id='login-password' type='password' onChange={e => setPassword(e.target.value)} value={password} />
      <button id='login-button' onClick={() => login(username, password).catch(() => {})}>
        Login
      </button>
    </div>
  )
}

export function LandingPage({show}) {
  
  return (
    <div id='landing-page'>
      <Background />
      <BlurOverlay>
        <h1>Keylogg</h1>
        <span className='landing-page-motto'>Get the most from yourself</span>
        <LoginCard />
        <div>
          <a className='landing-page-action-item' href='https://chrome.google.com/webstore/detail/mindspeed/caboikpoimjoinpcenfhpdabngepgmif'>
            Get the extension
          </a>
        </div>
        {false && <LandingCard caption="Analysis of typing patterns">
          <div className='landing-card-text-container'>
            <p>Find the best time of the day to work</p>
            <p>Get notified to take a break when you stop being productive</p>
          </div>
          <LandingGraph />
        </LandingCard>}
      </BlurOverlay>
    </div>
  )
}