import { useEffect, useState } from "react"
import './Selectors.css'

export function BarSelector({choices, onChoice}) {
  const [choice, setChoice] = useState()
  const onChoice_ = c => {
    setChoice(c)
    onChoice(c)
  }
  const choiceClass = c => c === choice ? 'bar-selector-choice-active' : 'bar-selector-choice'
  useEffect(() => {
    if(choices && choices.length > 0) {
      onChoice_(choices[0])
    } 
  }, [JSON.stringify(choices)])
  return (
    <div className="bar-selector-container">
      {choices.map(choice => <span key={choice} onClick={() => onChoice_(choice)} className={choiceClass(choice)}>{choice}</span>)}
    </div>
  )
}