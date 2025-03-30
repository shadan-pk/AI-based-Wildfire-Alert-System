import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../FirebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import MapComponent from '../components/MapComponent';

function Visualizer() {
  const [userLocations, setUserLocations] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [heatmapData, setHeatmapData] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  // Fetch available scenarios on component mount
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
    if (!selectedScenario) {
      alert('Please select a scenario before starting');
      return;
    }
    
    setIsRunning(true);
    console.log('Simulation started:', {
      isRunning: true,
      selectedScenario,
      userLocationsCount: userLocations.length,
      heatmapDataCount: heatmapData.length,
      action: 'Fetching user locations and heatmap data',
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

  // Memoized function to fetch heatmap data
  const fetchHeatmapData = useCallback(() => {
    if (!selectedScenario) return;
    
    console.log(`Fetching heatmap data for scenario: ${selectedScenario}`);
    
    fetch(`http://localhost:5000/api/scenario/${selectedScenario}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log(`Visualizer fetched ${data.length} heatmap points`);
        setLastFetchTime(new Date().toISOString());
        
        // Only update state if data is valid and different
        if (data && Array.isArray(data) && data.length > 0) {
          setHeatmapData(data);
        } else {
          console.warn('Received empty or invalid heatmap data');
        }
      })
      .catch(error => {
        console.error('Error fetching scenario data:', error);
      });
  }, [selectedScenario]);

  // Effect for heatmap data polling
  useEffect(() => {
    let intervalId;
    
    if (isRunning && selectedScenario) {
      // Initial fetch
      fetchHeatmapData();
      
      // Set up polling interval (5 seconds)
      intervalId = setInterval(fetchHeatmapData, 5000);
    } else if (!isRunning) {
      // Clear heatmap data when simulation is stopped
      setHeatmapData([]);
    }
    
    // Cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log('Cleared heatmap data polling interval');
      }
    };
  }, [isRunning, selectedScenario, fetchHeatmapData]);

  // Firebase listener for user locations
  useEffect(() => {
    let unsubscribe;
    
    if (isRunning) {
      console.log('Setting up Firebase listener for user locations');
      
      unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        const locations = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            uid: doc.id,
            lat: data.location?.lat || null,
            lon: data.location?.lon || null,
          };
        }).filter(user => user.lat !== null && user.lon !== null);
        
        console.log(`Received ${locations.length} user locations from Firebase`);
        setUserLocations(locations);
      });
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
        console.log('Unsubscribed from Firebase listener');
      }
    };
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
        <button 
          onClick={handleStartSimulation} 
          disabled={isRunning || !selectedScenario} 
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: isRunning ? '#cccccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'default' : 'pointer'
          }}
        >
          Start Simulation
        </button>
        
        <button 
          onClick={handleStopSimulation} 
          disabled={!isRunning} 
          style={{ 
            padding: '10px 20px',
            backgroundColor: !isRunning ? '#cccccc' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !isRunning ? 'default' : 'pointer'
          }}
        >
          Stop Simulation
        </button>
      </div>
      
      {lastFetchTime && (
        <div style={{ marginBottom: '10px', fontSize: '0.9em', color: '#666' }}>
          Last data update: {new Date(lastFetchTime).toLocaleTimeString()}
        </div>
      )}
      
      <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
        <MapComponent 
          userLocations={userLocations} 
          heatmapData={heatmapData} 
        />
      </div>
      
      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <strong>Active Users:</strong> {userLocations.length}
        </div>
        <div>
          <strong>Heatmap Points:</strong> {heatmapData.length}
        </div>
        <div>
          <strong>Status:</strong> {isRunning ? 'Running' : 'Stopped'}
        </div>
      </div>
    </div>
  );
}

export default Visualizer;