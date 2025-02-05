"use client"
import React from "react"
import Link from "next/link"

const WelcomeMessage = () => {
  return (
    <div className="relative">
      <div className="flex flex-col items-center justify-center text-center gap-6 max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold">
          Well done! You have successfully deployed your Medusa 2.0 store on Railway!
        </h1>
        <p className="text-xl">Need help customizing your store?</p>
        <Link
          href="https://docs.medusajs.com/starters/nextjs-medusa-starter"
          className="btn-primary w-fit"
        >
          Visit the tutorial
        </Link>
      </div>
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="sticker sticker-1">🚂</div>
        <div className="sticker sticker-2">🎉</div>
        <div className="sticker sticker-3">⚡️</div>
        <div className="sticker sticker-4">🎯</div>
      </div>
      <style jsx>{`
        .sticker {
          position: absolute;
          font-size: 3rem;
          opacity: 0.8;
          transition: all 0.3s ease;
        }
        .sticker:hover {
          transform: scale(1.2);
          opacity: 1;
        }
        .sticker-1 {
          top: -100px;
          left: -100px;
          animation: float 6s ease-in-out infinite;
        }
        .sticker-2 {
          top: -80px;
          right: -80px;
          animation: float 8s ease-in-out infinite;
        }
        .sticker-3 {
          bottom: -90px;
          left: -90px;
          animation: float 7s ease-in-out infinite;
        }
        .sticker-4 {
          bottom: -70px;
          right: -70px;
          animation: float 5s ease-in-out infinite;
        }
        @keyframes float {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
          100% {
            transform: translateY(0px) rotate(0deg);
          }
        }
      `}</style>
    </div>
  )
}

export default WelcomeMessage 