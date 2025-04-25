import React, { useRef, useEffect } from "react"
import p5 from "p5"

interface P5WrapperProps {
  sketch: (p: p5) => void
}

const P5Wrapper: React.FC<P5WrapperProps> = ({ sketch }) => {
  const sketchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const p5Instance = new p5(sketch, sketchRef.current!)

    return () => {
      p5Instance.remove() // Cleanup the p5 instance on component unmount
    }
  }, [sketch])

  return <div ref={sketchRef}></div>
}

export default P5Wrapper
