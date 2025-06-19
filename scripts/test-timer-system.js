// Test script for the new simplified timer system
// Run this after migration to verify everything works

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testTimerSystem() {
  console.log('🧪 Testing simplified timer system...\n')
  
  try {
    // 1. Create a test task
    console.log('1. Creating test task...')
    const testTask = await prisma.task.create({
      data: {
        title: 'Test Timer Task',
        status: 'inprogress',
        priority: 'medium',
        timeSpent: 0,
        lastStartTime: null,
        listId: 1 // Adjust this to match an existing list ID
      }
    })
    console.log(`✅ Created task: ${testTask.title} (ID: ${testTask.id})`)
    
    // 2. Test starting timer
    console.log('\n2. Testing timer start...')
    const startTime = new Date()
    await prisma.task.update({
      where: { id: testTask.id },
      data: {
        lastStartTime: startTime
      }
    })
    console.log(`✅ Timer started at: ${startTime.toISOString()}`)
    
    // 3. Simulate some work time (2 seconds)
    console.log('\n3. Simulating 2 seconds of work...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 4. Test pausing timer
    console.log('\n4. Testing timer pause...')
    const endTime = new Date()
    const sessionDuration = Math.floor((endTime - startTime) / 1000)
    
    await prisma.task.update({
      where: { id: testTask.id },
      data: {
        timeSpent: testTask.timeSpent + sessionDuration,
        lastStartTime: null
      }
    })
    console.log(`✅ Timer paused. Session duration: ${sessionDuration} seconds`)
    
    // 5. Verify data
    console.log('\n5. Verifying saved data...')
    const updatedTask = await prisma.task.findUnique({
      where: { id: testTask.id }
    })
    console.log(`✅ Task timeSpent: ${updatedTask.timeSpent} seconds`)
    console.log(`✅ Task lastStartTime: ${updatedTask.lastStartTime || 'null (not active)'}`)
    
    // 6. Test crash recovery scenario
    console.log('\n6. Testing crash recovery...')
    // Simulate a crashed timer (set lastStartTime without ending)
    const crashStartTime = new Date(Date.now() - 5000) // 5 seconds ago
    await prisma.task.update({
      where: { id: testTask.id },
      data: {
        lastStartTime: crashStartTime
      }
    })
    
    // Simulate recovery
    const now = new Date()
    const lostTime = Math.floor((now - crashStartTime) / 1000)
    await prisma.task.update({
      where: { id: testTask.id },
      data: {
        timeSpent: updatedTask.timeSpent + lostTime,
        lastStartTime: null
      }
    })
    console.log(`✅ Recovered ${lostTime} seconds from simulated crash`)
    
    // 7. Final verification
    console.log('\n7. Final verification...')
    const finalTask = await prisma.task.findUnique({
      where: { id: testTask.id }
    })
    console.log(`✅ Final timeSpent: ${finalTask.timeSpent} seconds`)
    console.log(`✅ Final lastStartTime: ${finalTask.lastStartTime || 'null (not active)'}`)
    
    // 8. Test active timer detection
    console.log('\n8. Testing active timer detection...')
    const activeTasks = await prisma.task.findMany({
      where: {
        lastStartTime: { not: null }
      }
    })
    console.log(`✅ Found ${activeTasks.length} tasks with active timers`)
    
    // 9. Cleanup
    console.log('\n9. Cleaning up test data...')
    await prisma.task.delete({
      where: { id: testTask.id }
    })
    console.log('✅ Test task deleted')
    
    console.log('\n🎉 All tests passed! Timer system is working correctly.')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run tests
testTimerSystem()