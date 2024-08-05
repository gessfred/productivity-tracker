import { useState, useEffect } from 'react'
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { Group } from '@visx/group'
import { Bar } from '@visx/shape'
import { AxisLeft } from '@visx/axis'

import { scaleBand, scaleLinear } from '@visx/scale'
import GanttChart from './Gantt'


const BarChart = (props: any) => {
  const data = props.data
  const width = 500;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 20, left: 60 };

  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const xScale = scaleLinear({
    domain: [0, Math.max(...data.map((d: any) => d.total_time))],
    range: [0, xMax],
  })

  const yScale = scaleBand({
    domain: data.map((d: any) => d.App),
    range: [0, yMax],
    padding: 0.4,
  })
  return (
    <svg width={width} height={height}>
      <Group top={margin.top} left={margin.left}>
        {data.map((d: any) => (
          <Bar
            key={d.App}
            x={margin.left}
            y={yScale(d.App)}
            width={xScale(d.total_time)}
            height={yScale.bandwidth()}
            fill="#FF5733"
            rx={4}
            ry={4}
          />
        ))}
        <AxisLeft
          top={0}
          left={margin.left}
          scale={yScale}
          hideAxisLine={true}
          hideTicks={true}
        />
      </Group>
    </svg>
  );
};


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
  const [data, setData] = useState({activeTime: [], activeTimeByApp: []})
  useEffect(() => {
    const timer = setInterval(async () => {
      const res = await fetch("http://localhost:3000/activetime/byapp")
      const activeTime = await fetch("http://localhost:3000/activetime")
      console.log("ActiveTime", )
      setData({activeTimeByApp: await res.json(), activeTime: await activeTime.json()})
    }, 10 * 1000)
    return () => {
      clearInterval(timer)
    }
  }, [])
  console.log("data:", data)
  return (
    <div>
      <h1>HotKey</h1>
      <h2>Active Time</h2>
      <BarChart data={data.activeTimeByApp} />
      <GanttChart 
        data={data.activeTime}
        width={500}
        height={300}
      />
      <StatusBar  />
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
