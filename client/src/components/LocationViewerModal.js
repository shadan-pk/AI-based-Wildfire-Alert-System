import React, { useRef, useState, useEffect } from 'react';
import Map from './Map';

const LocationViewerModal = ({ isOpen, onClose, userLocation }) => {
  const mapRef = useRef(null);

  // Move hooks before any conditional returns
  useEffect(() => {
    if (isOpen && mapRef.current && userLocation?.longitude && userLocation?.latitude) {
      // Reset the map view to center on the user location
      mapRef.current.resetView([userLocation.longitude, userLocation.latitude], 14);
    }
  }, [isOpen, userLocation]);

  // Add a default center if there's no user location
  const center = userLocation?.longitude && userLocation?.latitude
    ? [userLocation.longitude, userLocation.latitude]
    : [0, 0];

  // Render nothing if modal is not open
  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>User Location</h3>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>
        <div style={styles.modalBody}>
          {userLocation?.longitude && userLocation?.latitude ? (
            <div style={styles.locationInfo}>
              <p style={styles.locationText}>
                <strong>Name:</strong> {userLocation.name || 'Unknown'}
              </p>
              <p style={styles.locationText}>
                <strong>Coordinates:</strong> {userLocation.latitude}, {userLocation.longitude}
              </p>
              <p style={styles.locationText}>
                <strong>Last Updated:</strong> {userLocation.lastUpdated || 'Unknown'}
              </p>
              <div style={styles.mapContainer}>
                <Map 
                  ref={mapRef}
                  center={center}
                  zoom={14}
                />
              </div>
            </div>
          ) : (
            <p style={styles.noLocation}>No location data available for this user.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    width: '80%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  },
  modalHeader: {
    padding: '15px 20px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#999',
  },
  modalBody: {
    padding: '20px',
  },
  locationInfo: {
    marginBottom: '15px',
  },
  locationText: {
    margin: '5px 0',
    fontSize: '14px',
    color: '#555',
  },
  mapContainer: {
    height: '400px',
    marginTop: '15px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  noLocation: {
    textAlign: 'center',
    color: '#666',
    padding: '20px',
  },
};

export default LocationViewerModal;