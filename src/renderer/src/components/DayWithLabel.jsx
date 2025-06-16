import React, { useState } from 'react'
import { motion } from 'framer-motion'

const DayWithLabel = ({ day, dayName, isToday, isPassed }) => {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      className={`flex items-center justify-center rounded-full text-xs font-medium transition-colors border cursor-pointer ${
        isToday
          ? 'bg-primary text-primary-foreground'
          : isPassed
          ? 'bg-green-500 text-white'
          : 'bg-muted text-muted-foreground'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={false}
      animate={{
        width: hovered ? 80 : 20,
        height: 20,
        paddingLeft: hovered ? 8 : 0,
        paddingRight: hovered ? 8 : 0
      }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut'
      }}
      style={{
        minHeight: 20,
        overflow: 'hidden'
      }}
    >
      <motion.span
        className="select-none text-center text-xs font-medium"
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%'
        }}
        animate={{
          opacity: 1,
          x: 0
        }}
        transition={{
          duration: 0.3,
          ease: 'easeInOut'
        }}
      >
        {hovered ? dayName : day}
      </motion.span>
    </motion.div>
  )
}

export default DayWithLabel