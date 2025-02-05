"use client"
import WelcomeMessage from "../sticker-animation"

const Hero = () => {
  return (
    <div className="h-[75vh] w-full border-b border-ui-border-base relative bg-ui-bg-subtle">
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center">
        <WelcomeMessage />
      </div>
    </div>
  )
}

export default Hero
