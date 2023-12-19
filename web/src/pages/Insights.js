import { useEffect, useState } from "react"
import useAuth from "../foundation/Auth"
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
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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

export function Insights({show}) {
  const { api, isAuthenticated } = useAuth()
  const [typingData, setTypingData] = useState([])
  const [topSites, setTopSites] = useState([])
  useEffect(() => {
    if(api) {
      api.typingStats().then(setTypingData).catch(err => {})
      api.topSites().then(console.log).catch(err => {})
    }
  }, [isAuthenticated])
  console.log(typingData, topSites)
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
          <div>
            {topSites.map(({url, count}) => (
              <div>
                <span>{url}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
          <div id="typing-view">
            <TypingDashboard title="Event count" labels={(typingData || []).map((x, i) => i)} data={(typingData || []).map(x => x.event_count).reverse()} />
            <TypingDashboard title="Errors" labels={(typingData || []).map((x, i) => i)} data={(typingData || []).map(x => x.relative_error).reverse()} />
            <TypingDashboard title="Typing speed" labels={(typingData || []).map((x, i) => i)} data={(typingData || []).map(x => x.speed).reverse()} />
          </div>
        </div>
      </BlurOverlay>
    </div>
  )
}