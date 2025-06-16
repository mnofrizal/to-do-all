import React from 'react'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { getCurrentWeek } from '../data/taskData'

const ApiTestPanel = ({
  testTaskName,
  setTestTaskName,
  testTaskDate,
  setTestTaskDate,
  testTargetColumn,
  setTestTargetColumn,
  handleCreateTestTask
}) => {
  const currentWeekData = getCurrentWeek()

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-4">
      <Card className="mb-4 border-2 border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                🧪 API Test Panel
              </span>
            </div>
            <div className="flex flex-1 items-center gap-3">
              <Input
                placeholder="Task name..."
                value={testTaskName}
                onChange={(e) => setTestTaskName(e.target.value)}
                className="h-8 w-48 border-purple-300 bg-white text-sm dark:border-purple-700 dark:bg-purple-900/50"
              />
              <Input
                type="date"
                value={testTaskDate}
                onChange={(e) => setTestTaskDate(e.target.value)}
                className="h-8 w-40 border-purple-300 bg-white text-sm dark:border-purple-700 dark:bg-purple-900/50"
              />
              <select
                value={testTargetColumn}
                onChange={(e) => setTestTargetColumn(e.target.value)}
                className="h-8 rounded border border-purple-300 bg-white px-2 text-sm dark:border-purple-700 dark:bg-purple-900/50 dark:text-white"
              >
                <option value="backlog">Backlog</option>
                <option value="thisweek">This Week</option>
                <option value="today">Today</option>
              </select>
              <Button
                onClick={handleCreateTestTask}
                size="sm"
                className="h-8 bg-purple-600 text-white hover:bg-purple-700"
              >
                Create Test Task
              </Button>
            </div>
            <div className="flex flex-col text-xs text-purple-600 dark:text-purple-400">
              <div>Current Week: {currentWeekData.weekString}</div>
              {testTaskDate && (() => {
                const taskDateObj = new Date(testTaskDate);
                const taskYear = taskDateObj.getFullYear();
                const startOfYear = new Date(taskYear, 0, 1);
                const days = Math.floor((taskDateObj - startOfYear) / (24 * 60 * 60 * 1000));
                const taskWeekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
                const taskWeekString = `${taskYear}-W${taskWeekNumber.toString().padStart(2, '0')}`;
                const willAutoFilter = (testTargetColumn === 'thisweek' || testTargetColumn === 'today') &&
                                     taskWeekString !== currentWeekData.weekString;
                
                return (
                  <div className={willAutoFilter ? 'text-orange-600 dark:text-orange-400 font-medium' : ''}>
                    Task Week: {taskWeekString}
                    {willAutoFilter && ' → Will auto-move to Backlog'}
                  </div>
                );
              })()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ApiTestPanel