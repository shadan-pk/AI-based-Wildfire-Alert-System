import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const Map = forwardRef(({ center, zoom, onClick }, ref) => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useImperativeHandle(ref, () => ({
    resetView(newCenter, newZoom) {
      if (map.current) {
        map.current.setCenter(newCenter);
        map.current.setZoom(newZoom);
      }
    }
  }));

  useEffect(() => {
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center,
        zoom,
      });

      map.current.on('click', (e) => {
        if (onClick) onClick(e.lngLat); // Pass longitude and latitude
      });
    }
  }, [center, zoom, onClick]);

  return <div ref={mapContainer} style={{ width: '100%', height: '600px' }} />;
});

export default Map;