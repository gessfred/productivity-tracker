import { useState, useEffect } from 'react'
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { Group } from '@visx/group'
import { Text } from '@visx/text'
import { Bar } from '@visx/shape'
import { AxisLeft } from '@visx/axis'

import { scaleBand, scaleLinear } from '@visx/scale'
import GanttChart from './Gantt'


const BarChart = (props: any) => {
  const data = props.data
  const width = 500;
  const height = 300;
  const margin = { top: 20, right: 128, bottom: 20, left: 60 };

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
          <>
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
            <Text
              x={xScale(d.total_time) + 60} // Adjust offset as needed
              y={yScale(d.App) + yScale.bandwidth() / 2}
              textAnchor="start"
              dominantBaseline="central"
              fill="black"
            >
              {formatDuration(Math.floor(d.total_time))}
            </Text>
          </>
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

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const hoursStr = hours > 0 ? `${hours}h ` : '';
  const minutesStr = minutes > 0 ? `${minutes}min ` : '';
  const secondsStr = remainingSeconds > 0 ? `${remainingSeconds}s` : '';

  return `${hoursStr}${minutesStr}${secondsStr}`.trim();
}

function Home() {
  const [data, setData] = useState({activeTimeByApp: [], activeTimeByAppAggregate: [], userSessions: []})
  useEffect(() => {
    const timer = setInterval(async () => {
      const activeTimeByAppAggregate = await fetch("http://localhost:3000/activetime/byapp/aggregate")
      const activeTimeByApp = await fetch("http://localhost:3000/activetime/byapp")
      const userSessions = await fetch("http://localhost:3000/activetime/sessions")
      setData({
        activeTimeByAppAggregate: await activeTimeByAppAggregate.json(), 
        activeTimeByApp: await activeTimeByApp.json(), 
        userSessions: await userSessions.json()
      })
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
      <span>{formatDuration(data?.userSessions?.map((s: any) => s.duration).reduce((a: number, b: number) => a + b, 0))}</span>
      <BarChart data={data.activeTimeByAppAggregate} />
      <GanttChart 
        data={data.activeTimeByApp}
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
