import React, { useState, Suspense, useEffect, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { Model } from './Model.tsx'
import DataManager from './DataManager.tsx'
import { 
  worldlineAPI,
  eventAPI,
  timelineAPI,
  healthCheck,
  type Worldline,
  type WorldlineEvent
} from './api.ts'

// Database will be initialized on component mount

function App() {
  const [displayMode, setDisplayMode] = useState<'clock' | 'custom' | 'counter'>('custom')
  const [customValue, setCustomValue] = useState('1.198765')
  const [zoomLevel, setZoomLevel] = useState(1) // 1 = max zoom out, higher = zoomed in
  const [selectedWorldline, setSelectedWorldline] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedBranchIndex, setSelectedBranchIndex] = useState(0)
  const [viewingIndividualBranch, setViewingIndividualBranch] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedEventIndex, setSelectedEventIndex] = useState(0) // For navigating through events in branch view
  const [isTransitioning, setIsTransitioning] = useState(false) // Track if nixie meter is transitioning
  const [isFullScreenTransition, setIsFullScreenTransition] = useState(false) // Track full-screen animation
  const [fullScreenPhase, setFullScreenPhase] = useState<'flashbang1' | 'zoomout' | 'scramble' | 'transition' | 'shrinking' | 'fadeout'>('flashbang1')
  const [fullScreenValue, setFullScreenValue] = useState('0.000000')
  const [targetFullScreenValue, setTargetFullScreenValue] = useState('0.000000')
  const [zoomScale, setZoomScale] = useState(1) // Track zoom scale separately
  const [transitionComplete, setTransitionComplete] = useState(true) // Track if transition is complete

  // Database state
  const [worldlineData, setWorldlineData] = useState<Record<string, Worldline & { branches: any[] }>>({})
  const [worldlineEvents, setWorldlineEvents] = useState<Record<string, Record<string, WorldlineEvent>>>({})
  const [timelineConfig, setTimelineConfig] = useState({ start: 2002, end: 2102 })
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [adminMode, setAdminMode] = useState(false) // Track admin mode
  const [keySequence, setKeySequence] = useState<string[]>([]) // Track key sequence for admin access
  const [backgroundMusic, setBackgroundMusic] = useState<HTMLAudioElement | null>(null) // Background music
  const [badAudio, setBadAudio] = useState<HTMLAudioElement | null>(null) // Track bad.mp3 instance

  const worldlines = Object.values(worldlineData)
  const currentWorldline = selectedWorldline ? worldlineData[selectedWorldline] : null

  // Initialize database data
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Check if server is running
        const isHealthy = await healthCheck()
        if (!isHealthy) {
          throw new Error('Server is not running. Please start the server with: npm run server')
        }

        // Load worldlines from API
        const dbWorldlines = await worldlineAPI.getAll()
        const worldlineDataObj: Record<string, Worldline & { branches: any[] }> = {}
        dbWorldlines.forEach(wl => {
          worldlineDataObj[wl.id] = { ...wl, branches: [] }
        })
        setWorldlineData(worldlineDataObj)

        // Load timeline config
        const config = await timelineAPI.getConfig()
        if (config) {
          setTimelineConfig({ start: config.start_year, end: config.end_year })
        }

        // Load events from API and organize by scope
        const dbEvents = await eventAPI.getAll()
        const eventsObj: Record<string, Record<string, WorldlineEvent>> = {
          crossAttractor: {},
          alpha: {},
          beta: {},
          gamma: {},
          delta: {}
        }
        
        dbEvents.forEach(event => {
          if (!eventsObj[event.scope]) {
            eventsObj[event.scope] = {}
          }
          eventsObj[event.scope][event.id] = event
        })
        
        setWorldlineEvents(eventsObj)
        setIsDataLoaded(true)

        // Initialize background music
        const bgMusic = new Audio('/main.mp3')
        bgMusic.loop = true
        bgMusic.volume = 0.3
        setBackgroundMusic(bgMusic)
        
        // Start playing background music (with user interaction requirement)
        const playBgMusic = () => {
          bgMusic.play().catch(error => {
            console.log('Background music requires user interaction to start:', error)
          })
          // Remove the event listener after first interaction
          document.removeEventListener('click', playBgMusic)
          document.removeEventListener('keydown', playBgMusic)
        }
        
        // Add event listeners for user interaction
        document.addEventListener('click', playBgMusic)
        document.addEventListener('keydown', playBgMusic)
        
      } catch (error) {
        console.error('Failed to load data from API:', error)
        setIsDataLoaded(true) // Still show the UI even if data fails to load
      }
    }

    initializeData()
    
    // Cleanup function for background music
    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause()
        backgroundMusic.currentTime = 0
      }
      if (badAudio) {
        badAudio.pause()
        badAudio.currentTime = 0
      }
    }
  }, [])

  // Timeline years
  const timelineStart = timelineConfig.start
  const timelineEnd = timelineConfig.end
  const timelineSpan = timelineEnd - timelineStart


  // Current events for the selected worldline
  const currentEvents = selectedWorldline && worldlineEvents[selectedWorldline] ? Object.entries(worldlineEvents[selectedWorldline]) : []

  // Get dynamic width multiplier based on zoom level
  const getWidthMultiplier = (baseMultiplier: number, zoomLevel: number) => {
    if (zoomLevel >= 4) {
      // Monthly view needs massive space - 10x more than original
      return baseMultiplier * zoomLevel * 25.0
    } else if (zoomLevel >= 3) {
      // Yearly view needs lots of extra space - 10x more than original
      return baseMultiplier * zoomLevel * 18.0
    } else {
      // Regular scaling for broader views
      return baseMultiplier * zoomLevel
    }
  }

  // Get time division and format based on zoom level
  const getTimelineConfig = (zoomLevel: number) => {
    if (zoomLevel >= 4) {
      // Monthly divisions at highest zoom
      return {
        division: 1/12, // months
        format: (year: number, month?: number) => {
          if (!month || month === 0) return `${year}`
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          return monthNames[month - 1]
        },
        totalMarkers: timelineSpan * 12
      }
    } else if (zoomLevel >= 3) {
      // Yearly divisions
      return {
        division: 1,
        format: (year: number) => `${year}`,
        totalMarkers: timelineSpan
      }
    } else if (zoomLevel >= 2) {
      // 5-year divisions
      return {
        division: 5,
        format: (year: number) => `${year}`,
        totalMarkers: Math.floor(timelineSpan / 5)
      }
    } else if (zoomLevel >= 1.5) {
      // 10-year divisions
      return {
        division: 10,
        format: (year: number) => `${year}`,
        totalMarkers: Math.floor(timelineSpan / 10)
      }
    } else {
      // 20-year divisions
      return {
        division: 20,
        format: (year: number) => `${year}`,
        totalMarkers: Math.floor(timelineSpan / 20)
      }
    }
  }

  // Timeline scroll refs for keyboard navigation
  const mainTimelineRef = useRef<HTMLDivElement>(null)
  const branchTimelineRef = useRef<HTMLDivElement>(null)
  const individualTimelineRef = useRef<HTMLDivElement>(null)

  // Mouse position tracking for cursor-based zooming
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 })

  // Track mouse position for cursor-based zooming
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mousePositionRef.current = { x: event.clientX, y: event.clientY }
      setLastMousePosition({ x: event.clientX, y: event.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Function to zoom towards cursor position
  const zoomAtCursor = useCallback((zoomDelta: number, mouseX?: number) => {
    // Determine which timeline container is active
    let timelineContainer: HTMLDivElement | null = null
    if (viewingIndividualBranch && individualTimelineRef.current) {
      timelineContainer = individualTimelineRef.current
    } else if (selectedWorldline && branchTimelineRef.current) {
      timelineContainer = branchTimelineRef.current
    } else if (mainTimelineRef.current) {
      timelineContainer = mainTimelineRef.current
    }

    if (!timelineContainer) {
      setZoomLevel(prev => Math.max(1, Math.min(5, prev + zoomDelta)))
      return
    }

    // Use provided mouseX or current mouse position
    const cursorX = mouseX !== undefined ? mouseX : lastMousePosition.x
    
    // Get container bounds
    const containerRect = timelineContainer.getBoundingClientRect()
    const containerX = Math.max(0, Math.min(containerRect.width, cursorX - containerRect.left))
    
    // Store current scroll position and content width before zoom
    const oldScrollLeft = timelineContainer.scrollLeft
    const oldScrollWidth = timelineContainer.scrollWidth
    const containerWidth = containerRect.width
    
    // Calculate the content position the cursor is pointing to (as a ratio)
    const contentRatio = oldScrollWidth > 0 ? (oldScrollLeft + containerX) / oldScrollWidth : 0
    
    // Apply zoom
    setZoomLevel(prev => {
      const newZoom = Math.max(1, Math.min(5, prev + zoomDelta))
      
      // Schedule scroll adjustment for next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!timelineContainer) return
          
          const newScrollWidth = timelineContainer.scrollWidth
          
          if (newScrollWidth > 0) {
            // Calculate new content position maintaining the same ratio
            const newContentPosition = contentRatio * newScrollWidth
            
            // Calculate new scroll position to keep cursor over same content
            const newScrollLeft = newContentPosition - containerX
            
            // Apply with bounds checking
            timelineContainer.scrollLeft = Math.max(0, Math.min(newScrollLeft, newScrollWidth - containerWidth))
          }
        })
      })
      
      return newZoom
    })
  }, [viewingIndividualBranch, selectedWorldline, lastMousePosition])

  // Keyboard controls
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Hidden admin access sequence: Konami-style sequence
    // Sequence: ArrowUp, ArrowUp, ArrowDown, ArrowDown, ArrowLeft, ArrowRight, ArrowLeft, ArrowRight, 'a'
    const adminSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'a']
    
    if (adminSequence.includes(event.key)) {
      const newSequence = [...keySequence, event.key].slice(-adminSequence.length)
      setKeySequence(newSequence)
      
      if (newSequence.length === adminSequence.length && 
          newSequence.every((key, index) => key === adminSequence[index])) {
        event.preventDefault()
        setAdminMode(!adminMode)
        setKeySequence([]) // Reset sequence
        return
      }
    } else {
      // Reset sequence if wrong key is pressed
      if (keySequence.length > 0) {
        setKeySequence([])
      }
    }

    // If admin mode is active, don't handle any other keyboard events
    if (adminMode) {
      return
    }

    // Close modal with ESC
    if (event.key === 'Escape' && modalOpen) {
      event.preventDefault()
      closeModal()
      return
    }

    // Zoom controls
    if (event.key === '+' || event.key === '=') {
      event.preventDefault()
      zoomAtCursor(0.2)
      return
    } else if (event.key === '-') {
      event.preventDefault()
      zoomAtCursor(-0.2)
      return
    }

    // Timeline horizontal navigation with arrow keys
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      
      // Determine which timeline container to scroll
      let timelineContainer: HTMLDivElement | null = null
      if (viewingIndividualBranch && individualTimelineRef.current) {
        timelineContainer = individualTimelineRef.current
      } else if (selectedWorldline && branchTimelineRef.current) {
        timelineContainer = branchTimelineRef.current
      } else if (mainTimelineRef.current) {
        timelineContainer = mainTimelineRef.current
      }
      
      if (timelineContainer) {
        const scrollAmount = timelineContainer.clientWidth * 0.3 // Scroll 30% of visible width
        const direction = event.key === 'ArrowLeft' ? -1 : 1
        const newScrollLeft = timelineContainer.scrollLeft + (scrollAmount * direction)
        
        timelineContainer.scrollTo({
          left: newScrollLeft,
          behavior: 'smooth'
        })
      }
      return
    }

    if (viewingIndividualBranch) {
      // In individual branch view - keep this for manual navigation if needed
      if (event.key === 'Backspace') {
        setViewingIndividualBranch(false)
        setSelectedEventIndex(0)
      }
    } else if (selectedWorldline) {
      // In branch view
      if (event.key === 'Backspace') {
        // Pause bad audio and resume main audio when exiting worldline
        pauseBadAudioAndResumeMain()
        
        setSelectedWorldline(null)
        setSelectedIndex(0)
        setSelectedEventIndex(0)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        const newIndex = Math.max(0, selectedEventIndex - 1)
        setSelectedEventIndex(newIndex)
        
        // No transition here - only change display on Enter
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        const newIndex = Math.min(currentEvents.length - 1, selectedEventIndex + 1)
        setSelectedEventIndex(newIndex)
        
        // No transition here - only change display on Enter
      } else if (event.key === 'Enter') {
        event.preventDefault()
        
        // Open modal for the selected event
        const selectedEventData = currentEvents[selectedEventIndex]
        if (selectedEventData) {
          handleEventClick(selectedEventData[0]) // selectedEventData[0] is the eventId
        }
      }
    } else {
      // In main view
      const worldlineKeys = Object.keys(worldlineData)
      
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        const newIndex = Math.max(0, selectedIndex - 1)
        setSelectedIndex(newIndex)
        
        // No transition here - only change display on Enter
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        const newIndex = Math.min(worldlineKeys.length - 1, selectedIndex + 1)
        setSelectedIndex(newIndex)
        
        // No transition here - only change display on Enter
      } else if (event.key === 'Enter') {
        event.preventDefault()
        setSelectedWorldline(worldlineKeys[selectedIndex])
        
        // Animate to the selected worldline when entering it
        const worldline = worldlineData[worldlineKeys[selectedIndex]]
        if (worldline) {
          const targetValue = (worldline.percentage).toFixed(6)
          triggerFullScreenTransition(targetValue) // Use full-screen transition
        }
      }
    }
  }, [selectedWorldline, selectedIndex, selectedEventIndex, viewingIndividualBranch, currentWorldline, modalOpen, currentEvents, adminMode, keySequence])

  // Mouse wheel horizontal scroll only (no zoom)
  const handleWheel = useCallback((event: WheelEvent) => {
    // Shift + wheel = horizontal scroll (let browser handle it)
    if (event.shiftKey) {
      return // Allow default horizontal scrolling
    }
    
    // No zoom functionality - just let normal scroll behavior happen
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [handleKeyDown, handleWheel])

  // Function to pause bad audio and resume main audio
  const pauseBadAudioAndResumeMain = () => {
    if (badAudio) {
      badAudio.pause() // Just pause, don't reset or destroy
    }
    
    if (backgroundMusic) {
      backgroundMusic.play().catch(error => {
        console.error('Error resuming main.mp3:', error)
      })
    }
  }

  const handleWorldlineClick = (worldlineId: string) => {
    if (transitionComplete) {
      // Pause bad audio and resume main audio when switching to any worldline
      pauseBadAudioAndResumeMain()
      
      setSelectedWorldline(worldlineId)
      
      // Get the worldline data and animate to its percentage
      const worldline = worldlineData[worldlineId]
      if (worldline) {
        const targetValue = (worldline.percentage).toFixed(6)
        triggerFullScreenTransition(targetValue) // Use full-screen transition
      }
    }
  }

  // Handle event click
  const handleEventClick = (eventId: string) => {
    if (transitionComplete) {
      // Search through all event categories
      let event: any = null
      for (const category of Object.values(worldlineEvents)) {
        if (category[eventId]) {
          event = category[eventId]
          break
        }
      }
      
      if (event) {
        setSelectedEvent(event)
        setModalOpen(true)
        
        // Play special audio for specific events (2020 and 2022 connectors)
        if (eventId === 'april2020') {
          // Play good.mp3 for 2020 event
          // Pause main.mp3
          if (backgroundMusic) {
            backgroundMusic.pause()
          }
          
          // If badAudio is playing, stop it and use it for good.mp3
          if (badAudio) {
            badAudio.pause()
          }
          
          // Create or resume good.mp3
          if (!badAudio) {
            const newGoodAudio = new Audio('/good.mp3')
            newGoodAudio.volume = 0.5
            newGoodAudio.loop = true
            setBadAudio(newGoodAudio) // Reuse badAudio state for good.mp3
            
            newGoodAudio.play().catch(error => {
              console.error('Error playing good.mp3:', error)
            })
          } else {
            // Replace with good.mp3
            const newGoodAudio = new Audio('/good.mp3')
            newGoodAudio.volume = 0.5
            newGoodAudio.loop = true
            setBadAudio(newGoodAudio)
            
            newGoodAudio.play().catch(error => {
              console.error('Error playing good.mp3:', error)
            })
          }
        } else if (eventId === 'december2022') {
          // Play bad.mp3 for 2022 event
          // Pause main.mp3
          if (backgroundMusic) {
            backgroundMusic.pause()
          }
          
          // If badAudio is playing, stop it
          if (badAudio) {
            badAudio.pause()
          }
          
          // Create or resume bad.mp3
          const newBadAudio = new Audio('/bad.mp3')
          newBadAudio.volume = 0.5
          newBadAudio.loop = true
          setBadAudio(newBadAudio)
          
          newBadAudio.play().catch(error => {
            console.error('Error playing bad.mp3:', error)
          })
        }
        
        // Animate to the event's target worldline value
        if (event.to_worldline) {
          // Extract percentage from "β: 1.198765%" or "γ: 2.652042" format
          const match = event.to_worldline.match(/(\d+\.\d+)%?/)
          if (match) {
            const percentage = parseFloat(match[1])
            const targetValue = (percentage).toFixed(6)
            triggerFullScreenTransition(targetValue) // Use full-screen transition
          }
        }
      }
    }
  }

  // Close modal
  const closeModal = () => {
    setModalOpen(false)
    setSelectedEvent(null)
  }


  // Function to trigger full-screen cinematic transition
  const triggerFullScreenTransition = (targetValue: string) => {
    setTargetFullScreenValue(targetValue)
    setFullScreenValue(customValue)
    setIsFullScreenTransition(true)
    setFullScreenPhase('flashbang1')
    setZoomScale(1) // Start meter at normal size
    setTransitionComplete(false) // Disable interactions during transition

    // Play steiner.mp3 when flashbang starts
    const steinerAudio = new Audio('/steiner.mov')
    steinerAudio.volume = 0.7
    steinerAudio.play().catch(error => {
      console.error('Error playing steiner.mp3:', error)
    })

    // Immediately trigger scale up during flashbang (0.5s)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setZoomScale(10) // Scale up to large size during flashbang
      })
    })

    // Phase 1: Initial flashbang (0.5s) - meter is scaling up behind it
    setTimeout(() => {
      setFullScreenPhase('zoomout')
      
      // Now trigger scale down from large to normal
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setZoomScale(1) // Scale down to normal size
        })
      })
      
      // Phase 2: Scale down (3s)
      setTimeout(() => {
        setFullScreenPhase('scramble')
        
        // Phase 3: Scramble numbers for 1s (reduced from 1.5s)
        const scrambleStart = Date.now()
        const scrambleInterval = setInterval(() => {
          const elapsed = Date.now() - scrambleStart
          if (elapsed >= 1000) { // Reduced from 1500 to 1000
            clearInterval(scrambleInterval)
            setFullScreenPhase('transition')
            
            // Phase 4: Transition to target value (1s, reduced from 2s)
            const transitionStart = Date.now()
            const startValue = parseFloat(customValue)
            const endValue = parseFloat(targetValue)
            
            const transitionInterval = setInterval(() => {
              const elapsed = Date.now() - transitionStart
              const progress = Math.min(elapsed / 1000, 1) // Reduced from 2000 to 1000
              const easeOut = 1 - Math.pow(1 - progress, 3)
              const currentValue = startValue + (endValue - startValue) * easeOut
              
              setFullScreenValue(currentValue.toFixed(6))
              setCustomValue(currentValue.toFixed(6))
              
              if (progress >= 1) {
                clearInterval(transitionInterval)
                setFullScreenPhase('shrinking')
                
                // Phase 5: Shrinking phase (2s, increased)
                setTimeout(() => {
                  setFullScreenPhase('fadeout')
                  
                  // Phase 6: Fade out (2s, increased)
                  setTimeout(() => {
                    setIsFullScreenTransition(false)
                    setTransitionComplete(true) // Enable interactions after transition
                  }, 2000) // Increased from 1000
                }, 2000) // Increased from 1000
              }
            }, 16) // 60fps
          } else {
            // Generate random scrambled numbers
            const randomValue = (Math.random() * 10).toFixed(6)
            setFullScreenValue(randomValue)
          }
        }, 50) // Update scramble every 50ms
      }, 1500) // Increased scale down time
    }, 500)
  }

  // Show loading screen while data is being loaded
  if (!isDataLoaded) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        color: 'rgba(255, 170, 68, 0.8)',
        fontSize: '24px',
        fontFamily: 'monospace'
      }}>
        Loading Timeline Data...
      </div>
    )
  }

  // Show admin interface if in admin mode
  if (adminMode) {
    return <DataManager onClose={() => setAdminMode(false)} />
  }

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh',
      backgroundImage: 'url(/background.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      position: 'relative'
    }}>
      {/* Full Page Worldline Interface */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 20,
        pointerEvents: 'all',
        padding: '40px',
        overflow: 'visible'
      }}>
        
        {/* Hidden admin hint - only visible on hover */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          fontSize: '8px',
          color: 'rgba(255, 170, 68, 0.1)',
          fontFamily: 'monospace',
          opacity: 0,
          transition: 'opacity 0.3s',
          cursor: 'default'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.3'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
        title="Admin access available"
        >
          •
        </div>

        {/* Title and Controls */}
      <div style={{ 
        position: 'absolute', 
        top: '20px', 
        left: '20px', 
          color: 'rgba(255, 170, 68, 0.9)',
          fontSize: '16px',
          fontFamily: 'monospace',
          textShadow: '0 0 8px rgba(255, 170, 68, 0.6)',
        zIndex: 100,
          overflow: 'visible'
        }}>
          <div>WORLDLINE CONVERGENCE ANALYSIS</div>
          <div style={{ fontSize: '12px', marginTop: '10px', color: 'rgba(255, 170, 68, 0.7)' }}>
            {viewingIndividualBranch ? (
              <>Viewing individual worldline | BACKSPACE to return | ←→ to scroll timeline | Drag or Shift+wheel | +/- to zoom</>
            ) : selectedWorldline ? (
              <>Viewing {currentWorldline?.name} attractor field branches | ↑↓ to select branch | ←→ to scroll timeline | ENTER to view details | BACKSPACE to return | +/- to zoom</>
            ) : (
              <>↑↓ to navigate | ←→ to scroll timeline | ENTER to select | Drag to scroll | +/- to zoom | Shift+wheel for horizontal</>
            )}
          </div>
        </div>

        {/* Zoom indicator */}
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          color: 'rgba(255, 170, 68, 0.9)',
          fontSize: '14px',
        fontFamily: 'monospace',
          textShadow: '0 0 6px rgba(255, 170, 68, 0.4)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '8px 15px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 170, 68, 0.3)',
          whiteSpace: 'nowrap',
          minWidth: '100px',
          textAlign: 'center',
          zIndex: 200
        }}>
          ZOOM: {zoomLevel.toFixed(1)}x
        </div>

        {/* Main Worldlines View */}
        {!selectedWorldline && (
          <div 
            ref={mainTimelineRef}
            data-scrollable="true"
            style={{ 
              position: 'relative',
              width: '100%', 
              height: '100%',
              paddingTop: '100px',
              paddingLeft: '50px',
              paddingRight: '-50px',
              overflowX: 'auto',
              overflowY: 'auto',
              cursor: 'grab',
              scrollBehavior: 'smooth'
            }}
            onMouseDown={(e) => {
              const target = e.currentTarget as HTMLDivElement
              const startX = e.pageX - target.offsetLeft
              const scrollLeft = target.scrollLeft
              const mouseMoveHandler = (e: MouseEvent) => {
                const x = e.pageX - target.offsetLeft
                const walk = (x - startX) * 1.5
                target.scrollLeft = scrollLeft - walk
              }
              const mouseUpHandler = () => {
                document.removeEventListener('mousemove', mouseMoveHandler)
                document.removeEventListener('mouseup', mouseUpHandler)
                target.style.cursor = 'grab'
              }
              document.addEventListener('mousemove', mouseMoveHandler)
              document.addEventListener('mouseup', mouseUpHandler)
              target.style.cursor = 'grabbing'
            }}
          >
            <div style={{
              width: `${getWidthMultiplier(150, zoomLevel)}%`,
              height: '100%',
              position: 'relative',
              minWidth: '150vw',
              overflow: 'visible'
            }}>
              
              {/* Timeline markers for main view */}
              <div style={{
                position: 'absolute',
                top: '5%',
                left: '0%',
                width: '100%',
                height: '40px',
                overflow: 'visible'
              }}>
                {(() => {
                  const config = getTimelineConfig(zoomLevel)
                  const markers: React.ReactElement[] = []
                  
                  if (config.division < 1) {
                    // Monthly markers
                    for (let year = timelineStart; year <= timelineEnd; year++) {
                      for (let month = 0; month < 12; month++) {
                        const totalMonths = (year - timelineStart) * 12 + month
                        const position = (totalMonths / (timelineSpan * 12)) * 100
                        if (position <= 100) {
                          markers.push(
                            <div key={`${year}-${month}`} style={{
                              position: 'absolute',
                              left: `${position}%`,
                              top: '-10px',
                              color: 'rgba(255, 170, 68, 0.4)',
                              fontSize: `${Math.max(8, 8 * Math.min(zoomLevel, 2))}px`,
                              fontFamily: 'monospace',
                              textAlign: 'center',
                              transform: 'translateX(-50%)',
                              whiteSpace: 'nowrap',
                              overflow: 'visible',
                              minWidth: '60px',
                              padding: '2px 4px',
                              backgroundColor: 'rgba(0, 0, 0, 0.2)',
                              borderRadius: '2px'
                            }}>
                              {config.format(year, month)}
                            </div>
                          )
                        }
                      }
                    }
                } else {
                    // Yearly or multi-year markers
                    for (let i = 0; i <= config.totalMarkers; i++) {
                      const year = timelineStart + (i * config.division)
                      if (year <= timelineEnd) {
                        const position = ((year - timelineStart) / timelineSpan) * 100
                        markers.push(
                          <div key={year} style={{
                            position: 'absolute',
                            left: `${position}%`,
                            top: '-10px',
                            color: 'rgba(255, 170, 68, 0.4)',
                            fontSize: `${Math.max(8, 8 * Math.min(zoomLevel, 2))}px`,
                            fontFamily: 'monospace',
                            textAlign: 'center',
                            transform: 'translateX(-50%)',
                            whiteSpace: 'nowrap',
                            overflow: 'visible',
                            minWidth: '60px',
                            padding: '2px 4px',
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '2px'
                          }}>
                            {config.format(year)}
                          </div>
                        )
                      }
                    }
                  }
                  
                  return markers
                })()}
              </div>

              {worldlines.map((worldline, index) => (
                <div key={worldline.id} style={{
                  position: 'absolute',
                  top: `${20 + index * 15}%`,
                  left: '0%',
                  width: '100%',
                  height: `${3 * zoomLevel}px`,
                  background: `linear-gradient(90deg, ${worldline.color}, ${worldline.color.replace('0.8', '0.4')}, ${worldline.color})`,
                  boxShadow: `0 0 ${8 * zoomLevel}px ${worldline.color.replace('0.8', '0.5')}`,
                  cursor: 'pointer',
                  border: selectedIndex === index ? `1px solid ${worldline.color}` : 'none',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => handleWorldlineClick(worldline.id)}
                >
                  <div style={{
                    position: 'absolute',
                    left: `${10 + index * 15}%`,
                    top: `${-20 * zoomLevel}px`,
                    color: worldline.color,
                    fontSize: `${12 * Math.min(zoomLevel, 2)}px`,
                    fontFamily: 'monospace',
                    textShadow: `0 0 6px ${worldline.color.replace('0.8', '0.4')}`,
                    whiteSpace: 'nowrap'
                  }}>
                    {worldline.name}: {worldline.percentage.toFixed(6)}%
                    {selectedIndex === index && ' ◄'}
                  </div>
                </div>
              ))}

              {/* Alpha-Beta Connection at April 2020 */}
              <div 
                style={{
                  position: 'absolute',
                  left: '18.33%', // April 2020 position: (2020-2002 + 4/12) / 100 * 100
                  top: '20%', // Alpha worldline position
                  width: '2px',
                  height: '15%', // Distance between alpha and beta
                  background: 'linear-gradient(180deg, rgba(255, 102, 0, 0.8), rgba(136, 255, 136, 0.8))',
                  boxShadow: `0 0 ${6 * zoomLevel}px rgba(255, 170, 68, 0.6)`,
                  zIndex: 10,
                  animation: 'connectionPulse 3s infinite',
                  cursor: 'pointer'
                }}
                onClick={() => handleEventClick('april2020')}
              >
                {/* Connection indicator */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: `${8 * Math.min(zoomLevel, 2)}px`,
                  height: `${8 * Math.min(zoomLevel, 2)}px`,
                  borderRadius: '50%',
                  background: 'rgba(255, 170, 68, 1)',
                  boxShadow: `0 0 ${8 * zoomLevel}px rgba(255, 170, 68, 0.8)`,
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  transition: 'all 0.3s ease'
                }}></div>
              </div>

              {/* Connection Event Label */}
              <div 
                style={{
                  position: 'absolute',
                  left: '18.33%',
                  top: '12%',
                  transform: 'translateX(-50%)',
                  color: 'rgba(255, 170, 68, 0.9)',
                  fontSize: `${10 * Math.min(zoomLevel, 1.5)}px`,
                  fontFamily: 'monospace',
                  textShadow: '0 0 6px rgba(255, 170, 68, 0.6)',
                  whiteSpace: 'nowrap',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: '1px solid rgba(255, 170, 68, 0.3)',
                  zIndex: 11,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => handleEventClick('april2020')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 170, 68, 0.2)'
                  e.currentTarget.style.borderColor = 'rgba(255, 170, 68, 0.6)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)'
                  e.currentTarget.style.borderColor = 'rgba(255, 170, 68, 0.3)'
                }}
              >
                APR 2020: α↔β CONNECTION
              </div>

              {/* Beta-Alpha Regression at December 2022 */}
              <div 
                style={{
                  position: 'absolute',
                  left: '20.92%', // December 2022 position
                  top: '20%', // Start at Alpha worldline position
                  width: '2px',
                  height: '15%', // Height going down from alpha to beta
                  background: 'linear-gradient(180deg, rgba(255, 102, 0, 0.8), rgba(136, 255, 136, 0.8))',
                  boxShadow: `0 0 ${6 * zoomLevel}px rgba(255, 68, 68, 0.6)`,
                  zIndex: 10,
                  animation: 'connectionPulse 4s infinite',
                  cursor: 'pointer'
                }}
                onClick={() => handleEventClick('december2022')}
              >
                {/* Connection indicator */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: `${8 * Math.min(zoomLevel, 2)}px`,
                  height: `${8 * Math.min(zoomLevel, 2)}px`,
                  borderRadius: '50%',
                  background: 'rgba(255, 68, 68, 1)',
                  boxShadow: `0 0 ${8 * zoomLevel}px rgba(255, 68, 68, 0.8)`,
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  transition: 'all 0.3s ease'
                }}></div>
              </div>

              {/* Regression Event Label */}
              <div 
                style={{
                  position: 'absolute',
                  left: '20.92%',
                  top: '42%',
                  transform: 'translateX(-50%)',
                  color: 'rgba(255, 68, 68, 0.9)',
                  fontSize: `${10 * Math.min(zoomLevel, 1.5)}px`,
                  fontFamily: 'monospace',
                  textShadow: '0 0 6px rgba(255, 68, 68, 0.6)',
                  whiteSpace: 'nowrap',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: '1px solid rgba(255, 68, 68, 0.3)',
                  zIndex: 11,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => handleEventClick('december2022')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 68, 68, 0.2)'
                  e.currentTarget.style.borderColor = 'rgba(255, 68, 68, 0.6)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)'
                  e.currentTarget.style.borderColor = 'rgba(255, 68, 68, 0.3)'
                }}
              >
                DEC 2022: β→α REGRESSION
              </div>
            </div>
          </div>
        )}

        {/* Individual Branch View */}
        {viewingIndividualBranch && selectedWorldline && currentWorldline && (
          <div 
            ref={individualTimelineRef}
            data-scrollable="true"
              style={{ 
              position: 'relative',
                width: '100%', 
              height: '100%',
              paddingTop: '100px',
              overflowX: 'auto',
              overflowY: 'auto',
              cursor: 'grab',
              scrollBehavior: 'smooth'
            }}
            onMouseDown={(e) => {
              const target = e.currentTarget as HTMLDivElement
              const startX = e.pageX - target.offsetLeft
              const scrollLeft = target.scrollLeft
              const mouseMoveHandler = (e: MouseEvent) => {
                const x = e.pageX - target.offsetLeft
                const walk = (x - startX) * 1.5
                target.scrollLeft = scrollLeft - walk
              }
              const mouseUpHandler = () => {
                document.removeEventListener('mousemove', mouseMoveHandler)
                document.removeEventListener('mouseup', mouseUpHandler)
                target.style.cursor = 'grab'
              }
              document.addEventListener('mousemove', mouseMoveHandler)
              document.addEventListener('mouseup', mouseUpHandler)
              target.style.cursor = 'grabbing'
            }}
          >
            <div style={{
              width: `${getWidthMultiplier(400, zoomLevel)}%`,
              height: '100%',
              position: 'relative',
              minWidth: '400vw',
              overflow: 'visible'
            }}>
              {/* Timeline markers */}
              <div style={{
                position: 'absolute',
                top: '10%',
                left: '0%',
                width: '100%',
                height: '40px',
                overflow: 'visible'
              }}>
                {(() => {
                  const config = getTimelineConfig(zoomLevel)
                  const markers: React.ReactElement[] = []
                  
                  if (config.division < 1) {
                    // Monthly markers
                    for (let year = timelineStart; year <= timelineEnd; year++) {
                      for (let month = 0; month < 12; month++) {
                        const totalMonths = (year - timelineStart) * 12 + month
                        const position = (totalMonths / (timelineSpan * 12)) * 100
                        if (position <= 100) {
                          markers.push(
                            <div key={`${year}-${month}`} style={{
                              position: 'absolute',
                              left: `${position}%`,
                              top: '-10px',
                              color: 'rgba(255, 170, 68, 0.4)',
                              fontSize: `${Math.max(8, 8 * Math.min(zoomLevel, 2))}px`,
                              fontFamily: 'monospace',
                              textAlign: 'center',
                              transform: 'translateX(-50%)',
                              whiteSpace: 'nowrap',
                              overflow: 'visible',
                              minWidth: '60px',
                              padding: '2px 4px',
                              backgroundColor: 'rgba(0, 0, 0, 0.2)',
                              borderRadius: '2px'
                            }}>
                              {config.format(year, month)}
                            </div>
                          )
                        }
                      }
                    }
                  } else {
                    // Yearly or multi-year markers
                    for (let i = 0; i <= config.totalMarkers; i++) {
                      const year = timelineStart + (i * config.division)
                      if (year <= timelineEnd) {
                        const position = ((year - timelineStart) / timelineSpan) * 100
                        markers.push(
                          <div key={year} style={{
                            position: 'absolute',
                            left: `${position}%`,
                            top: '-10px',
                            color: 'rgba(255, 170, 68, 0.4)',
                            fontSize: `${Math.max(8, 8 * Math.min(zoomLevel, 2))}px`,
                            fontFamily: 'monospace',
                            textAlign: 'center',
                            transform: 'translateX(-50%)',
                            whiteSpace: 'nowrap',
                            overflow: 'visible',
                            minWidth: '60px',
                            padding: '2px 4px',
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '2px'
                          }}>
                            {config.format(year)}
                          </div>
                        )
                      }
                    }
                  }
                  
                  return markers
                })()}
              </div>

              {/* Selected individual worldline */}
              <div style={{
                position: 'absolute',
                top: '30%',
                left: '0%',
                width: '100%',
                height: `${6 * zoomLevel}px`,
                background: 'linear-gradient(90deg, rgba(255, 170, 68, 1), rgba(255, 204, 136, 0.8), rgba(255, 170, 68, 0.6), rgba(255, 204, 136, 0.8), rgba(255, 170, 68, 1))',
                boxShadow: `0 0 ${20 * zoomLevel}px rgba(255, 170, 68, 0.8)`,
                animation: 'nixiePulse 2s infinite'
              }}>
                <div style={{
                  position: 'absolute',
                  left: '2%',
                  top: `${-30 * zoomLevel}px`,
                  color: 'rgba(255, 170, 68, 1)',
                  fontSize: `${16 * Math.min(zoomLevel, 2)}px`,
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  textShadow: '0 0 10px rgba(255, 170, 68, 0.8)'
                }}>
                  WORLDLINE: {(() => {
                    if (selectedWorldline && worldlineEvents[selectedWorldline]) {
                      const events = Object.values(worldlineEvents[selectedWorldline])
                      const selectedEvent = events[selectedEventIndex] as any
                      if (selectedEvent && selectedEvent.to_worldline) {
                        return selectedEvent.to_worldline.split(' ')[1]
                      }
                    }
                    return currentWorldline.percentage.toFixed(6) + '%'
                  })()}
                </div>

                {/* Individual worldline events */}
                {/* No individual events defined */}
              </div>
            </div>
          </div>
        )}

        {/* Branch View */}
        {selectedWorldline && currentWorldline && !viewingIndividualBranch && (
          <div 
            ref={branchTimelineRef}
            data-scrollable="true"
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              paddingTop: '100px',
              overflowX: 'auto',
              overflowY: 'auto',
              cursor: 'grab',
              scrollBehavior: 'smooth'
            }}
            onMouseDown={(e) => {
              const target = e.currentTarget as HTMLDivElement
              const startX = e.pageX - target.offsetLeft
              const scrollLeft = target.scrollLeft
              const mouseMoveHandler = (e: MouseEvent) => {
                const x = e.pageX - target.offsetLeft
                const walk = (x - startX) * 1.5
                target.scrollLeft = scrollLeft - walk
              }
              const mouseUpHandler = () => {
                document.removeEventListener('mousemove', mouseMoveHandler)
                document.removeEventListener('mouseup', mouseUpHandler)
                target.style.cursor = 'grab'
              }
              document.addEventListener('mousemove', mouseMoveHandler)
              document.addEventListener('mouseup', mouseUpHandler)
              target.style.cursor = 'grabbing'
            }}
          >
            <div style={{
              width: `${getWidthMultiplier(250, zoomLevel)}%`,
              height: '100%',
              position: 'relative',
              minWidth: '250vw',
              overflow: 'visible'
            }}>
              {/* Timeline markers for branch view */}
              <div style={{
                position: 'absolute',
                top: '5%',
                left: '0%',
                width: '100%',
                height: '40px',
                overflow: 'visible'
              }}>
                {(() => {
                  const config = getTimelineConfig(zoomLevel)
                  const markers: React.ReactElement[] = []
                  
                  if (config.division < 1) {
                    // Monthly markers
                    for (let year = timelineStart; year <= timelineEnd; year++) {
                      for (let month = 0; month < 12; month++) {
                        const totalMonths = (year - timelineStart) * 12 + month
                        const position = (totalMonths / (timelineSpan * 12)) * 100
                        if (position <= 100) {
                          markers.push(
                            <div key={`${year}-${month}`} style={{
                              position: 'absolute',
                              left: `${position}%`,
                              top: '-10px',
                              color: 'rgba(255, 170, 68, 0.4)',
                              fontSize: `${Math.max(8, 8 * Math.min(zoomLevel, 2))}px`,
                              fontFamily: 'monospace',
                              textAlign: 'center',
                              transform: 'translateX(-50%)',
                              whiteSpace: 'nowrap',
                              overflow: 'visible',
                              minWidth: '60px',
                              padding: '2px 4px',
                              backgroundColor: 'rgba(0, 0, 0, 0.2)',
                              borderRadius: '2px'
                            }}>
                              {config.format(year, month)}
                            </div>
                          )
                        }
                      }
                    }
                  } else {
                    // Yearly or multi-year markers
                    for (let i = 0; i <= config.totalMarkers; i++) {
                      const year = timelineStart + (i * config.division)
                      if (year <= timelineEnd) {
                        const position = ((year - timelineStart) / timelineSpan) * 100
                        markers.push(
                          <div key={year} style={{
                            position: 'absolute',
                            left: `${position}%`,
                            top: '-10px',
                            color: 'rgba(255, 170, 68, 0.4)',
                            fontSize: `${Math.max(8, 8 * Math.min(zoomLevel, 2))}px`,
                            fontFamily: 'monospace',
                            textAlign: 'center',
                            transform: 'translateX(-50%)',
                            whiteSpace: 'nowrap',
                            overflow: 'visible',
                            minWidth: '60px',
                            padding: '2px 4px',
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '2px'
                          }}>
                            {config.format(year)}
                          </div>
                        )
                      }
                    }
                  }
                  
                  return markers
                })()}
              </div>

              {/* Main worldline */}
              <div style={{
                position: 'absolute',
                top: '20%',
                left: '0%',
                width: '100%',
                height: `${4 * zoomLevel}px`,
                background: `linear-gradient(90deg, ${currentWorldline.color}, ${currentWorldline.color.replace('0.8', '0.4')}, ${currentWorldline.color})`,
                boxShadow: `0 0 ${12 * zoomLevel}px ${currentWorldline.color.replace('0.8', '0.6')}`,
              }}>
                <div style={{
                  position: 'absolute',
                  left: '10px',
                  top: `${-25 * zoomLevel}px`,
                  color: currentWorldline.color,
                  fontSize: `${14 * Math.min(zoomLevel, 2)}px`,
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  textShadow: `0 0 8px ${currentWorldline.color.replace('0.8', '0.4')}`
                }}>
                  {currentWorldline.name} ATTRACTOR FIELD: {currentWorldline.percentage.toFixed(6)}%
                </div>
              </div>

              {/* Attractor-specific event branches */}
              {selectedWorldline === 'alpha' && worldlineEvents.alpha && Object.entries(worldlineEvents.alpha).map(([eventId, event], index) => {
                const isSelected = index === selectedEventIndex
                
                // Check if this event branches from another event
                let parentBranchIndex = -1
                let branchStartTop = '20%' // Default to main alpha line
                
                if (event.from_worldline) {
                  // Find the parent event this branches from
                  const parentEvents = Object.entries(worldlineEvents.alpha)
                  parentBranchIndex = parentEvents.findIndex(([parentId, parentEvent]) => {
                    // Check direct ID match
                    if (parentId === event.from_worldline || parentEvent.id === event.from_worldline) {
                      return true
                    }
                    
                    // Check if from_worldline contains the parentId
                    if (event.from_worldline && event.from_worldline.includes(parentId)) {
                      return true
                    }
                    
                    // Check if from_worldline matches the parent's to_worldline format (e.g., "α: 0.060502%")
                    if (parentEvent.to_worldline === event.from_worldline) {
                      return true
                    }
                    
                    return false
                  })
                  
                  if (parentBranchIndex !== -1) {
                    // Branch from the parent event's branch line instead of main line
                    branchStartTop = `${30 + (parentBranchIndex * 8)}%`
                  }
                }
                
                return (
                <div key={eventId}>
                  {/* Vertical branch connection from main line (only if not branching from another event) */}
                  {parentBranchIndex === -1 && (
                    <div style={{
                      position: 'absolute',
                      left: `${event.position}%`,
                      top: branchStartTop,
                      width: '2px',
                      height: `${10 + (index * 8)}%`, // Different heights for different branches
                      background: isSelected 
                        ? 'linear-gradient(180deg, rgba(255, 102, 0, 1), rgba(255, 102, 0, 0.8))' 
                        : 'linear-gradient(180deg, rgba(255, 102, 0, 0.8), rgba(255, 102, 0, 0.4))',
                      zIndex: 5,
                      transform: 'translateX(-50%)',
                      boxShadow: isSelected ? '0 0 8px rgba(255, 102, 0, 0.8)' : 'none'
                    }}></div>
                  )}

                  {/* Vertical connection from parent branch to this branch (for child events) */}
                  {parentBranchIndex !== -1 && (
                    <div style={{
                      position: 'absolute',
                      left: `${event.position}%`,
                      top: branchStartTop,
                      width: '2px',
                      height: `${(30 + (index * 8)) - (30 + (parentBranchIndex * 8))}%`, // Connect to parent branch
                      background: isSelected 
                        ? 'linear-gradient(180deg, rgba(255, 102, 0, 1), rgba(255, 102, 0, 0.8))' 
                        : 'linear-gradient(180deg, rgba(255, 102, 0, 0.8), rgba(255, 102, 0, 0.4))',
                      zIndex: 5,
                      transform: 'translateX(-50%)',
                      boxShadow: isSelected ? '0 0 8px rgba(255, 102, 0, 0.8)' : 'none'
                    }}></div>
                  )}

                  {/* Connection node on parent branch (for child events) */}
                  {parentBranchIndex !== -1 && (
                    <div 
                      style={{
                        position: 'absolute',
                        left: `${event.position}%`,
                        top: branchStartTop,
                        width: `${4 * Math.min(zoomLevel, 2)}px`,
                        height: `${4 * Math.min(zoomLevel, 2)}px`,
                        borderRadius: '50%',
                        background: 'rgba(255, 102, 0, 1)',
                        boxShadow: `0 0 ${8 * zoomLevel}px rgba(255, 102, 0, 0.8)`,
                        border: '2px solid rgba(255, 255, 255, 0.5)',
                        zIndex: 9,
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  )}

                  {/* Horizontal branch line - extends to end of timeline */}
                  <div 
                    style={{
                      position: 'absolute',
                      left: `${event.position}%`,
                      top: `${30 + (index * 8)}%`, // Different vertical positions for different branches
                      width: `${100 - event.position}%`, // Extend to end of timeline
                      height: `${2 * zoomLevel}px`,
                      background: isSelected
                        ? 'linear-gradient(90deg, rgba(255, 102, 0, 1), rgba(255, 102, 0, 0.8), rgba(255, 102, 0, 0.6), rgba(255, 102, 0, 0.5))'
                        : 'linear-gradient(90deg, rgba(255, 102, 0, 1), rgba(255, 102, 0, 0.6), rgba(255, 102, 0, 0.4), rgba(255, 102, 0, 0.3))',
                      boxShadow: isSelected 
                        ? `0 0 ${15 * zoomLevel}px rgba(255, 102, 0, 0.9)` 
                        : `0 0 ${8 * zoomLevel}px rgba(255, 102, 0, 0.6)`,
                      transform: 'translateY(-50%)',
                      zIndex: 8,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: isSelected ? '1px solid rgba(255, 102, 0, 0.8)' : 'none'
                    }}
                    onClick={() => handleEventClick(eventId)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 ${12 * zoomLevel}px rgba(255, 102, 0, 0.9)`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = isSelected 
                        ? `0 0 ${15 * zoomLevel}px rgba(255, 102, 0, 0.9)` 
                        : `0 0 ${8 * zoomLevel}px rgba(255, 102, 0, 0.6)`
                    }}
                  >
                    {/* Branch percentage label - repositioned */}
                    <div style={{
                      position: 'absolute',
                      left: '12%',
                      top: `${-25 * zoomLevel}px`,
                      color: isSelected ? 'rgba(255, 102, 0, 1)' : 'rgba(255, 102, 0, 0.9)',
                      fontSize: `${10 * Math.min(zoomLevel, 1.5)}px`,
                      fontFamily: 'monospace',
                      textShadow: isSelected ? '0 0 8px rgba(255, 102, 0, 0.8)' : '0 0 4px rgba(255, 102, 0, 0.6)',
                      whiteSpace: 'nowrap',
                      backgroundColor: isSelected ? 'rgba(255, 102, 0, 0.2)' : 'rgba(0, 0, 0, 0.4)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: isSelected ? '1px solid rgba(255, 102, 0, 0.6)' : '1px solid rgba(255, 102, 0, 0.3)',
                      fontWeight: isSelected ? 'bold' : 'normal'
                    }}>
                      {event.to_worldline?.split(' ')[1]} {isSelected ? '◄' : ''}
                    </div>

                    {/* Date label on branch */}
                    <div style={{
                      position: 'absolute',
                      left: '25%',
                      top: `${-25 * zoomLevel}px`,
                      color: isSelected ? 'rgba(255, 102, 0, 1)' : 'rgba(255, 102, 0, 0.9)',
                      fontSize: `${9 * Math.min(zoomLevel, 1.5)}px`,
                      fontFamily: 'monospace',
                      textShadow: isSelected ? '0 0 8px rgba(255, 102, 0, 0.8)' : '0 0 6px rgba(255, 102, 0, 0.6)',
                      whiteSpace: 'nowrap',
                      backgroundColor: isSelected ? 'rgba(255, 102, 0, 0.2)' : 'rgba(0, 0, 0, 0.4)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: isSelected ? '1px solid rgba(255, 102, 0, 0.6)' : '1px solid rgba(255, 102, 0, 0.3)',
                      pointerEvents: 'none', // Prevent interference with branch click
                      fontWeight: isSelected ? 'bold' : 'normal'
                    }}>
                      {event.date.toUpperCase()}
                    </div>
                  </div>

                  {/* Event Node on main line (only if not branching from another event) */}
                  {parentBranchIndex === -1 && (
                    <div 
                      style={{
                        position: 'absolute',
                        left: `${event.position}%`,
                        top: '20%',
                        width: `${6 * Math.min(zoomLevel, 2)}px`,
                        height: `${6 * Math.min(zoomLevel, 2)}px`,
                        borderRadius: '50%',
                        background: isSelected ? 'rgba(255, 102, 0, 1)' : 'rgba(255, 102, 0, 1)',
                        boxShadow: isSelected 
                          ? `0 0 ${20 * zoomLevel}px rgba(255, 102, 0, 1)` 
                          : `0 0 ${12 * zoomLevel}px rgba(255, 102, 0, 0.8)`,
                        border: isSelected ? '3px solid rgba(255, 255, 255, 0.8)' : '2px solid rgba(255, 255, 255, 0.3)',
                        zIndex: 10,
                        cursor: 'pointer',
                        animation: isSelected ? 'nixiePulse 2s infinite' : 'nixiePulse 4s infinite',
                        transform: 'translate(-50%, -50%)'
                      }}
                      onClick={() => handleEventClick(eventId)}
                    />
                  )}
                </div>
                )
              })}

              {selectedWorldline === 'beta' && worldlineEvents.beta && Object.entries(worldlineEvents.beta).map(([eventId, event], index) => {
                const isSelected = index === selectedEventIndex
                
                // Check if this event branches from another event
                let parentBranchIndex = -1
                let branchStartTop = '20%' // Default to main beta line
                
                if (event.from_worldline) {
                  // Find the parent event this branches from
                  const parentEvents = Object.entries(worldlineEvents.beta)
                  parentBranchIndex = parentEvents.findIndex(([parentId, parentEvent]) => {
                    // Check direct ID match
                    if (parentId === event.from_worldline || parentEvent.id === event.from_worldline) {
                      return true
                    }
                    
                    // Check if from_worldline contains the parentId
                    if (event.from_worldline && event.from_worldline.includes(parentId)) {
                      return true
                    }
                    
                    // Check if from_worldline matches the parent's to_worldline format (e.g., "β: 1.130205%")
                    if (parentEvent.to_worldline === event.from_worldline) {
                      return true
                    }
                    
                    return false
                  })
                  
                  if (parentBranchIndex !== -1) {
                    // Branch from the parent event's branch line instead of main line
                    branchStartTop = `${30 + (parentBranchIndex * 8)}%`
                  }
                }
                
                return (
                <div key={eventId}>
                  {/* Vertical branch connection from main line (only if not branching from another event) */}
                  {parentBranchIndex === -1 && (
                    <div style={{
                      position: 'absolute',
                      left: `${event.position}%`,
                      top: branchStartTop,
                      width: '2px',
                      height: `${10 + (index * 8)}%`, // Different heights for different branches
                      background: isSelected 
                        ? 'linear-gradient(180deg, rgba(136, 255, 136, 1), rgba(136, 255, 136, 0.8))' 
                        : 'linear-gradient(180deg, rgba(136, 255, 136, 0.8), rgba(136, 255, 136, 0.4))',
                      zIndex: 5,
                      transform: 'translateX(-50%)',
                      boxShadow: isSelected ? '0 0 8px rgba(136, 255, 136, 0.8)' : 'none'
                    }}></div>
                  )}

                  {/* Vertical connection from parent branch to this branch (for child events) */}
                  {parentBranchIndex !== -1 && (
                    <div style={{
                      position: 'absolute',
                      left: `${event.position}%`,
                      top: branchStartTop,
                      width: '2px',
                      height: `${(30 + (index * 8)) - (30 + (parentBranchIndex * 8))}%`, // Connect to parent branch
                      background: isSelected 
                        ? 'linear-gradient(180deg, rgba(136, 255, 136, 1), rgba(136, 255, 136, 0.8))' 
                        : 'linear-gradient(180deg, rgba(136, 255, 136, 0.8), rgba(136, 255, 136, 0.4))',
                      zIndex: 5,
                      transform: 'translateX(-50%)',
                      boxShadow: isSelected ? '0 0 8px rgba(136, 255, 136, 0.8)' : 'none'
                    }}></div>
                  )}

                  {/* Connection node on parent branch (for child events) */}
                  {parentBranchIndex !== -1 && (
                    <div 
                      style={{
                        position: 'absolute',
                        left: `${event.position}%`,
                        top: branchStartTop,
                        width: `${4 * Math.min(zoomLevel, 2)}px`,
                        height: `${4 * Math.min(zoomLevel, 2)}px`,
                        borderRadius: '50%',
                        background: 'rgba(136, 255, 136, 1)',
                        boxShadow: `0 0 ${8 * zoomLevel}px rgba(136, 255, 136, 0.8)`,
                        border: '2px solid rgba(255, 255, 255, 0.5)',
                        zIndex: 9,
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  )}

                  {/* Horizontal branch line - extends to end of timeline */}
                  <div 
                    style={{
                      position: 'absolute',
                      left: `${event.position}%`,
                      top: `${30 + (index * 8)}%`, // Different vertical positions for different branches
                      width: `${100 - event.position}%`, // Extend to end of timeline
                      height: `${2 * zoomLevel}px`,
                      background: isSelected
                        ? 'linear-gradient(90deg, rgba(136, 255, 136, 1), rgba(136, 255, 136, 0.8), rgba(136, 255, 136, 0.6), rgba(136, 255, 136, 0.5))'
                        : 'linear-gradient(90deg, rgba(136, 255, 136, 1), rgba(136, 255, 136, 0.6), rgba(136, 255, 136, 0.4), rgba(136, 255, 136, 0.3))',
                      boxShadow: isSelected 
                        ? `0 0 ${15 * zoomLevel}px rgba(136, 255, 136, 0.9)` 
                        : `0 0 ${8 * zoomLevel}px rgba(136, 255, 136, 0.6)`,
                      transform: 'translateY(-50%)',
                      zIndex: 8,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: isSelected ? '1px solid rgba(136, 255, 136, 0.8)' : 'none'
                    }}
                    onClick={() => handleEventClick(eventId)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 ${12 * zoomLevel}px rgba(136, 255, 136, 0.9)`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = isSelected 
                        ? `0 0 ${15 * zoomLevel}px rgba(136, 255, 136, 0.9)` 
                        : `0 0 ${8 * zoomLevel}px rgba(136, 255, 136, 0.6)`
                    }}
                  >
                    {/* Branch percentage label - repositioned */}
                    <div style={{
                      position: 'absolute',
                      left: '12%',
                      top: `${-25 * zoomLevel}px`,
                      color: isSelected ? 'rgba(136, 255, 136, 1)' : 'rgba(136, 255, 136, 0.9)',
                      fontSize: `${10 * Math.min(zoomLevel, 1.5)}px`,
                      fontFamily: 'monospace',
                      textShadow: isSelected ? '0 0 8px rgba(136, 255, 136, 0.8)' : '0 0 4px rgba(136, 255, 136, 0.6)',
                      whiteSpace: 'nowrap',
                      backgroundColor: isSelected ? 'rgba(136, 255, 136, 0.2)' : 'rgba(0, 0, 0, 0.4)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: isSelected ? '1px solid rgba(136, 255, 136, 0.6)' : '1px solid rgba(136, 255, 136, 0.3)',
                      fontWeight: isSelected ? 'bold' : 'normal'
                    }}>
                      {event.to_worldline?.split(' ')[1]} {isSelected ? '◄' : ''}
                    </div>

                    {/* Date label on branch */}
                    <div style={{
                      position: 'absolute',
                      left: '25%',
                      top: `${-25 * zoomLevel}px`,
                      color: isSelected ? 'rgba(136, 255, 136, 1)' : 'rgba(136, 255, 136, 0.9)',
                      fontSize: `${9 * Math.min(zoomLevel, 1.5)}px`,
                      fontFamily: 'monospace',
                      textShadow: isSelected ? '0 0 8px rgba(136, 255, 136, 0.8)' : '0 0 6px rgba(136, 255, 136, 0.6)',
                      whiteSpace: 'nowrap',
                      backgroundColor: isSelected ? 'rgba(136, 255, 136, 0.2)' : 'rgba(0, 0, 0, 0.4)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: isSelected ? '1px solid rgba(136, 255, 136, 0.6)' : '1px solid rgba(136, 255, 136, 0.3)',
                      pointerEvents: 'none', // Prevent interference with branch click
                      fontWeight: isSelected ? 'bold' : 'normal'
                    }}>
                      {event.date.toUpperCase()}
                    </div>
                  </div>

                  {/* Event Node on main line (only if not branching from another event) */}
                  {parentBranchIndex === -1 && (
                    <div 
                      style={{
                        position: 'absolute',
                        left: `${event.position}%`,
                        top: '20%',
                        width: `${6 * Math.min(zoomLevel, 2)}px`,
                        height: `${6 * Math.min(zoomLevel, 2)}px`,
                        borderRadius: '50%',
                        background: isSelected ? 'rgba(136, 255, 136, 1)' : 'rgba(136, 255, 136, 1)',
                        boxShadow: isSelected 
                          ? `0 0 ${20 * zoomLevel}px rgba(136, 255, 136, 1)` 
                          : `0 0 ${12 * zoomLevel}px rgba(136, 255, 136, 0.8)`,
                        border: isSelected ? '3px solid rgba(255, 255, 255, 0.8)' : '2px solid rgba(255, 255, 255, 0.3)',
                        zIndex: 10,
                        cursor: 'pointer',
                        animation: isSelected ? 'nixiePulse 2s infinite' : 'nixiePulse 3.5s infinite',
                        transform: 'translate(-50%, -50%)'
                      }}
                      onClick={() => handleEventClick(eventId)}
                    />
                  )}
                </div>
                )
              })}

              {selectedWorldline === 'gamma' && worldlineEvents.gamma && Object.entries(worldlineEvents.gamma).map(([eventId, event], index) => {
                const isSelected = index === selectedEventIndex
                
                // Check if this event branches from another event
                let parentBranchIndex = -1
                let branchStartTop = '20%' // Default to main gamma line
                
                if (event.from_worldline) {
                  // Find the parent event this branches from
                  const parentEvents = Object.entries(worldlineEvents.gamma)
                  parentBranchIndex = parentEvents.findIndex(([parentId, parentEvent]) => {
                    // Check direct ID match
                    if (parentId === event.from_worldline || parentEvent.id === event.from_worldline) {
                      return true
                    }
                    
                    // Check if from_worldline contains the parentId
                    if (event.from_worldline && event.from_worldline.includes(parentId)) {
                      return true
                    }
                    
                    // Check if from_worldline matches the parent's to_worldline format (e.g., "γ: 2.000000%")
                    if (parentEvent.to_worldline === event.from_worldline) {
                      return true
                    }
                    
                    return false
                  })
                  
                  if (parentBranchIndex !== -1) {
                    // Branch from the parent event's branch line instead of main line
                    branchStartTop = `${30 + (parentBranchIndex * 8)}%`
                  }
                }
                
                return (
                <div key={eventId}>
                  {/* Vertical branch connection from main line (only if not branching from another event) */}
                  {parentBranchIndex === -1 && (
                    <div style={{
                      position: 'absolute',
                      left: `${event.position}%`,
                      top: branchStartTop,
                      width: '2px',
                      height: `${10 + (index * 8)}%`, // Different heights for different branches
                      background: isSelected 
                        ? 'linear-gradient(180deg, rgba(255, 255, 136, 1), rgba(255, 255, 136, 0.8))' 
                        : 'linear-gradient(180deg, rgba(255, 255, 136, 0.8), rgba(255, 255, 136, 0.4))',
                      zIndex: 5,
                      transform: 'translateX(-50%)',
                      boxShadow: isSelected ? '0 0 8px rgba(255, 255, 136, 0.8)' : 'none'
                    }}></div>
                  )}

                  {/* Vertical connection from parent branch to this branch (for child events) */}
                  {parentBranchIndex !== -1 && (
                    <div style={{
                      position: 'absolute',
                      left: `${event.position}%`,
                      top: branchStartTop,
                      width: '2px',
                      height: `${(30 + (index * 8)) - (30 + (parentBranchIndex * 8))}%`, // Connect to parent branch
                      background: isSelected 
                        ? 'linear-gradient(180deg, rgba(255, 255, 136, 1), rgba(255, 255, 136, 0.8))' 
                        : 'linear-gradient(180deg, rgba(255, 255, 136, 0.8), rgba(255, 255, 136, 0.4))',
                      zIndex: 5,
                      transform: 'translateX(-50%)',
                      boxShadow: isSelected ? '0 0 8px rgba(255, 255, 136, 0.8)' : 'none'
                    }}></div>
                  )}

                  {/* Connection node on parent branch (for child events) */}
                  {parentBranchIndex !== -1 && (
                    <div 
                      style={{
                        position: 'absolute',
                        left: `${event.position}%`,
                        top: branchStartTop,
                        width: `${4 * Math.min(zoomLevel, 2)}px`,
                        height: `${4 * Math.min(zoomLevel, 2)}px`,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 136, 1)',
                        boxShadow: `0 0 ${8 * zoomLevel}px rgba(255, 255, 136, 0.8)`,
                        border: '2px solid rgba(255, 255, 255, 0.5)',
                        zIndex: 9,
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  )}

                  {/* Horizontal branch line - extends to end of timeline */}
                  <div 
                    style={{
                      position: 'absolute',
                      left: `${event.position}%`,
                      top: `${30 + (index * 8)}%`, // Different vertical positions for different branches
                      width: `${100 - event.position}%`, // Extend to end of timeline
                      height: `${2 * zoomLevel}px`,
                      background: isSelected
                        ? 'linear-gradient(90deg, rgba(255, 255, 136, 1), rgba(255, 255, 136, 0.8), rgba(255, 255, 136, 0.6), rgba(255, 255, 136, 0.5))'
                        : 'linear-gradient(90deg, rgba(255, 255, 136, 1), rgba(255, 255, 136, 0.6), rgba(255, 255, 136, 0.4), rgba(255, 255, 136, 0.3))',
                      boxShadow: isSelected 
                        ? `0 0 ${15 * zoomLevel}px rgba(255, 255, 136, 0.9)` 
                        : `0 0 ${8 * zoomLevel}px rgba(255, 255, 136, 0.6)`,
                      transform: 'translateY(-50%)',
                      zIndex: 8,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: isSelected ? '1px solid rgba(255, 255, 136, 0.8)' : 'none'
                    }}
                    onClick={() => handleEventClick(eventId)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 ${12 * zoomLevel}px rgba(255, 255, 136, 0.9)`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = isSelected 
                        ? `0 0 ${15 * zoomLevel}px rgba(255, 255, 136, 0.9)` 
                        : `0 0 ${8 * zoomLevel}px rgba(255, 255, 136, 0.6)`
                    }}
                  >
                    {/* Branch percentage label - repositioned */}
                    <div style={{
                      position: 'absolute',
                      left: '12%',
                      top: `${-25 * zoomLevel}px`,
                      color: isSelected ? 'rgba(255, 255, 136, 1)' : 'rgba(255, 255, 136, 0.9)',
                      fontSize: `${10 * Math.min(zoomLevel, 1.5)}px`,
                      fontFamily: 'monospace',
                      textShadow: isSelected ? '0 0 8px rgba(255, 255, 136, 0.8)' : '0 0 4px rgba(255, 255, 136, 0.6)',
                      whiteSpace: 'nowrap',
                      backgroundColor: isSelected ? 'rgba(255, 255, 136, 0.2)' : 'rgba(0, 0, 0, 0.4)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: isSelected ? '1px solid rgba(255, 255, 136, 0.6)' : '1px solid rgba(255, 255, 136, 0.3)',
                      fontWeight: isSelected ? 'bold' : 'normal'
                    }}>
                      {event.to_worldline?.split(' ')[1]} {isSelected ? '◄' : ''}
                    </div>

                    {/* Date label on branch */}
                    <div style={{
                      position: 'absolute',
                      left: '25%',
                      top: `${-25 * zoomLevel}px`,
                      color: isSelected ? 'rgba(255, 255, 136, 1)' : 'rgba(255, 255, 136, 0.9)',
                      fontSize: `${9 * Math.min(zoomLevel, 1.5)}px`,
                      fontFamily: 'monospace',
                      textShadow: isSelected ? '0 0 8px rgba(255, 255, 136, 0.8)' : '0 0 6px rgba(255, 255, 136, 0.6)',
                      whiteSpace: 'nowrap',
                      backgroundColor: isSelected ? 'rgba(255, 255, 136, 0.2)' : 'rgba(0, 0, 0, 0.4)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: isSelected ? '1px solid rgba(255, 255, 136, 0.6)' : '1px solid rgba(255, 255, 136, 0.3)',
                      pointerEvents: 'none', // Prevent interference with branch click
                      fontWeight: isSelected ? 'bold' : 'normal'
                    }}>
                      {event.date.toUpperCase()}
                    </div>
                  </div>

                  {/* Event Node on main line (only if not branching from another event) */}
                  {parentBranchIndex === -1 && (
                    <div 
                      style={{
                        position: 'absolute',
                        left: `${event.position}%`,
                        top: '20%',
                        width: `${6 * Math.min(zoomLevel, 2)}px`,
                        height: `${6 * Math.min(zoomLevel, 2)}px`,
                        borderRadius: '50%',
                        background: isSelected ? 'rgba(255, 255, 136, 1)' : 'rgba(255, 255, 136, 1)',
                        boxShadow: isSelected 
                          ? `0 0 ${20 * zoomLevel}px rgba(255, 255, 136, 1)` 
                          : `0 0 ${12 * zoomLevel}px rgba(255, 255, 136, 0.8)`,
                        border: isSelected ? '3px solid rgba(255, 255, 255, 0.8)' : '2px solid rgba(255, 255, 255, 0.3)',
                        zIndex: 10,
                        cursor: 'pointer',
                        animation: isSelected ? 'nixiePulse 2s infinite' : 'nixiePulse 3s infinite',
                        transform: 'translate(-50%, -50%)'
                      }}
                      onClick={() => handleEventClick(eventId)}
                    />
                  )}
                </div>
                )
              })}
            </div>
        </div>
        )}

        {/* Grid overlay */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          background: `
            linear-gradient(90deg, rgba(255, 170, 68, ${0.02 * zoomLevel}) 1px, transparent 1px),
            linear-gradient(0deg, rgba(255, 170, 68, ${0.02 * zoomLevel}) 1px, transparent 1px)
          `,
          backgroundSize: `${50 / zoomLevel}px ${25 / zoomLevel}px`,
          pointerEvents: 'none',
          opacity: Math.min(1, zoomLevel / 2)
        }}></div>
      </div>

      {/* Full-Screen Transition Overlay */}
      {isFullScreenTransition && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: fullScreenPhase === 'flashbang1' 
            ? 'rgba(255, 255, 255, 1)' 
            : fullScreenPhase === 'zoomout'
            ? 'rgba(0, 0, 0, 0.95)' // Dark background during reveal
            : 'rgba(0, 0, 0, 0.95)',
          opacity: fullScreenPhase === 'fadeout' ? 0 : 1,
          transition: fullScreenPhase === 'fadeout' ? 'opacity 2s ease-out' 
            : fullScreenPhase === 'zoomout' ? 'background-color 0.3s ease-out'
            : 'none',
          backdropFilter: fullScreenPhase !== 'flashbang1' ? 'blur(10px)' : 'none',
          overflow: 'hidden',
          // CRT Effect Base
          filter: fullScreenPhase !== 'flashbang1' ? 'contrast(1.2) brightness(1.1) saturate(1.3)' : 'none'
        }}>
          
          {/* CRT Effects - Full Screen */}
          {fullScreenPhase !== 'flashbang1' && (
            <>
              {/* CRT Scan Lines */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(255, 170, 68, 0.12) 2px,
                  rgba(255, 170, 68, 0.12) 4px
                )`,
                pointerEvents: 'none',
                zIndex: 15,
                animation: 'scanlines 0.1s linear infinite'
              }}></div>
              
              {/* CRT Curvature and Glow */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: `radial-gradient(
                  ellipse at center,
                  transparent 35%,
                  rgba(0, 0, 0, 0.15) 65%,
                  rgba(0, 0, 0, 0.45) 100%
                )`,
                pointerEvents: 'none',
                zIndex: 16,
                boxShadow: 'inset 0 0 250px rgba(255, 170, 68, 0.2)'
              }}></div>
              
              {/* CRT Flicker Effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(255, 140, 50, 0.04)',
                pointerEvents: 'none',
                zIndex: 17,
                animation: 'crtFlicker 0.15s ease-in-out infinite alternate'
              }}></div>
            </>
          )}
          
          {/* Wavy Screen Distortion Effect */}
          {(fullScreenPhase === 'fadeout' || fullScreenPhase === 'shrinking') && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: `repeating-linear-gradient(
                90deg,
                transparent 0px,
                rgba(255, 170, 68, 0.1) 1px,
                transparent 2px,
                transparent 8px
              )`,
              pointerEvents: 'none',
              zIndex: 18,
              animation: 'wavyDistortion 0.3s ease-in-out infinite',
              filter: 'blur(0.5px)',
              transform: fullScreenPhase === 'fadeout' ? 'scaleY(1.02)' : 'scaleY(1.01)',
              opacity: fullScreenPhase === 'fadeout' ? 0.8 : 0.6
            }}></div>
          )}
          
          {/* Additional Wave Lines */}
          {(fullScreenPhase === 'fadeout' || fullScreenPhase === 'shrinking') && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: `repeating-linear-gradient(
                0deg,
                transparent 0px,
                rgba(255, 170, 68, 0.08) 0.5px,
                transparent 1px,
                transparent 12px
              )`,
              pointerEvents: 'none',
              zIndex: 19,
              animation: 'wavyDistortion2 0.4s ease-in-out infinite reverse',
              filter: 'blur(1px)',
              transform: 'skewX(0.5deg)'
            }}></div>
          )}
          
          {/* Flying Equations Background */}
          {fullScreenPhase !== 'flashbang1' && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
              pointerEvents: 'none'
            }}>
              {[
                'E = mc²',
                'ℏ∂ψ/∂t = Ĥψ',
                '∮ E⃗ · dl⃗ = -dΦB/dt',
                'F = ma',
                '∇ × B⃗ = μ₀J⃗ + μ₀ε₀∂E⃗/∂t',
                'ΔE·Δt ≥ ℏ/2',
                'ds² = c²dt² - dx² - dy² - dz²',
                'R_μν - ½gμνR = 8πGTμν'
              ].map((equation, index) => {
                 // Position equations in a circle around the center (meter area)
                 const angle = (index * 360 / 8) * (Math.PI / 180) // 8 equations in circle
                 const radius = 30 + (index % 2) * 20 // Varying distances from center
                 const centerX = 50 + Math.cos(angle) * radius
                 const centerY = 50 + Math.sin(angle) * radius
                 
                 return (
                   <div 
                     key={index}
                     style={{
                       position: 'absolute',
                       left: `${centerX}%`,
                       top: `${centerY}%`,
                       color: 'rgba(255, 170, 68, 0.8)',
                       fontSize: `${22 + (index % 3) * 6}px`,
                       fontFamily: 'monospace',
                       textShadow: '0 0 10px rgba(255, 170, 68, 0.9), 0 0 20px rgba(255, 170, 68, 0.6)',
                       whiteSpace: 'nowrap',
                       animation: `typingFlyOut${index % 3} ${6 + (index % 3) * 2}s infinite ease-out`,
                       animationDelay: `${(index * 0.8)}s`,
                       opacity: fullScreenPhase === 'fadeout' ? 0 : 0.8,
                       transformOrigin: 'center center'
                     }}
                   >
                     <span style={{
                       animation: `typewriter ${equation.length * 0.2}s steps(${equation.length}) both`,
                       animationDelay: `${(index * 0.8)}s`,
                       overflow: 'hidden',
                       whiteSpace: 'nowrap',
                       display: 'inline-block',
                       width: 0
                     }}>
                       {equation}
                     </span>
                   </div>
                 )
               })}
            </div>
          )}
          
          {/* Full-Screen Nixie Display - render during ALL phases */}
          <div style={{
            width: '800px',
            height: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            position: 'relative',
            transform: fullScreenPhase === 'shrinking' || fullScreenPhase === 'fadeout'
              ? 'scale(0.1)' // End tiny
              : `scale(${zoomScale})`, // Use dynamic zoom scale for all other phases
            opacity: fullScreenPhase === 'shrinking' || fullScreenPhase === 'fadeout'
              ? 0.2 
              : fullScreenPhase === 'flashbang1'
              ? 0 // Hidden during flashbang but still rendering
              : 1,
            transition: fullScreenPhase === 'zoomout'
              ? 'transform 3s ease-out' // Scale down transition over 3s
              : fullScreenPhase === 'flashbang1'
              ? 'transform 2s ease-in, opacity 0.3s ease-out' // Scale up during flashbang, fade in after
              : fullScreenPhase === 'shrinking' || fullScreenPhase === 'fadeout'
              ? 'transform 2s ease-in, opacity 2s ease-in' 
              : 'none'
          }}>
            
            <Canvas 
              camera={{ position: [0.00, 0.14, 0.15] }}
              gl={{ preserveDrawingBuffer: true }}
              style={{ width: '100%', height: '100%', zIndex: 5 }}
            >
              <ambientLight intensity={0.1} />
              <directionalLight position={[-5, 8, -2]} intensity={0.3} />
              <pointLight position={[-1, 1, 2]} intensity={0.6} color="#ff6600" />
              
              <Suspense fallback={<Html center>Loading...</Html>}>
                <Model 
                  displayMode="custom"
                  customValue={fullScreenValue}
                  showDots={[false, false]}
                />
              </Suspense>
              
              <OrbitControls 
                enablePan={false}
                enableZoom={false}
                enableRotate={false}
                target={[0, 0.06, -0.02]}
              />
            </Canvas>
          </div>
        </div>
      )}

      {/* Divergence Meter Canvas - Bottom Right */}
      <div 
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          width: '400px',
          height: '220px',
          zIndex: 50,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: isTransitioning ? '2px solid rgba(255, 170, 68, 0.8)' : '2px solid #333',
          borderRadius: '8px',
          padding: '10px',
          boxShadow: isTransitioning 
            ? '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 170, 68, 0.3)' 
            : '0 4px 12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
        }}
      >
        <Canvas 
          camera={{ position: [0.00, 0.14, 0.15] }}
          gl={{ preserveDrawingBuffer: true }}
        >
          <ambientLight intensity={0.05} />
          <directionalLight position={[-5, 8, -2]} intensity={0.15} />
          <pointLight position={[-1, 1, 2]} intensity={0.3} color="#ff6600" />
          
          <Suspense fallback={<Html center>Loading...</Html>}>
            <Model 
              displayMode={displayMode}
              customValue={displayMode === 'custom' ? customValue : undefined}
              showDots={displayMode === 'clock' ? [true, true] : [false, false]}
            />
          </Suspense>
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            target={[0, 0.06, -0.02]}
            onChange={(e) => {
              if (e?.target?.object?.position && e?.target?.target) {
                const pos = e.target.object.position;
                const target = e.target.target;
                console.log(`Camera position: [${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}]`);
                console.log(`Target position: [${target.x.toFixed(2)}, ${target.y.toFixed(2)}, ${target.z.toFixed(2)}]`);
                console.log('---');
              }
            }}
          />
        </Canvas>
      </div>

      {/* Event Modal */}
      {modalOpen && selectedEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={closeModal}
        >
          <div style={{
            backgroundColor: 'rgba(10, 20, 30, 0.95)',
            border: '2px solid rgba(255, 170, 68, 0.5)',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            fontFamily: 'monospace',
            color: 'rgba(255, 170, 68, 0.9)',
            boxShadow: '0 0 30px rgba(255, 170, 68, 0.3)',
            backdropFilter: 'blur(10px)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              borderBottom: '1px solid rgba(255, 170, 68, 0.3)',
              paddingBottom: '15px',
              marginBottom: '20px'
            }}>
              <h2 style={{
                margin: '0 0 10px 0',
                color: 'rgba(255, 170, 68, 1)',
                fontSize: '18px',
                textShadow: '0 0 8px rgba(255, 170, 68, 0.6)'
              }}>
                {selectedEvent.title}
              </h2>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 170, 68, 0.7)',
                marginBottom: '5px'
              }}>
                📅 {selectedEvent.date}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 170, 68, 0.6)'
              }}>
                {selectedEvent.from_worldline} → {selectedEvent.to_worldline}
              </div>
            </div>

            {/* Modal Content */}
            <div style={{
              lineHeight: '1.6',
              fontSize: '14px',
              whiteSpace: 'pre-line'
            }}>
              {selectedEvent.lore}
            </div>

            {/* Close Button */}
            <div style={{
              marginTop: '25px',
              textAlign: 'center'
            }}>
              <button
                onClick={closeModal}
                style={{
                  backgroundColor: 'rgba(255, 170, 68, 0.1)',
                  border: '1px solid rgba(255, 170, 68, 0.5)',
                  borderRadius: '6px',
                  padding: '8px 20px',
                  color: 'rgba(255, 170, 68, 0.9)',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 170, 68, 0.2)'
                  e.currentTarget.style.borderColor = 'rgba(255, 170, 68, 0.8)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 170, 68, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(255, 170, 68, 0.5)'
                }}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App