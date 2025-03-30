import React, { useState, useEffect } from 'react';
import { db } from '../FirebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import MapComponent from '../components/MapComponent';

function Visualizer() {
  const [userLocations, setUserLocations] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [heatmapData, setHeatmapData] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  // Fetch list of scenarios from MongoDB server on mount
  useEffect(() => {
    fetch('http://localhost:5000/api/scenarios')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch scenarios');
        return res.json();
      })
      .then(data => {
        console.log('Fetched scenarios:', data);
        setScenarios(data);
      })
      .catch(error => console.error('Error fetching scenarios:', error));
  }, []);

  // Fetch heatmap data when a scenario is selected
  useEffect(() => {
    if (selectedScenario) {
      fetch(`http://localhost:5000/api/scenario/${selectedScenario}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch scenario data');
          return res.json();
        })
        .then(data => {
          console.log('Fetched heatmap data:', data);
          setHeatmapData(data);
        })
        .catch(error => console.error('Error fetching scenario data:', error));
    }
  }, [selectedScenario]);

  // Real-time listener for user locations from Firestore
  useEffect(() => {
    let unsubscribe;
    if (isRunning) {
      console.log('Starting Firestore listener...');
      unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        const locations = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Firestore doc:', doc.id, data); // Log raw data
          return {
            uid: doc.id,
            lat: data.location?.lat || null,
            lon: data.location?.lon || null,
          };
        }).filter(user => user.lat !== null && user.lon !== null);
        console.log('Processed user locations:', locations);
        setUserLocations(locations);
      }, (error) => {
        console.error('Firestore listener error:', error.message);
      });
    }
    return () => {
      if (unsubscribe) {
        console.log('Stopping Firestore listener...');
        unsubscribe();
      }
    };
  }, [isRunning]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Wildfire Prediction Visualizer</h1>

      {/* Scenario selection dropdown */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="scenarioSelect">Select Scenario: </label>
        <select
          id="scenarioSelect"
          value={selectedScenario}
          onChange={e => setSelectedScenario(e.target.value)}
          style={{ padding: '5px', marginLeft: '10px' }}
        >
          <option value="">-- Choose a Scenario --</option>
          {scenarios.map(scenario => (
            <option key={scenario} value={scenario}>
              {scenario}
            </option>
          ))}
        </select>
      </div>

      {/* Start/Stop buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setIsRunning(true)}
          disabled={isRunning}
          style={{ padding: '10px 20px', marginRight: '10px' }}
        >
          Start
        </button>
        <button
          onClick={() => setIsRunning(false)}
          disabled={!isRunning}
          style={{ padding: '10px 20px' }}
        >
          Stop
        </button>
      </div>

      {/* Map component */}
      <MapComponent userLocations={userLocations} heatmapData={heatmapData} />
    </div>
  );
}

export default Visualizer;