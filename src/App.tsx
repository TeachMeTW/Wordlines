import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { Model } from './Model.tsx'

function App() {
  const [displayMode, setDisplayMode] = useState<'clock' | 'custom' | 'counter'>('clock')
  const [customValue, setCustomValue] = useState('12345678')

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0a0a0a' }}>
      {/* Control Panel */}
      <div style={{ 
        position: 'absolute', 
        top: '20px', 
        left: '20px', 
        zIndex: 100,
        color: 'white',
        fontFamily: 'monospace',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '15px',
        borderRadius: '8px',
        minWidth: '250px'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Nixie Tube Display</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Display Mode:</label>
          <select 
            value={displayMode} 
            onChange={(e) => setDisplayMode(e.target.value as any)}
            style={{ 
              width: '100%', 
              padding: '5px', 
              backgroundColor: '#333', 
              color: 'white', 
              border: '1px solid #555',
              borderRadius: '4px'
            }}
          >
            <option value="clock">Clock (HH.MM.SS)</option>
            <option value="custom">Custom Number</option>
            <option value="counter">Counter</option>
          </select>
        </div>

        {displayMode === 'custom' && (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Custom Value:</label>
            <input
              type="text"
              value={customValue}
              onChange={(e) => {
                const value = e.target.value
                // Allow digits and one dot
                const cleaned = value.replace(/[^\d.]/g, '')
                
                // Handle dot formatting: X.XXXXXX or XXXXXXXX
                if (cleaned.includes('.')) {
                  const parts = cleaned.split('.')
                  const beforeDot = parts[0].slice(-1) // Max 1 digit before dot
                  const afterDot = parts[1] ? parts[1].slice(0, 6) : '' // Max 6 digits after dot
                  setCustomValue(beforeDot + (afterDot || parts[1] !== undefined ? '.' + afterDot : ''))
                } else {
                  // Regular number, max 8 digits
                  setCustomValue(cleaned.slice(0, 8))
                }
              }}
              placeholder="12345678 or 1.234567"
              style={{ 
                width: '100%', 
                padding: '5px', 
                backgroundColor: '#333', 
                color: 'white', 
                border: '1px solid #555',
                borderRadius: '4px'
              }}
            />
            <div style={{ fontSize: '10px', color: '#888', marginTop: '3px' }}>
              Format: XXXXXXXX or X.XXXXXX
            </div>
          </div>
        )}

        <div style={{ fontSize: '12px', color: '#aaa', marginTop: '10px' }}>
          <div>• <strong>Clock Mode:</strong> Shows current time</div>
          <div>• <strong>Custom Mode:</strong> Shows your number</div>
          <div>• <strong>Counter Mode:</strong> Counts up automatically</div>
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.1} />
        <directionalLight position={[10, 10, 5]} intensity={0.5} />
        <pointLight position={[0, 0, 3]} intensity={1} color="orange" />
        
        <Model 
          displayMode={displayMode}
          customValue={displayMode === 'custom' ? customValue : undefined}
          showDots={displayMode === 'clock' ? [true, true] : [false, false]}
        />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
      </Canvas>
    </div>
  )
}

export default App