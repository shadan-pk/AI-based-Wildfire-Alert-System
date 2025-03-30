import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../FirebaseConfig';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import MapComponent from '../components/MapComponent';

function Visualizer() {
  const [userLocations, setUserLocations] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [heatmapData, setHeatmapData] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    safeUsers: 0,
    unsafeUsers: 0
  });

  // Fetch available scenarios on component mount
  useEffect(() => {
    fetch('http://localhost:5000/api/scenarios')
      .then(res => res.json())
      .then(data => {
        setScenarios(data);
        // Automatically select first scenario if available
        if (data.length > 0) {
          setSelectedScenario(data[0]);
        }
      })
      .catch(error => console.error('Error fetching scenarios:', error));
  }, []);

  const handleStartSimulation = () => {
    if (!selectedScenario) {
      alert('Please select a scenario before starting');
      return;
    }
    
    setIsRunning(true);
  };

  const handleStopSimulation = () => {
    setIsRunning(false);
    setHeatmapData([]);
  };

  // Fetch heatmap data
  const fetchHeatmapData = useCallback(() => {
    if (!selectedScenario) return;
    
    fetch(`http://localhost:5000/api/scenario/${selectedScenario}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setLastFetchTime(new Date().toISOString());
        
        if (data && Array.isArray(data) && data.length > 0) {
          setHeatmapData(data);
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
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, selectedScenario, fetchHeatmapData]);

  // Firebase listener for user locations with email information
  useEffect(() => {
    let unsubscribe;
    
    if (isRunning) {
      const userLocationsCollection = collection(db, 'userLocation');
      
      unsubscribe = onSnapshot(userLocationsCollection, async (snapshot) => {
        const locationsPromises = snapshot.docs.map(async (userDoc) => {
          const email = userDoc.id;
          const data = userDoc.data();
          
          // Get safety status if available
          let safeStatus = null;
          try {
            const situationRef = collection(userDoc.ref, 'situation');
            const safetyDoc = await getDoc(doc(situationRef, 'SafeOrNot'));
            if (safetyDoc.exists()) {
              safeStatus = safetyDoc.data().safe;
            }
          } catch (error) {
            console.error(`Error fetching safety status for ${email}:`, error);
          }
          
          return {
            uid: userDoc.id,
            email: email,
            lat: data.latitude || null,
            lon: data.longitude || null,
            timestamp: data.timestamp?.toDate() || new Date(),
            safe: safeStatus
          };
        });
        
        const locations = await Promise.all(locationsPromises);
        const validLocations = locations.filter(user => user.lat !== null && user.lon !== null);
        
        // Calculate stats
        const safeUsers = validLocations.filter(user => user.safe === true).length;
        const unsafeUsers = validLocations.filter(user => user.safe === false).length;
        
        setUserLocations(validLocations);
        setStats({
          totalUsers: validLocations.length,
          safeUsers,
          unsafeUsers
        });
      });
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isRunning]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Wildfire Prediction Visualizer</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div>
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
        
        <button 
          onClick={handleStartSimulation} 
          disabled={isRunning || !selectedScenario} 
          style={{ 
            padding: '10px 20px', 
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
      
      {isRunning && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '4px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            <strong>Active Users:</strong> {stats.totalUsers}
          </div>
          <div>
            <strong>Safe Users:</strong> <span style={{color: 'green'}}>{stats.safeUsers}</span>
          </div>
          <div>
            <strong>At Risk:</strong> <span style={{color: 'red'}}>{stats.unsafeUsers}</span>
          </div>
          <div>
            <strong>Heatmap Points:</strong> {heatmapData.length}
          </div>
          {lastFetchTime && (
            <div>
              <strong>Last Update:</strong> {new Date(lastFetchTime).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
      
      <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
        <MapComponent 
          userLocations={userLocations} 
          heatmapData={heatmapData} 
        />
      </div>
      
      {isRunning && (
        <div style={{ marginTop: '15px', fontSize: '0.9em', color: '#666' }}>
          <p>
            <strong>How it works:</strong> User locations are compared against wildfire prediction 
            data. Green markers indicate safe users, while red markers show users in potential 
            danger areas. Safety status is updated every 5 seconds and stored in Firebase.
          </p>
        </div>
      )}
    </div>
  );
}

export default Visualizer;