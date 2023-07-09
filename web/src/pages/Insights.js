import { Background } from "../foundation/Backgrounds"
import { BlurOverlay } from "../foundation/Overlays"
import { BarSelector } from "../foundation/Selectors"
import './Insights.css'

function API() {
  
  return {

  }
}

export function Insights({show}) {
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

        </div>
      </BlurOverlay>
    </div>
  )
}