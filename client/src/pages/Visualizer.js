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
  const [heatmapRendered, setHeatmapRendered] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    safeUsers: 0,
    unsafeUsers: 0,
    heatmapPoints: 0
  });

  // Fetch available scenarios on component mount
  useEffect(() => {
    fetch('http://localhost:5000/api/scenarios')
      .then(res => res.json())
      .then(data => {
        console.log('Fetched scenarios:', data);
        setScenarios(data);
        if (data.length > 0) {
          setSelectedScenario(data[0]);
        }
      })
      .catch(error => {
        console.error('Error fetching scenarios:', error);
        setError('Failed to load scenarios. Please check the server connection.');
      });
  }, []);

  // Fetch and process heatmap data, then push to Firebase
  const fetchHeatmapData = useCallback(() => {
    if (!selectedScenario) return;

    console.log(`Fetching heatmap data for scenario: ${selectedScenario}`);
    setHeatmapRendered(false);

    fetch(`http://localhost:5000/api/scenario/${selectedScenario}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log(`Received ${data.length} raw heatmap points`);

        // Data validation and normalization
        const processedData = data.map(point => {
          const lat = parseFloat(point.lat?.$numberDouble || point.lat);
          const lon = parseFloat(point.lon?.$numberDouble || point.lon);
          let prediction = 0;

          if (point.prediction?.$numberInt) {
            prediction = parseInt(point.prediction.$numberInt, 10);
          } else if (point.prediction?.$numberDouble) {
            prediction = parseFloat(point.prediction.$numberDouble);
          } else {
            prediction = parseInt(point.prediction || 0, 10);
          }

          return {
            lat,
            lon,
            prediction,
            metadata: point.metadata || {}
          };
        }).filter(point => !isNaN(point.lat) && !isNaN(point.lon));

        console.log(`Processed ${processedData.length} valid heatmap points`);

        // Update local state
        setHeatmapData(processedData);
        setStats(prev => ({ ...prev, heatmapPoints: processedData.length }));
        setLastFetchTime(new Date().toISOString());

        // Push to Firebase
        setDoc(doc(db, 'selectedScenario', 'current'), {
          scenarioName: selectedScenario,
          selectedAt: new Date(),
          heatmapData: processedData
        })
          .then(() => {
            console.log(`Pushed ${processedData.length} points to Firebase for ${selectedScenario}`);
          })
          .catch(error => {
            console.error('Error pushing to Firebase:', error);
            setError('Failed to update Firebase with scenario data');
          });
      })
      .catch(error => {
        console.error('Error fetching scenario data:', error);
        setError(`Failed to load scenario data: ${error.message}`);
      });
  }, [selectedScenario]);

  // Subscribe to Firebase "selectedScenario/current" for real-time updates
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'selectedScenario', 'current'),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setHeatmapData(data.heatmapData || []);
          setSelectedScenario(data.scenarioName || '');
          setStats(prev => ({ ...prev, heatmapPoints: data.heatmapData?.length || 0 }));
          setLastFetchTime(new Date().toISOString());
        } else {
          setHeatmapData([]);
          // Don't reset selectedScenario here to avoid dropdown flicker
          setStats(prev => ({ ...prev, heatmapPoints: 0 }));
        }
      },
      (error) => {
        console.error('Error subscribing to selected scenario:', error);
        setError('Failed to subscribe to scenario updates');
      }
    );

    return () => unsubscribe();
  }, []);

  // Initialize Firebase structure for user locations
  const ensureFirebaseStructure = useCallback(async () => {
    try {
      const snapshot = await getDoc(doc(collection(db, 'userLocation'), 'structure_test'));
      if (!snapshot.exists()) {
        await setDoc(doc(collection(db, 'userLocation'), 'structure_test'), {
          timestamp: new Date(),
          latitude: 0,
          longitude: 0
        });
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

  useEffect(() => {
    ensureFirebaseStructure();
  }, [ensureFirebaseStructure]);

  // Fetch heatmap data when scenario changes
  useEffect(() => {
    if (selectedScenario) {
      fetchHeatmapData();
    }
  }, [selectedScenario, fetchHeatmapData]);

  // Handle simulation start
  const handleStartSimulation = () => {
    if (!selectedScenario) {
      alert('Please select a scenario before starting');
      return;
    }
    setError(null);
    setIsRunning(true);
    console.log('Simulation started:', {
      isRunning: true,
      selectedScenario,
      userLocationsCount: userLocations.length,
      heatmapDataCount: heatmapData.length,
      action: 'Fetching user locations',
    });
  };

  // Handle simulation stop
  const handleStopSimulation = () => {
    setIsRunning(false);
    console.log('Simulation stopped:', {
      isRunning: false,
      selectedScenario,
      userLocationsCount: userLocations.length,
      heatmapDataCount: heatmapData.length,
      action: 'Stopping listeners',
    });
  };

  // Firebase listener for user locations
  useEffect(() => {
    let userUnsubscribe;
    let statusUnsubscribes = new Map();

    if (isRunning) {
      try {
        const userLocationsCollection = collection(db, 'userLocation');
        userUnsubscribe = onSnapshot(userLocationsCollection,
          async (snapshot) => {
            statusUnsubscribes.forEach(unsubscribe => unsubscribe());
            statusUnsubscribes.clear();

            const locationsPromises = snapshot.docs
              .filter(doc => doc.id !== 'structure_test')
              .map(async (userDoc) => {
                const email = userDoc.id;
                const data = userDoc.data();
                const userDocRef = doc(db, 'userLocation', email);
                const statusRef = doc(db, 'userLocation', email, 'status', 'presence');

                const statusUnsubscribe = onSnapshot(statusRef, async (statusDoc) => {
                  const isOnline = statusDoc.exists() && statusDoc.data().online === true;
                  if (!isOnline) {
                    setUserLocations(prev => {
                      const updated = prev.filter(u => u.email !== email);
                      setStats(prevStats => ({
                        ...prevStats,
                        totalUsers: updated.length,
                        safeUsers: updated.filter(u => u.safe === true).length,
                        unsafeUsers: updated.filter(u => u.safe === false).length
                      }));
                      return updated;
                    });
                  } else {
                    const userData = (await getDoc(userDocRef)).data();
                    const situationRef = doc(db, 'userLocation', email, 'situation', 'SafeOrNot');
                    const safetyDoc = await getDoc(situationRef);
                    const safeStatus = safetyDoc.exists() ? safetyDoc.data().safe : null;

                    const updatedUser = {
                      uid: email,
                      email,
                      lat: userData.latitude || null,
                      lon: userData.longitude || null,
                      timestamp: userData.timestamp?.toDate() || new Date(),
                      safe: safeStatus
                    };

                    setUserLocations(prev => {
                      const filtered = prev.filter(u => u.email !== email);
                      const newLocations = [...filtered, updatedUser];
                      setStats(prevStats => ({
                        ...prevStats,
                        totalUsers: newLocations.length,
                        safeUsers: newLocations.filter(u => u.safe === true).length,
                        unsafeUsers: newLocations.filter(u => u.safe === false).length
                      }));
                      return newLocations;
                    });
                  }
                });

                statusUnsubscribes.set(email, statusUnsubscribe);

                const statusDoc = await getDoc(statusRef);
                const isOnline = statusDoc.exists() && statusDoc.data().online === true;
                if (!isOnline) {
                  console.log(`User ${email} is offline, skipping`);
                  return null;
                }

                const safetyRef = doc(db, 'userLocation', email, 'situation', 'SafeOrNot');
                const safetyDoc = await getDoc(safetyRef);
                const safeStatus = safetyDoc.exists() ? safetyDoc.data().safe : null;

                return {
                  uid: email,
                  email,
                  lat: data.latitude || null,
                  lon: data.longitude || null,
                  timestamp: data.timestamp?.toDate() || new Date(),
                  safe: safeStatus
                };
              });

            const locations = (await Promise.all(locationsPromises))
              .filter(Boolean)
              .filter(user => user.lat !== null && user.lon !== null);

            setUserLocations(locations);
            setStats(prevStats => ({
              ...prevStats,
              totalUsers: locations.length,
              safeUsers: locations.filter(user => user.safe === true).length,
              unsafeUsers: locations.filter(user => user.safe === false).length
            }));
          });
      } catch (error) {
        console.error('Error setting up Firebase listener:', error);
        setError(`Failed to connect to Firebase: ${error.message}`);
      }
    }

    return () => {
      if (userUnsubscribe) userUnsubscribe();
      statusUnsubscribes.forEach(unsubscribe => unsubscribe());
      statusUnsubscribes.clear();
    };
  }, [isRunning]);

  return (
    <div style={{ padding: '20px'}}>
      <h1
      style={
        {
          fontSize:30,
          color:"white",
          marginBottom:20
        }
      }
      >Wildfire Prediction Visualizer</h1>

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
          <label htmlFor="scenarioSelect"       
          style={
        {
          fontSize:20,
          color:"white",
          marginBottom:20
        }
      }>Select Scenario: </label>
          <select
            id="scenarioSelect"
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
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
        <div><strong>Active Users:</strong> {stats.totalUsers}</div>
        <div><strong>Safe Users:</strong> <span style={{ color: 'green' }}>{stats.safeUsers}</span></div>
        <div><strong>At Risk:</strong> <span style={{ color: 'red' }}>{stats.unsafeUsers}</span></div>
        <div>
          <strong>Heatmap Points:</strong> {stats.heatmapPoints}
          {heatmapRendered && <span style={{ color: 'green' }}> ✓</span>}
        </div>
        {lastFetchTime && (
          <div><strong>Last Update:</strong> {new Date(lastFetchTime).toLocaleTimeString()}</div>
        )}
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
        <MapComponent
          userLocations={userLocations}
          heatmapData={heatmapData}
          onHeatmapRender={(pointCount) => {
            console.log(`Heatmap rendered with ${pointCount} points`);
            setHeatmapRendered(true);
          }}
        />
      </div>

      <div style={{ marginTop: '15px', fontSize: '0.9em', color: '#fafafa' }}>
        <p>
          <strong>How it works:</strong> User locations are compared against wildfire prediction
          data. Green markers indicate safe users, while red markers show users in potential
          danger areas. Safety status is updated every 5 seconds and stored in Firebase.
        </p>
      </div>
    </div>
  );
}

export default Visualizer;