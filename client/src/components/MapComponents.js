// import React from 'react';
// import PropTypes from 'prop-types';

// const MapComponent = ({ 
//   points = [], 
//   initialLat, 
//   initialLon, 
//   handleDeletePoint 
// }) => {
//   // Find the min and max of latitudes and longitudes to calculate the scale
//   const lats = points.map(point => point.lat);
//   const lons = points.map(point => point.lon);
  
//   const minLat = Math.min(...lats, initialLat);
//   const maxLat = Math.max(...lats, initialLat);
//   const minLon = Math.min(...lons, initialLon);
//   const maxLon = Math.max(...lons, initialLon);

//   // Map container dimensions
//   const mapWidth = 600;
//   const mapHeight = 400;

//   // Calculate scaling factors
//   const latRange = maxLat - minLat;
//   const lonRange = maxLon - minLon;

//   // Normalize point positioning function
//   const normalizeCoordinate = (value, min, range, maxDimension) => {
//     return ((value - min) / range) * maxDimension;
//   };

//   return (
//     <div 
//       className="map-container"
//       style={{
//         position: 'relative',
//         width: `${mapWidth}px`,
//         height: `${mapHeight}px`,
//         border: '2px solid #333',
//         backgroundColor: '#f0f0f0',
//         overflow: 'hidden'
//       }}
//     >
//       {/* Base location marker */}
//       <div
//         className="base-point"
//         style={{
//           position: 'absolute',
//           left: `${normalizeCoordinate(initialLon, minLon, lonRange, mapWidth)}px`,
//           top: `${mapHeight - normalizeCoordinate(initialLat, minLat, latRange, mapHeight)}px`,
//           width: '12px',
//           height: '12px',
//           borderRadius: '50%',
//           backgroundColor: 'green',
//           transform: 'translate(-50%, -50%)',
//           zIndex: 10
//         }}
//         title="Base Location"
//       />

//       {/* Render points */}
//       {points.map((point, index) => {
//         const left = normalizeCoordinate(point.lon, minLon, lonRange, mapWidth);
//         const top = mapHeight - normalizeCoordinate(point.lat, minLat, latRange, mapHeight);

//         return (
//           <div
//             key={index}
//             className="map-point"
//             style={{
//               position: 'absolute',
//               left: `${left}px`,
//               top: `${top}px`,
//               width: '10px',
//               height: '10px',
//               borderRadius: '50%',
//               backgroundColor: 'red',
//               transform: 'translate(-50%, -50%)',
//               cursor: 'pointer',
//               zIndex: 5
//             }}
//             onClick={() => {
//               // Optional: show point details
//               alert(JSON.stringify({
//                 index: index + 1,
//                 latitude: point.lat,
//                 longitude: point.lon,
//                 data: point.data
//               }, null, 2));
//             }}
//           >
//             {/* Delete button */}
//             <button
//               className="delete-btn"
//               style={{
//                 position: 'absolute',
//                 top: '-15px',
//                 left: '50%',
//                 transform: 'translateX(-50%)',
//                 backgroundColor: 'rgba(255,0,0,0.7)',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '50%',
//                 width: '20px',
//                 height: '20px',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 cursor: 'pointer',
//                 zIndex: 15
//               }}
//               onClick={(e) => {
//                 e.stopPropagation();
//                 handleDeletePoint(index);
//               }}
//             >
//               X
//             </button>
//           </div>
//         );
//       })}

//       {/* Optional: Distance lines between points */}
//       {points.length > 1 && points.map((point, index) => {
//         if (index === 0) return null;
        
//         const prevPoint = points[index - 1];
//         const startLeft = normalizeCoordinate(prevPoint.lon, minLon, lonRange, mapWidth);
//         const startTop = mapHeight - normalizeCoordinate(prevPoint.lat, minLat, latRange, mapHeight);
//         const endLeft = normalizeCoordinate(point.lon, minLon, lonRange, mapWidth);
//         const endTop = mapHeight - normalizeCoordinate(point.lat, minLat, latRange, mapHeight);

//         return (
//           <svg 
//             key={`line-${index}`}
//             style={{
//               position: 'absolute',
//               top: 0,
//               left: 0,
//               pointerEvents: 'none',
//               zIndex: 1
//             }}
//             width={mapWidth}
//             height={mapHeight}
//           >
//             <line
//               x1={startLeft}
//               y1={startTop}
//               x2={endLeft}
//               y2={endTop}
//               stroke="rgba(0,0,255,0.3)"
//               strokeWidth="2"
//             />
//           </svg>
//         );
//       })}
//     </div>
//   );
// };

// // PropTypes for type checking and documentation
// MapComponent.propTypes = {
//   points: PropTypes.arrayOf(
//     PropTypes.shape({
//       lat: PropTypes.number.isRequired,
//       lon: PropTypes.number.isRequired,
//       data: PropTypes.object
//     })
//   ),
//   initialLat: PropTypes.number.isRequired,
//   initialLon: PropTypes.number.isRequired,
//   handleDeletePoint: PropTypes.func.isRequired
// };

// export default MapComponent;