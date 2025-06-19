import React, { useState, useEffect } from 'react';
import { worldlineAPI, eventAPI, type Worldline, type WorldlineEvent } from './api.ts';
import './admin.css';

interface DataManagerProps {
  onClose?: () => void;
}

const DataManager: React.FC<DataManagerProps> = React.memo(({ onClose }) => {
  const [worldlines, setWorldlines] = useState<Worldline[]>([]);
  const [events, setEvents] = useState<WorldlineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'worldlines' | 'events'>('worldlines');

  // Form states
  const [newWorldline, setNewWorldline] = useState({
    id: '', name: '', percentage: 0, color: 'rgba(255, 255, 255, 0.8)'
  });
  const [newEvent, setNewEvent] = useState({
    id: '', date: '', title: '', position: 0, scope: 'alpha', type: '', lore: ''
  });

  // Edit states
  const [editingWorldline, setEditingWorldline] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [editWorldlineData, setEditWorldlineData] = useState<Partial<Worldline>>({});
  const [editEventData, setEditEventData] = useState<Partial<WorldlineEvent>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [worldlinesData, eventsData] = await Promise.all([
        worldlineAPI.getAll(),
        eventAPI.getAll()
      ]);
      setWorldlines(worldlinesData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorldline = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await worldlineAPI.create(newWorldline);
      setNewWorldline({ id: '', name: '', percentage: 0, color: 'rgba(255, 255, 255, 0.8)' });
      loadData();
    } catch (error) {
      console.error('Failed to add worldline:', error);
    }
  };

  const handleDeleteWorldline = async (id: string) => {
    if (window.confirm(`Delete worldline ${id}?`)) {
      try {
        await worldlineAPI.delete(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete worldline:', error);
      }
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await eventAPI.create(newEvent);
      setNewEvent({ id: '', date: '', title: '', position: 0, scope: 'alpha', type: '', lore: '' });
      loadData();
    } catch (error) {
      console.error('Failed to add event:', error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm(`Delete event ${id}?`)) {
      try {
        await eventAPI.delete(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  };

  // Edit worldline functions
  const startEditingWorldline = (worldline: Worldline) => {
    setEditingWorldline(worldline.id);
    setEditWorldlineData({
      name: worldline.name,
      percentage: worldline.percentage,
      color: worldline.color
    });
  };

  const cancelEditingWorldline = () => {
    setEditingWorldline(null);
    setEditWorldlineData({});
  };

  const saveWorldlineEdit = async (id: string) => {
    try {
      await worldlineAPI.update(id, editWorldlineData);
      setEditingWorldline(null);
      setEditWorldlineData({});
      loadData();
    } catch (error) {
      console.error('Failed to update worldline:', error);
    }
  };

  // Edit event functions
  const startEditingEvent = (event: WorldlineEvent) => {
    setEditingEvent(event.id);
    setEditEventData({
      date: event.date,
      title: event.title,
      position: event.position,
      from_worldline: event.from_worldline,
      to_worldline: event.to_worldline,
      lore: event.lore,
      type: event.type,
      scope: event.scope
    });
  };

  const cancelEditingEvent = () => {
    setEditingEvent(null);
    setEditEventData({});
  };

  const saveEventEdit = async (id: string) => {
    try {
      await eventAPI.update(id, editEventData);
      setEditingEvent(null);
      setEditEventData({});
      loadData();
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', color: 'white' }}>Loading...</div>;
  }

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#000', 
      color: 'white', 
      minHeight: '100vh',
      maxHeight: '100vh',
      overflow: 'auto',
      fontFamily: 'monospace'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: 'rgba(255, 170, 68, 0.8)', margin: 0 }}>Timeline Data Manager</h1>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'rgba(255, 68, 68, 0.3)',
              border: '1px solid rgba(255, 68, 68, 0.5)',
              color: 'white',
              fontFamily: 'monospace',
              cursor: 'pointer'
            }}
          >
            Close Manager
          </button>
        )}
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('worldlines')}
          style={{ 
            marginRight: '10px', 
            padding: '10px', 
            backgroundColor: activeTab === 'worldlines' ? 'rgba(255, 170, 68, 0.3)' : 'transparent',
            border: '1px solid rgba(255, 170, 68, 0.5)',
            color: 'white'
          }}
        >
          Worldlines
        </button>
        <button 
          onClick={() => setActiveTab('events')}
          style={{ 
            padding: '10px', 
            backgroundColor: activeTab === 'events' ? 'rgba(255, 170, 68, 0.3)' : 'transparent',
            border: '1px solid rgba(255, 170, 68, 0.5)',
            color: 'white'
          }}
        >
          Events
        </button>
      </div>

      {activeTab === 'worldlines' && (
        <div>
          <h2>Worldlines</h2>
          
          {/* Add Worldline Form */}
          <form onSubmit={handleAddWorldline} style={{ marginBottom: '20px', padding: '15px', border: '1px solid rgba(255, 170, 68, 0.3)' }}>
            <h3>Add New Worldline</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <input
                type="text"
                placeholder="ID (e.g., epsilon)"
                value={newWorldline.id}
                onChange={(e) => setNewWorldline({...newWorldline, id: e.target.value})}
                style={{ padding: '5px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                required
              />
              <input
                type="text"
                placeholder="Name (e.g., ε)"
                value={newWorldline.name}
                onChange={(e) => setNewWorldline({...newWorldline, name: e.target.value})}
                style={{ padding: '5px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                required
              />
              <input
                type="number"
                step="0.000001"
                placeholder="Percentage"
                value={newWorldline.percentage}
                onChange={(e) => setNewWorldline({...newWorldline, percentage: parseFloat(e.target.value)})}
                style={{ padding: '5px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                required
              />
              <input
                type="text"
                placeholder="Color (rgba)"
                value={newWorldline.color}
                onChange={(e) => setNewWorldline({...newWorldline, color: e.target.value})}
                style={{ padding: '5px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                required
              />
            </div>
            <button type="submit" style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(136, 255, 136, 0.3)', border: '1px solid rgba(136, 255, 136, 0.5)', color: 'white' }}>
              Add Worldline
            </button>
          </form>

          {/* Worldlines List */}
          <h3>Worldlines ({worldlines.length} items) - Scroll to see all</h3>
          <div className="admin-scroll" style={{ 
            maxHeight: '60vh', 
            overflow: 'auto', 
            border: '1px solid rgba(255, 170, 68, 0.3)', 
            padding: '10px'
          }}>
            {worldlines.map(wl => (
              <div key={wl.id} style={{ 
                padding: '10px', 
                margin: '10px 0', 
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                {editingWorldline === wl.id ? (
                  // Edit mode
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr auto auto',
                    gap: '10px',
                    alignItems: 'center'
                  }}>
                    <span><strong>{wl.id}</strong></span>
                    <input
                      type="text"
                      value={editWorldlineData.name || ''}
                      onChange={(e) => setEditWorldlineData({...editWorldlineData, name: e.target.value})}
                      style={{ padding: '3px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                    />
                    <input
                      type="number"
                      step="0.000001"
                      value={editWorldlineData.percentage || 0}
                      onChange={(e) => setEditWorldlineData({...editWorldlineData, percentage: parseFloat(e.target.value)})}
                      style={{ padding: '3px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                    />
                    <input
                      type="text"
                      value={editWorldlineData.color || ''}
                      onChange={(e) => setEditWorldlineData({...editWorldlineData, color: e.target.value})}
                      style={{ padding: '3px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                    />
                    <button 
                      onClick={() => saveWorldlineEdit(wl.id)}
                      style={{ padding: '5px 10px', backgroundColor: 'rgba(136, 255, 136, 0.3)', border: '1px solid rgba(136, 255, 136, 0.5)', color: 'white' }}
                    >
                      Save
                    </button>
                    <button 
                      onClick={cancelEditingWorldline}
                      style={{ padding: '5px 10px', backgroundColor: 'rgba(255, 255, 255, 0.3)', border: '1px solid rgba(255, 255, 255, 0.5)', color: 'white' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  // View mode
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr auto auto',
                    gap: '10px',
                    alignItems: 'center'
                  }}>
                    <span><strong>{wl.id}</strong></span>
                    <span>{wl.name}</span>
                    <span>{wl.percentage.toFixed(6)}%</span>
                    <span style={{ color: wl.color }}>{wl.color}</span>
                    <button 
                      onClick={() => startEditingWorldline(wl)}
                      style={{ padding: '5px 10px', backgroundColor: 'rgba(255, 170, 68, 0.3)', border: '1px solid rgba(255, 170, 68, 0.5)', color: 'white' }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteWorldline(wl.id)}
                      style={{ padding: '5px 10px', backgroundColor: 'rgba(255, 68, 68, 0.3)', border: '1px solid rgba(255, 68, 68, 0.5)', color: 'white' }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div>
          <h2>Events</h2>
          
          {/* Add Event Form */}
          <form onSubmit={handleAddEvent} style={{ marginBottom: '20px', padding: '15px', border: '1px solid rgba(255, 170, 68, 0.3)' }}>
            <h3>Add New Event</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="ID"
                value={newEvent.id}
                onChange={(e) => setNewEvent({...newEvent, id: e.target.value})}
                style={{ padding: '5px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                required
              />
              <input
                type="text"
                placeholder="Date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                style={{ padding: '5px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                required
              />
              <input
                type="text"
                placeholder="Title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                style={{ padding: '5px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
              <input
                type="number"
                step="0.01"
                placeholder="Position %"
                value={newEvent.position}
                onChange={(e) => setNewEvent({...newEvent, position: parseFloat(e.target.value)})}
                style={{ padding: '5px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                required
              />
              <select
                value={newEvent.scope}
                onChange={(e) => setNewEvent({...newEvent, scope: e.target.value})}
                style={{ padding: '5px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                required
              >
                <option value="alpha">Alpha</option>
                <option value="beta">Beta</option>
                <option value="gamma">Gamma</option>
                <option value="delta">Delta</option>
                <option value="crossAttractor">Cross-Attractor</option>
              </select>
              <input
                type="text"
                placeholder="Type"
                value={newEvent.type}
                onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                style={{ padding: '5px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
              />
            </div>
            <textarea
              placeholder="Lore (optional)"
              value={newEvent.lore}
              onChange={(e) => setNewEvent({...newEvent, lore: e.target.value})}
              style={{ width: '100%', height: '100px', padding: '5px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
            />
            <button type="submit" style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(136, 255, 136, 0.3)', border: '1px solid rgba(136, 255, 136, 0.5)', color: 'white' }}>
              Add Event
            </button>
          </form>

          {/* Events List */}
          <h3>Events ({events.length} items) - Scroll to see all</h3>
          <div className="admin-scroll" style={{ 
            maxHeight: '60vh', 
            overflow: 'auto', 
            border: '1px solid rgba(255, 170, 68, 0.3)', 
            padding: '10px'
          }}>
            {events.map(event => (
              <div key={event.id} style={{ 
                padding: '10px', 
                margin: '10px 0', 
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                {editingEvent === event.id ? (
                  // Edit mode
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto auto', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                      <span><strong>{event.id}</strong></span>
                      <input
                        type="text"
                        value={editEventData.date || ''}
                        onChange={(e) => setEditEventData({...editEventData, date: e.target.value})}
                        style={{ padding: '3px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                      />
                      <input
                        type="text"
                        value={editEventData.title || ''}
                        onChange={(e) => setEditEventData({...editEventData, title: e.target.value})}
                        style={{ padding: '3px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                      />
                      <select
                        value={editEventData.scope || 'alpha'}
                        onChange={(e) => setEditEventData({...editEventData, scope: e.target.value})}
                        style={{ padding: '3px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                      >
                        <option value="alpha">Alpha</option>
                        <option value="beta">Beta</option>
                        <option value="gamma">Gamma</option>
                        <option value="delta">Delta</option>
                        <option value="crossAttractor">Cross-Attractor</option>
                      </select>
                      <button 
                        onClick={() => saveEventEdit(event.id)}
                        style={{ padding: '5px 10px', backgroundColor: 'rgba(136, 255, 136, 0.3)', border: '1px solid rgba(136, 255, 136, 0.5)', color: 'white' }}
                      >
                        Save
                      </button>
                      <button 
                        onClick={cancelEditingEvent}
                        style={{ padding: '5px 10px', backgroundColor: 'rgba(255, 255, 255, 0.3)', border: '1px solid rgba(255, 255, 255, 0.5)', color: 'white' }}
                      >
                        Cancel
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Position %"
                        value={editEventData.position || 0}
                        onChange={(e) => setEditEventData({...editEventData, position: parseFloat(e.target.value)})}
                        style={{ padding: '3px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                      />
                      <input
                        type="text"
                        placeholder="Type"
                        value={editEventData.type || ''}
                        onChange={(e) => setEditEventData({...editEventData, type: e.target.value})}
                        style={{ padding: '3px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                      />
                      <input
                        type="text"
                        placeholder="From Worldline"
                        value={editEventData.from_worldline || ''}
                        onChange={(e) => setEditEventData({...editEventData, from_worldline: e.target.value})}
                        style={{ padding: '3px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="To Worldline"
                      value={editEventData.to_worldline || ''}
                      onChange={(e) => setEditEventData({...editEventData, to_worldline: e.target.value})}
                      style={{ padding: '3px', backgroundColor: '#333', color: 'white', border: '1px solid #555', width: '100%', marginBottom: '10px' }}
                    />
                    <textarea
                      placeholder="Lore"
                      value={editEventData.lore || ''}
                      onChange={(e) => setEditEventData({...editEventData, lore: e.target.value})}
                      style={{ width: '100%', height: '200px', padding: '5px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                    />
                  </div>
                ) : (
                  // View mode
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto auto', gap: '10px', alignItems: 'center' }}>
                      <span><strong>{event.id}</strong></span>
                      <span>{event.date}</span>
                      <span>{event.title}</span>
                      <span>Scope: {event.scope}</span>
                      <button 
                        onClick={() => startEditingEvent(event)}
                        style={{ padding: '5px 10px', backgroundColor: 'rgba(255, 170, 68, 0.3)', border: '1px solid rgba(255, 170, 68, 0.5)', color: 'white' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteEvent(event.id)}
                        style={{ padding: '5px 10px', backgroundColor: 'rgba(255, 68, 68, 0.3)', border: '1px solid rgba(255, 68, 68, 0.5)', color: 'white' }}
                      >
                        Delete
                      </button>
                    </div>
                    {event.lore && (
                      <div style={{ marginTop: '10px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {event.lore.substring(0, 200)}...
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default DataManager;