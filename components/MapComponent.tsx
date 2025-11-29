'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface Location {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  coordinates: [number, number]; // [longitude, latitude]
  status: 'available' | 'on_job' | 'offline' | 'break';
  battery?: number;
  lastUpdated: string;
}

interface WorkOrder {
  _id: string;
  title: string;
  location: {
    coordinates: [number, number];
    address: string;
  };
  status: string;
  priority: string;
}

interface MapComponentProps {
  locations: Location[];
  workOrders: WorkOrder[];
  onMarkerClick?: (location: Location) => void;
  onWorkOrderClick?: (workOrder: WorkOrder) => void;
  center?: [number, number];
  zoom?: number;
}

export default function MapComponent({
  locations,
  workOrders,
  onMarkerClick,
  onWorkOrderClick,
  center = [42.3601, -71.0589],
  zoom = 12
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map
    const map = L.map(mapContainerRef.current).setView(center, zoom);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Create custom icons for different statuses
    const createWorkerIcon = (status: string) => {
      const colors = {
        available: '#10b981', // green
        on_job: '#3b82f6', // blue
        offline: '#6b7280', // gray
        break: '#f59e0b' // orange
      };

      return L.divIcon({
        html: `
          <div style="
            background-color: ${colors[status as keyof typeof colors]};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
          ">
            🔧
          </div>
        `,
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
    };

    const createWorkOrderIcon = (priority: string) => {
      const colors = {
        critical: '#ef4444', // red
        high: '#f97316', // orange
        medium: '#eab308', // yellow
        low: '#22c55e' // green
      };

      return L.divIcon({
        html: `
          <div style="
            background-color: ${colors[priority as keyof typeof colors]};
            width: 28px;
            height: 28px;
            border-radius: 4px;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
          ">
            📋
          </div>
        `,
        className: 'custom-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
    };

    // Add worker location markers
    locations.forEach(location => {
      const [lng, lat] = location.coordinates;
      const icon = createWorkerIcon(location.status);

      const marker = L.marker([lat, lng], { icon })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div style="font-family: system-ui; min-width: 200px; position: relative;">
            <button 
              onclick="this.closest('.leaflet-popup').style.display='none'" 
              style="position: absolute; top: -8px; right: -8px; background: white; border: 1px solid #ddd; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 16px; line-height: 1; padding: 0; display: flex; align-items: center; justify-content: center;"
            >×</button>
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">
              ${location.user.name}
            </div>
            <div style="font-size: 14px; color: #666; margin-bottom: 4px;">
              Status: <span style="font-weight: 600; text-transform: capitalize;">${location.status.replace('_', ' ')}</span>
            </div>
            <div style="font-size: 14px; color: #666; margin-bottom: 4px;">
              ${location.user.email}
            </div>
            ${location.battery ? `
              <div style="font-size: 14px; color: #666;">
                Battery: ${location.battery}%
              </div>
            ` : ''}
            <div style="font-size: 12px; color: #999; margin-top: 8px;">
              Last updated: ${new Date(location.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        `);

      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(location));
      }

      markersRef.current.push(marker);
    });

    // Add work order markers
    workOrders.forEach(order => {
      const [lng, lat] = order.location.coordinates;
      const icon = createWorkOrderIcon(order.priority);

      const marker = L.marker([lat, lng], { icon })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div style="font-family: system-ui; min-width: 200px; position: relative;">
            <button 
              onclick="this.closest('.leaflet-popup').style.display='none'" 
              style="position: absolute; top: -8px; right: -8px; background: white; border: 1px solid #ddd; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 16px; line-height: 1; padding: 0; display: flex; align-items: center; justify-content: center;"
            >×</button>
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">
              ${order.title}
            </div>
            <div style="font-size: 14px; color: #666; margin-bottom: 4px;">
              Priority: <span style="font-weight: 600; text-transform: capitalize;">${order.priority}</span>
            </div>
            <div style="font-size: 14px; color: #666; margin-bottom: 4px;">
              Status: <span style="font-weight: 600; text-transform: capitalize;">${order.status.replace('_', ' ')}</span>
            </div>
            <div style="font-size: 12px; color: #999; margin-top: 8px;">
              ${order.location.address}
            </div>
          </div>
        `);

      if (onWorkOrderClick) {
        marker.on('click', () => onWorkOrderClick(order));
      }

      markersRef.current.push(marker);
    });

    // Fit map to show all markers if there are any
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }

  }, [locations, workOrders, onMarkerClick, onWorkOrderClick]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        borderRadius: '8px',
        overflow: 'hidden'
      }} 
    />
  );
}