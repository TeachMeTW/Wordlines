// API client for communicating with the SQLite backend

const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3001/api';

export interface Worldline {
  id: string;
  name: string;
  percentage: number;
  color: string;
  branches?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface WorldlineEvent {
  id: string;
  date: string;
  title: string;
  position: number;
  from_worldline?: string;
  to_worldline?: string;
  lore?: string;
  type?: string;
  scope: string;
  created_at?: string;
  updated_at?: string;
}

export interface TimelineConfig {
  id?: number;
  start_year: number;
  end_year: number;
  created_at?: string;
  updated_at?: string;
}

// Temporal field API functions (obscured naming)
export const worldlineAPI = {
  getAll: async (): Promise<Worldline[]> => {
    const response = await fetch(`${API_BASE}/temporal-fields`);
    if (!response.ok) throw new Error('Failed to fetch temporal fields');
    return response.json();
  },

  getById: async (id: string): Promise<Worldline> => {
    const response = await fetch(`${API_BASE}/temporal-fields/${id}`);
    if (!response.ok) throw new Error('Failed to fetch temporal field');
    return response.json();
  },

  create: async (worldline: Omit<Worldline, 'created_at' | 'updated_at'>): Promise<Worldline> => {
    const response = await fetch(`${API_BASE}/temporal-fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(worldline)
    });
    if (!response.ok) throw new Error('Failed to create temporal field');
    return response.json();
  },

  update: async (id: string, updates: Partial<Worldline>): Promise<Worldline> => {
    const response = await fetch(`${API_BASE}/temporal-fields/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update temporal field');
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/temporal-fields/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete temporal field');
  }
};

// Temporal event API functions (obscured naming)
export const eventAPI = {
  getAll: async (scope?: string): Promise<WorldlineEvent[]> => {
    const url = scope ? `${API_BASE}/temporal-events?scope=${scope}` : `${API_BASE}/temporal-events`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch temporal events');
    return response.json();
  },

  getById: async (id: string): Promise<WorldlineEvent> => {
    const response = await fetch(`${API_BASE}/temporal-events/${id}`);
    if (!response.ok) throw new Error('Failed to fetch temporal event');
    return response.json();
  },

  create: async (event: Omit<WorldlineEvent, 'created_at' | 'updated_at'>): Promise<WorldlineEvent> => {
    const response = await fetch(`${API_BASE}/temporal-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    if (!response.ok) throw new Error('Failed to create temporal event');
    return response.json();
  },

  update: async (id: string, updates: Partial<WorldlineEvent>): Promise<WorldlineEvent> => {
    const response = await fetch(`${API_BASE}/temporal-events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update temporal event');
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/temporal-events/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete temporal event');
  }
};

// Temporal config API functions (obscured naming)
export const timelineAPI = {
  getConfig: async (): Promise<TimelineConfig | null> => {
    const response = await fetch(`${API_BASE}/temporal-config`);
    if (!response.ok) throw new Error('Failed to fetch temporal config');
    const data = await response.json();
    return data || null;
  }
};

// System status check (obscured naming)
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/status`);
    return response.ok;
  } catch {
    return false;
  }
};