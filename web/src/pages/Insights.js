import { useEffect, useState } from "react"
import api from '../foundation/api'
import { Background } from "../foundation/Backgrounds"
import { BlurOverlay } from "../foundation/Overlays"
import { BarSelector } from "../foundation/Selectors"
import './Insights.css'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { Line, Pie, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Chart.js Line Chart',
    },
  },
}

function TypingDashboard({ data, labels, title }) {
  console.log("typing dashboard", data && data.length)
  if(!data || data.length === 0) return <span></span>
  return (
    <div>
      <h3>{title}</h3>
      <Line
        data={{
          labels: labels,
          datasets: [
            {
              id: 1,
              label: '???',
              data: data,
              borderColor: 'rgba(255,87,51,1)', // Color of plot line
              borderWidth: 2,
              tension: 0.4
            }
          ],
        }}
      />
    </div>
  );
}

function TopSites({data}) {
  // npm install chroma-js
  //
  const colors = Array.from({ length: data.length }).map((_, i) => 
      `hsl(${i * (360 / data.length)}, 100%, 70%)`
  )
  return (
    <Doughnut 
      id="top-site-doughnut"
      width={100}
      height={100}
      data={{
        labels: data.map(({url}, i) => url),
        datasets: [
          {
            id: 1,
            label: '???',
            data: data.map(({count}) => count),
            borderWidth: 2,
            backgroundColor: colors
          }
        ],
      }}
      options={{
        responsive: true
      }}
    />
  )
}

export function Insights({show}) {
  const isAuthenticated = false
  const [state, setState] = useState({})
  const [] = useState([])
  useEffect(() => {
    (async () => {
      const ts = (await api.get('/stats/top-sites')).data.data
      const typing = JSON.parse((await api.get('/stats/typing')).data.stats)
      setState({topSites: ts, typingData: typing})
    })().then(() => {})
  }, [isAuthenticated])
  const typingData = state.typingData || []
  const topSites = state.topSites || []
  return (
    <div>
      <Background />
      <BlurOverlay>
        <h1>Insights</h1>
        <BarSelector 
          choices={['24m', '12m', '3d', '24h']}
          onChoice={() => {}}
        />
        <input type="text" id="insights-lang-request" />
        <div id="insights-feed">
          <h3>Top sites</h3>
          <div id="typing-view">
            <table>
              <tbody>
                {topSites.map(({url, count}) => (
                  <tr>
                    <td>{url}</td>
                    <td>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TopSites data={topSites} />
          </div>
          <div id="typing-view">
            <TypingDashboard title="Event count" labels={typingData.map((x, i) => i)} data={typingData.map(x => x.event_count).reverse()} />
            <TypingDashboard title="Errors" labels={typingData.map((x, i) => i)} data={typingData.map(x => x.relative_error).reverse()} />
            <TypingDashboard title="Typing speed" labels={typingData.map((x, i) => i)} data={typingData.map(x => x.speed).reverse()} />
          </div>
        </div>
      </BlurOverlay>
    </div>
  )
}