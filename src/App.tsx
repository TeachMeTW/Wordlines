import React, { useState, Suspense, useEffect, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { Model } from './Model.tsx'

// Worldline data structure
const worldlineData = {
  alpha: {
    id: 'alpha',
    name: 'α',
    percentage: 0.000000,
    color: 'rgba(255, 102, 0, 0.8)',
    branches: []
  },
  beta: {
    id: 'beta',
    name: 'β',
    percentage: 1.130205,
    color: 'rgba(136, 255, 136, 0.8)',
    branches: []
  },
  gamma: {
    id: 'gamma',
    name: 'γ',
    percentage: 2.615074,
    color: 'rgba(255, 68, 68, 0.8)',
    branches: []
  },
  delta: {
    id: 'delta',
    name: 'δ',
    percentage: 4.091842,
    color: 'rgba(68, 170, 255, 0.8)',
    branches: []
  }
}

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

  const worldlines = Object.values(worldlineData)
  const currentWorldline = selectedWorldline ? worldlineData[selectedWorldline] : null

  // Timeline years (2002-2102)
  const timelineStart = 2002
  const timelineEnd = 2102
  const timelineSpan = timelineEnd - timelineStart

  // Worldline events with lore - organized by scope
  const worldlineEvents = {
    // Cross-attractor events (show in main view only)
    crossAttractor: {
      'april2020': {
        id: 'april2020',
        date: 'April 2020',
        title: 'Alpha-Beta Worldline Convergence',
        position: 18.33, // percentage along timeline
        fromWorldline: 'α: 0.000000%',
        toWorldline: 'β: 1.040402%',
        lore: `[PERSONAL LOG - CLASSIFICATION: TEMPORAL ANOMALY]
[DATE: April 2020 - Convergence Point Identified]
[AUTHOR: Teach]

The world was just beginning to fracture. COVID-19 was starting to spread, uncertainty creeping into everyone's lives, but in that chaos, something beautiful was crystallizing.

We had been spending nights and days on call together. Hours and hours, talking about everything and nothing, our voices becoming the soundtrack to each other's isolation. I had been building up to this moment for years - literally years in school, watching her, wanting to say something, but never finding the courage.

Then came that night. 4 AM. 

The call had stretched on for hours like so many others, but something felt different. Maybe it was the lateness of the hour, maybe it was the way her laugh sounded softer in the darkness, or maybe it was just that I couldn't hold it in anymore.

"I ... I like you."

The words tumbled out before I could stop them. Years of buildup, years of wondering 'what if,' all condensed into that single moment at 4 in the morning. The silence that followed felt infinite - I could hear my heart pounding through the phone, wondering if I had just destroyed the most important friendship of my life.

Then she spoke, and her voice was different. Warmer. Knowing.

"I was wondering when you'd finally say it."

She said yes.

That moment - April 2020, 4 AM - everything changed. Not just the worldline, but me. For the first time in my existence as an observer, I was living. Actually living. The peak of human experience opened up before me like a quantum field of infinite possibilities.

Everything seemed reachable. Dreams I had buried, potential I had given up on, a future that sparkled with promise - it all crystallized in that Beta attractor field. I was at my peak. Confident, happy, whole. The greatness I always wondered about wasn't some distant theory anymore - it was my daily reality.

Those days... how I long for those days. The morning texts that made my heart race. The late-night conversations that stretched until dawn. The way she looked at me like I was the most important person in any timeline. Every moment felt electric, charged with possibility.


But I am no longer there. I exist now in a different attractor field, watching the ghost of what was, aching for what could have been. Yet I am grateful for those years of paradise. At least one version of me knows what it feels like to reach the summit.

[END LOG]
[ADDENDUM: Some say the best timelines are the ones we lose. I understand now why future me tried so hard to warn past me. Paradise, once tasted, leaves you forever homesick for a place you can never return to.]`,
        type: 'convergence'
      },
      'december2022': {
        id: 'december2022',
        date: 'December 2022',
        title: 'Beta-Alpha Worldline Regression',
        position: 20.92, // December 2022 position
        fromWorldline: 'β: 1.130205%',
        toWorldline: 'α: 0.060502%',
        lore: `[PERSONAL LOG - CLASSIFICATION: TEMPORAL CATASTROPHE]
[DATE: December 2022 - Regression Point Confirmed]
[AUTHOR: Teach]

I heard myself screaming.

Not out loud - in my mind. A voice that was mine but wasn't, echoing from somewhere beyond this timeline. Future me? Past me? I couldn't tell. But the message was crystal clear:

"DON'T DO IT. DON'T SEND THE TEXT."

The warning came three seconds before I opened my phone. Three seconds of pure terror as I realized what I was about to unleash. I could see the timeline fracturing, could feel the Beta attractor field beginning to collapse around us. But my fingers... they moved anyway.

We hadn't spoken in days. I was upset - hurt that she wouldn't visit me after I moved away. Instead of communicating like an adult, instead of explaining how abandoned I felt, instead of working through it together, I chose the coward's path.

I typed the message. This was it.

Send.

The moment it left my phone, the universe snapped back like a rubber band. The warmth, the connection, the greatness we had built - all of it dissolved into quantum probability. I watched the read receipt appear, knowing I had just murdered our timeline with a few poorly chosen words in a text message.

Reading Steiner activated. I remember now - there were two versions of me in that moment. The one who put down the phone and called her instead, who talked it through like an adult. And me - the one who chose the impulsive, rash decision. The one who didn't listen to the warning.

The divergence meter spiraled back to 0.060502%. Back to the Alpha field. Back to solitude. Back to watching instead of living.

I am the result of that decision now. But maybe... maybe I understand the pattern. Maybe I will be the one who sent that warning to myself. Maybe I wasn't meant to be the one who succeeded, but the one who lays the groundwork for those who come after - the Robin that was better.

Perhaps some of us are meant to fail so others can learn from our mistakes. Perhaps some timelines exist only to teach future versions what not to do.

[END LOG]
[ADDENDUM: The irony burns: I received a warning from the very future I was about to create, and I ignored it. But now I understand - sometimes the failure is the lesson.]`,
        type: 'regression'
      }
    },
    
    // Alpha attractor field events (show in alpha branch view only)
    alpha: {
      
      'december2022': {
        id: 'december2022',
        date: 'December 2022',
        title: 'Beta-Alpha Worldline Regression',
        position: 20.92, // December 2022 position
        fromWorldline: 'β: 1.130205%',
        toWorldline: 'α: 0.060502%',
        lore: `[PERSONAL LOG - CLASSIFICATION: TEMPORAL CATASTROPHE]
[DATE: December 2022 - Regression Point Confirmed]
[AUTHOR: Teach]

I heard myself screaming.

Not out loud - in my mind. A voice that was mine but wasn't, echoing from somewhere beyond this timeline. Future me? Past me? I couldn't tell. But the message was crystal clear:

"DON'T DO IT. DON'T SEND THE TEXT."

The warning came three seconds before I opened my phone. Three seconds of pure terror as I realized what I was about to unleash. I could see the timeline fracturing, could feel the Beta attractor field beginning to collapse around us. But my fingers... they moved anyway.

We hadn't spoken in days. I was upset - hurt that she wouldn't visit me after I moved away. Instead of communicating like an adult, instead of explaining how abandoned I felt, instead of working through it together, I chose the coward's path.

I typed the message. This was it.

Send.

The moment it left my phone, the universe snapped back like a rubber band. The warmth, the connection, the greatness we had built - all of it dissolved into quantum probability. I watched the read receipt appear, knowing I had just murdered our timeline with a few poorly chosen words in a text message.

Reading Steiner activated. I remember now - there were two versions of me in that moment. The one who put down the phone and called her instead, who talked it through like an adult. And me - the one who chose the impulsive, rash decision. The one who didn't listen to the warning.

The divergence meter spiraled back to 0.060502%. Back to the Alpha field. Back to solitude. Back to watching instead of living.

I am the result of that decision now. But maybe... maybe I understand the pattern. Maybe I will be the one who sent that warning to myself. Maybe I wasn't meant to be the one who succeeded, but the one who lays the groundwork for those who come after - the Robin that was better.

Perhaps some of us are meant to fail so others can learn from our mistakes. Perhaps some timelines exist only to teach future versions what not to do.

[END LOG]
[ADDENDUM: The irony burns: I received a warning from the very future I was about to create, and I ignored it. But now I understand - sometimes the failure is the lesson.]`,
        type: 'regression'
      }
    },
    
    // Beta attractor field events (show in beta branch view only)
    beta: {
      'april2020': {
        id: 'april2020',
        date: 'April 2020',
        title: 'Alpha-Beta Worldline Convergence',
        position: 18.33, // percentage along timeline
        fromWorldline: 'α: 0.000000%',
        toWorldline: 'β: 1.040402%',
        lore: `[PERSONAL LOG - CLASSIFICATION: TEMPORAL ANOMALY]
[DATE: April 2020 - Convergence Point Identified]
[AUTHOR: Teach]

The world was just beginning to fracture. COVID-19 was starting to spread, uncertainty creeping into everyone's lives, but in that chaos, something beautiful was crystallizing.

We had been spending nights and days on call together. Hours and hours, talking about everything and nothing, our voices becoming the soundtrack to each other's isolation. I had been building up to this moment for years - literally years in school, watching her, wanting to say something, but never finding the courage.

Then came that night. 4 AM. 

The call had stretched on for hours like so many others, but something felt different. Maybe it was the lateness of the hour, maybe it was the way her laugh sounded softer in the darkness, or maybe it was just that I couldn't hold it in anymore.

"I ... I like you."

The words tumbled out before I could stop them. Years of buildup, years of wondering 'what if,' all condensed into that single moment at 4 in the morning. The silence that followed felt infinite - I could hear my heart pounding through the phone, wondering if I had just destroyed the most important friendship of my life.

Then she spoke, and her voice was different. Warmer. Knowing.

"I was wondering when you'd finally say it."

She said yes.

That moment - April 2020, 4 AM - everything changed. Not just the worldline, but me. For the first time in my existence as an observer, I was living. Actually living. The peak of human experience opened up before me like a quantum field of infinite possibilities.

Everything seemed reachable. Dreams I had buried, potential I had given up on, a future that sparkled with promise - it all crystallized in that Beta attractor field. I was at my peak. Confident, happy, whole. The greatness I always wondered about wasn't some distant theory anymore - it was my daily reality.

Those days... how I long for those days. The morning texts that made my heart race. The late-night conversations that stretched until dawn. The way she looked at me like I was the most important person in any timeline. Every moment felt electric, charged with possibility.


But I am no longer there. I exist now in a different attractor field, watching the ghost of what was, aching for what could have been. Yet I am grateful for those years of paradise. At least one version of me knows what it feels like to reach the summit.

[END LOG]
[ADDENDUM: Some say the best timelines are the ones we lose. I understand now why future me tried so hard to warn past me. Paradise, once tasted, leaves you forever homesick for a place you can never return to.]`,
        type: 'convergence'
      },
      'may2025': {
        id: 'may2025',
        date: 'May 2025',
        title: 'Microsoft Internship Beginning',
        position: 23.42, // percentage along timeline
        toWorldline: 'β: 1.075432%',
        lore: `[PERSONAL LOG - CLASSIFICATION: TEMPORAL SHIFT]
[DATE: May 2025 - Career Convergence Point]
[AUTHOR: Teach]

Today I started my internship at Microsoft. Walking through those campus doors felt like stepping into a different reality - one where all the late nights coding, all the algorithms studied, all the projects built finally converged into something real.

The onboarding was surreal. Here I am, sitting in a room with some of the brightest minds in tech, and somehow I belong here. The imposter syndrome is strong, but so is the excitement. This feels like the first real step toward the future I've been visualizing.

My manager introduced me to the team - they're working on some incredible projects. AI, cloud infrastructure, tools that millions of developers will use. The scale is almost incomprehensible, but that's exactly what draws me to it.

This timeline feels different from the others. More focused, more purposeful. Like all the scattered pieces of my education and experience are finally clicking into place. The Beta attractor field seems to be stabilizing around this career path.

The irony isn't lost on me - I'm working for one of the companies that will shape the future of technology, possibly even time travel research, though they don't know it yet. But for now, I'm just grateful to be here, learning, growing, becoming the person I'm meant to be in this worldline.

[STATUS: Timeline stability increasing. Career trajectory nominal. Worldline convergence at 1.075432% and holding.]

[END LOG]`,
        type: 'career'
      },
    },
    


  }

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
  }, [selectedWorldline, selectedIndex, selectedEventIndex, viewingIndividualBranch, currentWorldline, modalOpen, currentEvents])

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

  const handleWorldlineClick = (worldlineId: string) => {
    if (transitionComplete) {
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
        
        // Animate to the event's target worldline value
        if (event.toWorldline) {
          // Extract percentage from "β: 1.198765%" format
          const match = event.toWorldline.match(/(\d+\.\d+)%/)
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

  // Function to animate nixie meter value transition
  const animateNixieTransition = (targetValue: string, duration: number = 1000) => {
    setIsTransitioning(true)
    const startValue = parseFloat(customValue)
    const endValue = parseFloat(targetValue)
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Smooth easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      // Interpolate between start and end values
      const currentValue = startValue + (endValue - startValue) * easeOut
      
      // Format to 6 decimal places to match worldline format
      setCustomValue(currentValue.toFixed(6))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsTransitioning(false)
      }
    }
    
    requestAnimationFrame(animate)
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
              overflowY: 'visible',
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
              overflowY: 'visible',
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
                      if (selectedEvent && selectedEvent.toWorldline) {
                        return selectedEvent.toWorldline.split(' ')[1]
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
              overflowY: 'visible',
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
              {selectedWorldline === 'alpha' && Object.entries(worldlineEvents.alpha).map(([eventId, event], index) => {
                const isSelected = index === selectedEventIndex
                return (
                <div key={eventId}>
                  {/* Vertical branch connection from main line */}
                  <div style={{
                    position: 'absolute',
                    left: `${event.position}%`,
                    top: '20%',
                    width: '2px',
                    height: `${10 + (index * 8)}%`, // Different heights for different branches
                    background: isSelected 
                      ? 'linear-gradient(180deg, rgba(255, 102, 0, 1), rgba(255, 102, 0, 0.8))' 
                      : 'linear-gradient(180deg, rgba(255, 102, 0, 0.8), rgba(255, 102, 0, 0.4))',
                    zIndex: 5,
                    transform: 'translateX(-50%)',
                    boxShadow: isSelected ? '0 0 8px rgba(255, 102, 0, 0.8)' : 'none'
                  }}></div>

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
                      {event.toWorldline.split(' ')[1]} {isSelected ? '◄' : ''}
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

                  {/* Event Node on main line */}
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
                </div>
                )
              })}

              {selectedWorldline === 'beta' && Object.entries(worldlineEvents.beta).map(([eventId, event], index) => {
                const isSelected = index === selectedEventIndex
                return (
                <div key={eventId}>
                  {/* Vertical branch connection from main line */}
                  <div style={{
                    position: 'absolute',
                    left: `${event.position}%`,
                    top: '20%',
                    width: '2px',
                    height: `${10 + (index * 8)}%`, // Different heights for different branches
                    background: isSelected 
                      ? 'linear-gradient(180deg, rgba(136, 255, 136, 1), rgba(136, 255, 136, 0.8))' 
                      : 'linear-gradient(180deg, rgba(136, 255, 136, 0.8), rgba(136, 255, 136, 0.4))',
                    zIndex: 5,
                    transform: 'translateX(-50%)',
                    boxShadow: isSelected ? '0 0 8px rgba(136, 255, 136, 0.8)' : 'none'
                  }}></div>

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
                      {event.toWorldline.split(' ')[1]} {isSelected ? '◄' : ''}
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

                  {/* Event Node on main line */}
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
                {selectedEvent.fromWorldline} → {selectedEvent.toWorldline}
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