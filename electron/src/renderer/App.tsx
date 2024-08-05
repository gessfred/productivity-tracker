import { useState, useEffect } from 'react'
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'

function StatusBar() {
  const [status, setStatus] = useState<any>() 
  useEffect(() => {
    console.log("setting effect")
    const timer = setInterval(async () => {
      console.log("status ping")
      const res = await fetch("http://localhost:3000/status")
      setStatus(await res.json())
    }, 10 * 1000)
    return () => {
      clearInterval(timer)
    }
  }, [])
  console.log(status)
  return (
    <div className='statusbar-container'>
      {status?.last_event}
    </div>
  )
}

function Home() {
  const [data, setData] = useState([])
  useEffect(() => {
    const timer = setInterval(async () => {
      const res = await fetch("http://localhost:3000/activetime/byapp")
      setData(await res.json())
    }, 10 * 1000)
    return () => {
      clearInterval(timer)
    }
  }, [])
  console.log("data:", data)
  return (
    <div>
      hello world
      <StatusBar />
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}
