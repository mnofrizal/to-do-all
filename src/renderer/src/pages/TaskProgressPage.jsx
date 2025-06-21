import React, { Suspense, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ErrorBoundary from '../components/ErrorBoundary'

const KanbanView = React.lazy(() => import('../components/KanbanView'))
const TaskFlowTimeline = React.lazy(() => import('../components/TaskFlowTimeline'))

const TaskProgress = ({ activeView = 'kanban', selectedList, onLeapIt }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [direction, setDirection] = useState(0)
  const viewOrder = ['kanban', 'timeline', 'files', 'details']
  const prevActiveViewIndex = useRef(viewOrder.indexOf(activeView))

  useEffect(() => {
    const newIndex = viewOrder.indexOf(activeView)
    const oldIndex = prevActiveViewIndex.current
    if (newIndex !== oldIndex) {
      setDirection(newIndex > oldIndex ? 1 : -1)
    }
    prevActiveViewIndex.current = newIndex
  }, [activeView])

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  }

  const renderViewContent = () => {
    switch (activeView) {
      case 'kanban':
        return <KanbanView selectedList={selectedList} onLeapIt={onLeapIt} key={refreshKey} />
      case 'timeline':
        return (
          <div className="flex h-full px-0 pt-6">
            <div className="flex-1 border border-border bg-card" style={{ minHeight: 600 }}>
              <ErrorBoundary>
                <TaskFlowTimeline selectedList={selectedList} onRefreshKanban={() => setRefreshKey(prev => prev + 1)} />
              </ErrorBoundary>
            </div>
          </div>
        )
      default:
        return (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">View not found</p>
          </div>
        )
    }
  }

  return (
    <div className="relative h-[calc(100vh-105px)] overflow-hidden">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={activeView}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'tween', ease: 'easeInOut', duration: 0.0 },
            opacity: { duration: 0.1, ease: 'easeIn' }
          }}
          className="absolute h-full w-full"
        >
          <Suspense fallback={<div>Loading...</div>}>
            {renderViewContent()}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default TaskProgress