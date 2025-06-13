# Todo Dashboard - Project Summary

**Last Updated**: June 13, 2025

---

## Overview
A modern, feature-rich todo application built with Electron, React, and Tailwind CSS. The app features a comprehensive task management system, Kanban-style tracking, and a clean, intuitive UI. The latest architecture uses a single Electron window with animated transitions between Normal, Floating, and Focus modes for a seamless user experience.

---

## Technology Stack
- **Frontend**: React
- **Desktop**: Electron
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui, Lucide React
- **Build Tool**: Vite (electron-vite)

---

## Project Structure
```
src/
├── main/                    # Electron main process
│   └── index.js
├── preload/                 # Electron preload scripts
│   └── index.js
└── renderer/                # React frontend
    ├── index.html
    ├── src/
    │   ├── App.jsx          # Main application component
    │   ├── main.jsx         # React entry point
    │   ├── components/
    │   │   ├── HomePage.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── TaskProgress.jsx
    │   │   ├── FloatingTodayWindow.jsx
    │   │   ├── FocusModeWindow.jsx
    │   │   └── ui/
    │   └── lib/
    │       └── utils.js
```

---

## Key Features

### Single-Window, Multi-Mode Architecture
- **Normal Mode**: Full dashboard with sidebar, top navbar, and all navigation.
- **Floating Mode**: Compact, distraction-minimized view for daily focus, with animated window resize and minimal UI.
- **Focus Mode**: Ultra-compact, distraction-free mode showing only the current task and timer, with window controls and resizing disabled.

### Dynamic Navigation & Task Management
- Sidebar navigation, dynamic top navbar, and custom title bar.
- Workspace and task list management.
- Kanban board with progress bars and "Leap It!" action.

### Advanced Theming
- shadcn/ui-style semantic theming with light/dark and color variants.
- All components use semantic color classes.

### Electron Integration
- Window resizing and animated transitions between modes.
- Window controls (minimize, maximize, close) hidden in focus mode.
- Window is non-resizable in focus mode.

## 1. **Dynamic Navigation System**
- **Sidebar Navigation**: Home, Tasks, Calendar, Settings with badge notifications
- **Dynamic Top Navbar**: Context-aware header that changes based on current view
  - Home: Personalized greeting ("Good Evening, Amrizal")
  - Task Progress: Back button + selected list name
  - Other pages: Appropriate titles and subtitles
- **Custom Title Bar**: Electron window controls (minimize, maximize, close)

### 2. **Workspace Management**
- **Multiple Workspaces**: Personal, Work, Family with colored icons
- **Task Count Display**: Shows total tasks per workspace
- **Simplified Interface**: Clean workspace list without dropdown complexity
- **Add Workspace**: Functionality to create new workspaces

### 3. **Task List Management (HomePage)**
- **Grid Layout**: Responsive card-based display of task lists
- **List Operations**:
  - Create new lists with custom names
  - Duplicate existing lists
  - Archive/delete lists
  - Edit list names (placeholder)
- **Task Preview**: Shows up to 4 tasks per list with gradient fade for overflow
- **Interactive Cards**: Hover effects and click navigation to detailed view
- **Fixed Height Cards**: Consistent layout regardless of window scaling

### 4. **Kanban Task Board (TaskProgress)**
- **Four Columns**: Backlog, This Week, Today, Done
- **Progress Tracking**: Visual progress bars for active columns
- **Task Management**:
  - Add new tasks to any column
  - Priority indicators with colored badges
  - Time tracking and estimates
  - Task completion status
- **Horizontal Scrolling**: Custom scrollbar for wide boards
- **Column-Specific Actions**:
  - "All Clear" button for Backlog
  - "Leap It!" action button for Today column

### 5. **User Interface Design**
- **Modern Aesthetic**: Clean, minimalist design with subtle shadows and borders
- **Responsive Layout**: Adapts to different screen sizes
- **Color Coding**: Consistent color scheme throughout the application
- **Interactive Elements**: Hover states, transitions, and visual feedback
- **Custom Scrollbars**: Hidden globally, visible only where needed (Kanban board)

#---

## User Flow: Home Page → Focus Mode

1. **Home Page**  
   - User sees a grid of task lists (HomePage.jsx).
   - Click a list card to enter the Kanban board for that list.

2. **TaskProgress (Kanban Board)**  
   - Shows columns: Backlog, This Week, Today, Done.
   - "Leap It!" button in the Today column triggers Floating Mode.

3. **Floating Mode**  
   - Window animates to a compact, floating size (330px wide, 96% screen height).
   - Shows today's tasks, progress bar, and a running timer for the first task.
   - Hovering reveals a "Focus mode" button at the bottom.

4. **Focus Mode**  
   - Clicking "Focus mode" animates the window to 330px wide and 10% of screen height.
   - Only the current task title and timer are shown.
   - Window controls (macOS traffic lights) are hidden, and the window is not resizable.
   - Exiting focus mode restores window controls and resizability.

---

## Example Flow

- **Home Page** → Click List → **TaskProgress** → Click "Leap It!" → **Floating Mode** → Hover, click "Focus mode" → **Focus Mode**

---

## Changelog

### June 13, 2025
- Refactored to single-window, multi-mode architecture (Normal, Floating, Focus).
- Added animated window resizing and state transitions.
- Implemented Focus Mode: ultra-compact, non-resizable, no window controls, only title and timer.
- Improved IPC and preload APIs for window management.
- Window controls (macOS traffic lights) are now hidden in focus mode and restored when leaving focus mode.

### December 6, 2025
- **10:29 PM**: **MAJOR UPDATE - Advanced Theming System Implementation**
  - Implemented shadcn/ui-style theming with CSS custom properties
  - Added 5 color themes: Default, Blue, Emerald, Purple, Orange
  - Updated dark mode to use Chrome-style zinc/gray palette instead of blue
  - Converted all components to use semantic color classes
  - Enhanced ThemeContext with dual theme management (appearance + color)
  - Updated settings dialog with comprehensive theme controls
  - Achieved maintainable theming without touching individual component files
- **9:27 PM**: Added "Last Updated" timestamp and changelog section
- **8:58 PM**: Implemented horizontal scrollbar for TaskProgress Kanban board
- **8:38 PM**: Simplified sidebar workspaces (removed dropdown functionality)
- **8:21 PM**: Made TopNavbar dynamic based on current view/page
- **8:20 PM**: Updated layout structure (navbar below sidebar)
- **Earlier**: Created TopNavbar component with user greeting and actions
- **Earlier**: Redesigned Sidebar with workspace management
- **Earlier**: Fixed list card heights to be non-responsive (h-96)
- **Earlier**: Initial project examination and component analysis

---

## Conclusion

This architecture provides a seamless, distraction-free workflow for deep focus, with smooth transitions and a modern, maintainable codebase.