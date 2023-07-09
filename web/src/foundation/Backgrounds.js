import { useState, useEffect } from 'react'
import './Backgrounds.css'

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
      width,
      height
  };
}
function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());
  useEffect(() => {
      function handleResize() {
          setWindowDimensions(getWindowDimensions());
      }
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);
  return windowDimensions;
}
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}



export function Background({}) {
  const { width, height } = useWindowDimensions()
  const colors = ['#C0B8DF', '#F9FB95', '#FBBC95']
  return (
    <svg className='background' xmlns="http://www.w3.org/2000/svg">
      {[...Array(10).keys()].map(i => (
        <circle 
          cx={getRandomInt(0, width)} 
          cy={getRandomInt(0, height)} 
          r={getRandomInt(50, 200)} 
          fill={colors[getRandomInt(0, 4)]} />
      ))}
    </svg>
  )
}