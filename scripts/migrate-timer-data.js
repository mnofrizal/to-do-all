// Migration script to consolidate existing TimeSession data into Task.timeSpent
// Run this script after updating the schema to migrate existing data

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrateTimerData() {
  console.log('Starting timer data migration...')
  
  try {
    // Get all tasks
    const tasks = await prisma.task.findMany({
      include: {
        timeSessions: {
          where: {
            duration: { not: null },
            endTime: { not: null }
          }
        }
      }
    })
    
    console.log(`Found ${tasks.length} tasks to process`)
    
    for (const task of tasks) {
      if (task.timeSessions.length > 0) {
        // Calculate total time from all completed sessions
        const totalSeconds = task.timeSessions.reduce((total, session) => {
          return total + (session.duration || 0)
        }, 0)
        
        console.log(`Task "${task.title}": ${task.timeSessions.length} sessions, ${totalSeconds} total seconds`)
        
        // Update task with consolidated time
        await prisma.task.update({
          where: { id: task.id },
          data: {
            timeSpent: totalSeconds,
            lastStartTime: null // Ensure no active timers
          }
        })
      }
    }
    
    console.log('Migration completed successfully!')
    
    // Optional: Clean up old TimeSession records (uncomment if desired)
    // console.log('Cleaning up old TimeSession records...')
    // await prisma.timeSession.deleteMany({})
    // console.log('TimeSession cleanup completed!')
    
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateTimerData()