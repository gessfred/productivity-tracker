import './Overlays.css'

export function BlurOverlay({children}) {
  return (
    <div className='blur-overlay'>
      {children}
    </div>
  )
}
