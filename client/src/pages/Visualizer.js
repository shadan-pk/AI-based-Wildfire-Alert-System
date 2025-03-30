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

  useEffect(() => {
    fetch('http://localhost:5000/api/scenarios')
      .then(res => res.json())
      .then(data => {
        console.log('Fetched scenarios:', data);
        setScenarios(data);
      })
      .catch(error => console.error('Error fetching scenarios:', error));
  }, []);

  const handleStartSimulation = () => {
    setIsRunning(true);
    console.log('Simulation started:', {
      isRunning: true,
      selectedScenario,
      userLocationsCount: userLocations.length,
      heatmapDataCount: heatmapData.length,
      action: 'Fetching user locations and heatmap data (if scenario selected)',
    });
  };

  const handleStopSimulation = () => {
    setIsRunning(false);
    console.log('Simulation stopped:', {
      isRunning: false,
      selectedScenario,
      userLocationsCount: userLocations.length,
      heatmapDataCount: heatmapData.length,
      action: 'Stopping listeners and clearing heatmap',
    });
  };

  useEffect(() => {
    let intervalId;
    if (isRunning && selectedScenario) {
      const fetchHeatmapData = () => {
        fetch(`http://localhost:5000/api/scenario/${selectedScenario}`)
          .then(res => res.json())
          .then(data => {
            console.log('Visualizer fetched heatmap data:', data);
            setHeatmapData(data);
          })
          .catch(error => console.error('Error fetching scenario data:', error));
      };
      fetchHeatmapData();
      intervalId = setInterval(fetchHeatmapData, 5000);
    } else if (!isRunning) {
      setHeatmapData([]);
    }
    return () => intervalId && clearInterval(intervalId);
  }, [isRunning, selectedScenario]);

  useEffect(() => {
    let unsubscribe;
    if (isRunning) {
      unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        const locations = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            uid: doc.id,
            lat: data.location?.lat || null,
            lon: data.location?.lon || null,
          };
        }).filter(user => user.lat !== null && user.lon !== null);
        setUserLocations(locations);
      });
    }
    return () => unsubscribe && unsubscribe();
  }, [isRunning]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Wildfire Prediction Visualizer</h1>
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
            <option key={scenario} value={scenario}>{scenario}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleStartSimulation} disabled={isRunning} style={{ padding: '10px 20px', marginRight: '10px' }}>
          Start
        </button>
        <button onClick={handleStopSimulation} disabled={!isRunning} style={{ padding: '10px 20px' }}>
          Stop
        </button>
      </div>
      <MapComponent userLocations={userLocations} heatmapData={heatmapData} />
    </div>
  );
}

export default Visualizer;