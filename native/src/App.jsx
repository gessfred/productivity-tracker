import React, { useState, useEffect } from 'react'
import './App.css'
import { Group } from '@visx/group'
import { Text } from '@visx/text'
import { Bar } from '@visx/shape'
import { AxisLeft } from '@visx/axis'

import { scaleBand, scaleLinear } from '@visx/scale'
//import GanttChart from './Gantt'


const BarChart = (props) => {
  const data = props.data
  const width = 500;
  const height = 300;
  const margin = { top: 20, right: 128, bottom: 20, left: 60 };

  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const xScale = scaleLinear({
    domain: [0, Math.max(...data.map((d) => d.total_time))],
    range: [0, xMax],
  })

  const yScale = scaleBand({
    domain: data.map((d) => d.App),
    range: [0, yMax],
    padding: 0.4,
  })
  return (
    <svg width={width} height={height}>
      <Group top={margin.top} left={margin.left}>
        {data.map((d) => (
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
  const [status, setStatus] = useState() 
  const [version, setVersion] = useState("")
  useEffect(() => {
    console.log("setting effect")
    const timer = setInterval(async () => {
      console.log("status ping")
      const res = await fetch("http://localhost:3000/status")
      setStatus(await res.json())
    }, 10 * 1000)
    fetch("http://localhost:3000/version").then(res => res.text()).then(setVersion)
    return () => {
      clearInterval(timer)
    }
  }, [])

  console.log(status)
  return (
    <div className='statusbar-container'>
      <span className='statusbar-item'>
      {status?.last_event}
      </span>
      <span className='statusbar-item'>
        v{version}
      </span>
    </div>
  )
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const hoursStr = hours > 0 ? `${hours}h ` : '';
  const minutesStr = minutes > 0 ? `${minutes}min ` : '';
  const secondsStr = remainingSeconds > 0 ? `${remainingSeconds}s` : '';

  return `${hoursStr}${minutesStr}${secondsStr}`.trim();
}

function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

const fetchTodayData = async () => {
  const activeTimeByAppAggregate = await fetch("http://localhost:3000/activetime/byapp/aggregate")
  const activeTimeByApp = await fetch("http://localhost:3000/activetime/byapp")
  const userSessions = await fetch("http://localhost:3000/activetime/sessions")
  return {
    activeTimeByAppAggregate: await activeTimeByAppAggregate.json(), 
    activeTimeByApp: await activeTimeByApp.json(), 
    userSessions: await userSessions.json(),
    currentTime: getCurrentTime()
  }
}

/*
<GanttChart 
        data={data.activeTimeByApp}
        width={500}
        height={300}
      />
*/ 
export function App() {
    const [data, setData] = useState({activeTimeByApp: [], activeTimeByAppAggregate: [], userSessions: [], currentTime: getCurrentTime()})
    useEffect(() => {
      const timer = setInterval(async () => setData(await fetchTodayData()), 10 * 1000)
      fetchTodayData().then(setData)
      return () => {
        clearInterval(timer)
      }
    }, [])
    console.log("data:", data)
    return (
      <div>
        <h1>HotKey</h1>
        <div className='app-header'>
          <div className='today-card card'>
            <span>Today</span>
            <span>{data.currentTime}</span>
          </div>
          <span id='active-time-total' className='card'>{data?.userSessions && formatDuration(data?.userSessions?.map((s) => s.duration).reduce((a, b) => a + b, 0))}</span>
        </div>
        <BarChart data={data.activeTimeByAppAggregate} />
        
        <StatusBar  />
      </div>
    )
}
