import React, { useState, Suspense, useEffect, useCallback } from 'react'
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
        toWorldline: 'β: 1.130205%',
        lore: `A critical convergence point where the Alpha attractor field intersects with the Beta attractor field. This represents the moment when D-Mail technology reaches a threshold that fundamentally alters the worldline's trajectory.

In this transition, the Lab's experiments with the PhoneWave (name subject to change) create enough temporal disturbance to shift from the Alpha worldline's deterministic path toward SERN's dystopian future into the Beta attractor field.

This convergence is characterized by:
• Temporal displacement of approximately 1.130205% divergence
• Activation of the Butterfly Effect through micro-adjustments
• The first successful D-Mail transmission that changes past events
• Beginning of the Beta worldline's branching possibilities

The transition marks humanity's first step away from the predetermined Alpha timeline where SERN achieves time travel dominance and establishes a dystopian regime by 2036.`,
        type: 'convergence'
      }
    },
    
    // Alpha attractor field events (show in alpha branch view only)
    alpha: {
      'july2010': {
        id: 'july2010',
        date: 'July 28, 2010',
        title: 'First D-Mail Transmission',
        position: 8.67, // July 2010
        fromWorldline: 'α: 0.000000%',
        toWorldline: 'α: 0.000089%',
        lore: `The first successful D-Mail transmission marks the beginning of temporal manipulation experiments at the Future Gadget Laboratory. This event represents the initial crack in the fabric of causality within the Alpha attractor field.

Key aspects of this event:
• First backwards time transmission using the PhoneWave
• Banana gelification anomaly discovered
• SERN's attention begins to focus on the lab's activities
• John Titor's warnings about time travel experiments become relevant

This micro-change creates the first observable shift in the Alpha attractor field, though still within the same worldline cluster. The transmission of "The chicken is tender" sets in motion the chain of events that will eventually lead to major worldline shifts.`,
        type: 'transmission'
      },
      'august2010': {
        id: 'august2010',
        date: 'August 13, 2010',
        title: 'SERN Roundtable Conference',
        position: 8.83,
        fromWorldline: 'α: 0.000000%',
        toWorldline: 'α: 0.000238%',
        lore: `SERN's Committee of 300 holds an emergency conference regarding anomalous electromagnetic readings detected from Akihabara. This marks the beginning of SERN's active surveillance of the Future Gadget Laboratory.

Consequences of this event:
• Activation of SERN's Echelon surveillance network
• Deployment of Rounders to monitor the lab
• Beginning of the countdown to Operation Skuld
• First mention of the IBN 5100 in SERN communications

This event represents the Alpha worldline's inexorable march toward SERN's dystopian future, where the organization will eventually capture and weaponize time travel technology.`,
        type: 'surveillance'
      }
    },
    
    // Beta attractor field events (show in beta branch view only)
    beta: {
      'august2025': {
        id: 'august2025',
        date: 'August 2025',
        title: 'Time Leap Machine Activation',
        position: 23.5,
        fromWorldline: 'β: 1.130205%',
        toWorldline: 'β: 1.198765%',
        lore: `The successful development and first use of the Time Leap Machine represents a quantum leap in temporal mechanics technology within the Beta attractor field. Unlike D-Mail's simple text transmission, the Time Leap Machine can transfer human consciousness backwards through time.

This technology breakthrough:
• Enables consciousness-only time travel up to 48 hours into the past
• Requires specialized headgear and microwave-based particle acceleration
• Creates minimal worldline drift compared to physical time travel
• Becomes the key to Reading Steiner manifestation

The activation of this device at worldline 1.198765% becomes the active reference point for future temporal operations, marking the establishment of the Beta attractor field as the primary operational timeline.`,
        type: 'technology'
      },
      'december2025': {
        id: 'december2025',
        date: 'December 2025',
        title: 'Steins Gate Protocol Established',
        position: 23.83,
        fromWorldline: 'β: 1.130205%',
        toWorldline: 'β: 1.234567%',
        lore: `The establishment of the Steins Gate Protocol represents the Beta attractor field's attempt to create a stable temporal framework for controlled worldline navigation.

Protocol specifications:
• Standardized procedures for Time Leap operations
• Safety protocols to prevent paradox formation
• Establishment of the 48-hour operational window
• Creation of memory retention techniques for Reading Steiner

This protocol becomes the foundation for all future temporal operations within the Beta attractor field, ensuring that worldline shifts remain controlled and purposeful rather than chaotic.`,
        type: 'protocol'
      }
    },
    
    // Individual worldline events (show in individual branch view only)
    individual: {
      'convergence2036': {
        id: 'convergence2036',
        date: 'July 2036',
        title: 'SERN Dystopia Convergence',
        position: 34,
        lore: `The inevitable convergence point where SERN's time travel research reaches completion, establishing their dystopian control over the timeline. This represents the Alpha attractor field's natural endpoint.`,
        type: 'dystopia'
      },
      'resistance2075': {
        id: 'resistance2075',
        date: 'March 2075',
        title: 'Resistance Formation',
        position: 73,
        lore: `The formation of the anti-SERN resistance movement, led by future versions of the lab members. This marks the beginning of the temporal war that will define the late 21st century.`,
        type: 'resistance'
      }
    }
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
      setZoomLevel(prev => Math.min(5, prev + 0.2))
      return
    } else if (event.key === '-') {
      event.preventDefault()
      setZoomLevel(prev => Math.max(1, prev - 0.2))
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
        setSelectedEventIndex(prev => Math.max(0, prev - 1))
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        const eventCount = currentEvents.length
        setSelectedEventIndex(prev => Math.min(eventCount - 1, prev + 1))
      } else if (event.key === 'Enter') {
        event.preventDefault()
        if (currentEvents.length > 0) {
          // Open modal for selected event instead of going to individual view
          const selectedEventData = currentEvents[selectedEventIndex]
          if (selectedEventData) {
            handleEventClick(selectedEventData[0]) // selectedEventData[0] is the eventId
          }
        }
      }
    } else {
      // In main view
      const worldlineKeys = Object.keys(worldlineData)
      
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelectedIndex(prev => Math.max(0, prev - 1))
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelectedIndex(prev => Math.min(worldlineKeys.length - 1, prev + 1))
      } else if (event.key === 'Enter') {
        event.preventDefault()
        setSelectedWorldline(worldlineKeys[selectedIndex])
      }
    }
  }, [selectedWorldline, selectedIndex, selectedEventIndex, viewingIndividualBranch, currentWorldline, modalOpen, currentEvents])

  // Mouse wheel zoom and horizontal scroll
  const handleWheel = useCallback((event: WheelEvent) => {
    // Shift + wheel = horizontal scroll (let browser handle it)
    if (event.shiftKey) {
      return // Allow default horizontal scrolling
    }
    
    // Vertical wheel = zoom (always, in all views)
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault()
      setZoomLevel(prev => Math.max(1, Math.min(5, prev + (event.deltaY > 0 ? 0.2 : -0.2))))
    }
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
    setSelectedWorldline(worldlineId)
  }

  // Handle event click
  const handleEventClick = (eventId: string) => {
    // Search through all event categories
    let event = null
    for (const category of Object.values(worldlineEvents)) {
      if (category[eventId]) {
        event = category[eventId]
        break
      }
    }
    
    if (event) {
      setSelectedEvent(event)
      setModalOpen(true)
    }
  }

  // Close modal
  const closeModal = () => {
    setModalOpen(false)
    setSelectedEvent(null)
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
              <>Viewing individual worldline | BACKSPACE to return | Drag to scroll or Shift+wheel | Wheel/+- to zoom</>
            ) : selectedWorldline ? (
              <>Viewing {currentWorldline?.name} attractor field branches | ↑↓ to select branch | ENTER to view details | BACKSPACE to return | Drag to scroll | Wheel/+- to zoom</>
            ) : (
              <>↑↓ to navigate | ENTER to select | Drag to scroll | Wheel/+- to zoom | Shift+wheel for horizontal</>
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
            </div>
          </div>
        )}

        {/* Individual Branch View */}
        {viewingIndividualBranch && selectedWorldline && currentWorldline && (
          <div 
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
                {Object.entries(worldlineEvents.individual).map(([eventId, event]) => (
                  <div key={eventId}>
                    {/* Event Node */}
                    <div 
                      style={{
                        position: 'absolute',
                        left: `${event.position}%`,
                        top: `${15 * zoomLevel}px`,
                        width: `${4 * Math.min(zoomLevel, 2)}px`,
                        height: `${4 * Math.min(zoomLevel, 2)}px`,
                        borderRadius: '50%',
                        background: 'rgba(255, 170, 68, 1)',
                        boxShadow: `0 0 ${8 * zoomLevel}px rgba(255, 170, 68, 0.8)`,
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        zIndex: 10,
                        cursor: 'pointer',
                        animation: 'nixiePulse 2.5s infinite',
                        transform: 'translate(-50%, -50%)'
                      }}
                      onClick={() => handleEventClick(eventId)}
                    />
                    
                    {/* Event Label - positioned properly without rotation */}
                    <div 
                      style={{
                        position: 'absolute',
                        left: `${event.position}%`,
                        top: '14%', // Above the main line
                        transform: 'translateX(-50%)',
                        color: 'rgba(255, 102, 0, 0.9)',
                        fontSize: `${9 * Math.min(zoomLevel, 1.5)}px`,
                        fontFamily: 'monospace',
                        textShadow: '0 0 6px rgba(255, 102, 0, 0.6)',
                        whiteSpace: 'nowrap',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        border: '1px solid rgba(255, 102, 0, 0.3)',
                        zIndex: 11,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => handleEventClick(eventId)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 102, 0, 0.2)'
                        e.currentTarget.style.borderColor = 'rgba(255, 102, 0, 0.6)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)'
                        e.currentTarget.style.borderColor = 'rgba(255, 102, 0, 0.3)'
                      }}
                    >
                      {event.date.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Branch View */}
        {selectedWorldline && currentWorldline && !viewingIndividualBranch && (
          <div 
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
          border: '2px solid #333',
          borderRadius: '8px',
          padding: '10px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
      >
      // Camera position: [0.00, 0.15, 0.18]
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
          // Camera position: [-0.01, 0.14, 0.15] App.tsx:143
          // Target position: [-0.00, 0.06, -0.02] App.tsx:144
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