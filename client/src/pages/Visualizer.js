import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../FirebaseConfig';
import { collection, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import MapComponent from '../components/MapComponent';

function Visualizer() {
  const [userLocations, setUserLocations] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [heatmapData, setHeatmapData] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [error, setError] = useState(null);
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
      .catch(error => {
        console.error('Error fetching scenarios:', error);
        setError('Failed to load scenarios. Please check the server connection.');
      });
  }, []);

  const handleStartSimulation = () => {
    if (!selectedScenario) {
      alert('Please select a scenario before starting');
      return;
    }
    
    setError(null); // Clear any previous errors
    setIsRunning(true);
  };

  const handleStopSimulation = () => {
    setIsRunning(false);
  };

  // Create necessary collections structure in Firebase
  const ensureFirebaseStructure = useCallback(async () => {
    try {
      // This is a workaround for the permission error
      // Get all user emails from the userLocation collection
      const snapshot = await getDoc(doc(collection(db, 'userLocation'), 'structure_test'));
      
      // If it doesn't exist, create it to initialize the structure
      if (!snapshot.exists()) {
        await setDoc(doc(collection(db, 'userLocation'), 'structure_test'), {
          timestamp: new Date(),
          latitude: 0,
          longitude: 0
        });
        
        // Create the situation subcollection and SafeOrNot document
        const situationRef = collection(doc(collection(db, 'userLocation'), 'structure_test'), 'situation');
        await setDoc(doc(situationRef, 'SafeOrNot'), { 
          safe: true,
          initialized: true 
        });
        
        console.log('Created initial Firebase structure');
      }
    } catch (error) {
      console.error('Error ensuring Firebase structure:', error);
      setError('Firebase permission error. Please check your Firebase security rules.');
    }
  }, []);

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
        } else {
          console.warn('Received empty or invalid heatmap data');
        }
      })
      .catch(error => {
        console.error('Error fetching scenario data:', error);
        setError(`Failed to load scenario data: ${error.message}`);
      });
  }, [selectedScenario]);

  // Initialize Firebase structure when component mounts
  useEffect(() => {
    ensureFirebaseStructure();
  }, [ensureFirebaseStructure]);

  // Effect for heatmap data polling
  useEffect(() => {
    let intervalId;
    
    // Always fetch heatmap data when scenario changes, regardless of running state
    if (selectedScenario) {
      fetchHeatmapData();
    }
    
    // Start polling only when simulation is running
    if (isRunning && selectedScenario) {
      intervalId = setInterval(fetchHeatmapData, 5000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, selectedScenario, fetchHeatmapData]);

  // Firebase listener for user locations with error handling
  useEffect(() => {
    let unsubscribe;
    
    if (isRunning) {
      try {
        const userLocationsCollection = collection(db, 'userLocation');
        
        unsubscribe = onSnapshot(userLocationsCollection, 
          async (snapshot) => {
            try {
              const locationsPromises = snapshot.docs
                .filter(doc => doc.id !== 'structure_test') // Skip our test document
                .map(async (userDoc) => {
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
                    console.log(`No safety data yet for ${email}`);
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
            } catch (innerError) {
              console.error('Error processing user locations:', innerError);
            }
          },
          (error) => {
            console.error('Firebase listener error:', error);
            setError(`Firebase error: ${error.message}. Please check your permissions.`);
          }
        );
      } catch (outerError) {
        console.error('Error setting up Firebase listener:', outerError);
        setError(`Failed to connect to Firebase: ${outerError.message}`);
      }
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
      
      {error && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '15px', 
          backgroundColor: '#ffeded', 
          border: '1px solid #ff9999',
          borderRadius: '4px',
          color: '#d32f2f'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
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
      
      <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
        <MapComponent 
          userLocations={userLocations} 
          heatmapData={heatmapData} 
        />
      </div>
      
      <div style={{ marginTop: '15px', fontSize: '0.9em', color: '#666' }}>
        <p>
          <strong>How it works:</strong> User locations are compared against wildfire prediction 
          data. Green markers indicate safe users, while red markers show users in potential 
          danger areas. Safety status is updated every 5 seconds and stored in Firebase.
        </p>
        
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <strong>Firebase Structure:</strong><br/>
          <code>
            userLocation<br/>
            &nbsp;&nbsp;└── [user email]<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── latitude: number<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── longitude: number<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── timestamp: date<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── situation (collection)<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── SafeOrNot (document)<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── safe: boolean
          </code>
        </div>
      </div>
    </div>
  );
}

export default Visualizer;