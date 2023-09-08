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

async function getStats(api) {
  const stats = await api.get("/api/stats/typing")
  return JSON.parse(stats.stats)
}

function TypingDashboard({ data }) {
  if(!data || data.length === 0) return <span></span>
  console.log(data)
  const chartData = data.map((item) => ({
    x: new Date(item.window_start),
    y: item.event_count,
  }));

  return (
    <Line
      options={options}
      data={{
        labels: ['Jun', 'Jul', 'Aug'],
        datasets: [
          {
            id: 1,
            label: '',
            data: [5, 6, 7],
          }
        ],
      }}
    />
  );
}

export function Insights({show}) {
  const { api, isAuthenticated } = useAuth()
  const [typingData, setTypingData] = useState([])
  useEffect(() => {
    if(api) {
      getStats(api).then(setTypingData).catch(err => {})
    }
  }, [isAuthenticated])
  console.log(typingData)
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
          <TypingDashboard data={typingData} />
        </div>
      </BlurOverlay>
    </div>
  )
}