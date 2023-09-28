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

function TypingDashboard({ data }) {
  console.log("typing dashboard", data && data.length)
  if(!data || data.length === 0) return <span></span>
  console.log(data.map(x => x.event_count))
  const chartData = data.map((item) => ({
    x: new Date(item.window_start),
    y: item.event_count,
  }));
//labels: ['Jun', 'Jul', 'Aug'], in data
  return (
    <Line
      data={{
        labels: data.map((x, i) => i),
        datasets: [
          {
            id: 1,
            label: '',
            data: data.map(x => x.event_count).reverse(),
            borderColor: 'rgba(75,192,192,1)', // Color of plot line
            borderWidth: 2,
            tension: 0.4
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
      api.typingStats().then(setTypingData).catch(err => {})
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