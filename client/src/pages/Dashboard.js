import React, { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  collectionGroup,
  updateDoc
} from 'firebase/firestore';
import { db } from '../FirebaseConfig'; // Adjust this import to match your firebase config
import { getAuth } from 'firebase/auth';

const Dashboard = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [alertUserId, setAlertUserId] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [usersData, setUsersData] = useState({});
  const [activeTab, setActiveTab] = useState('online'); // Added for tab management
  const [debouncedLoading, setDebouncedLoading] = useState(false);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Console log to track component renders and state changes
  console.log("Dashboard rendering", { 
    selectedUser, 
    loading, 
    userReportsCount: userReports.length, 
    onlineUsersCount: onlineUsers.length,
    usersDataCount: Object.keys(usersData).length
  });

  // Real-time listener for all users in the users collection
  useEffect(() => {
    console.log("Setting up users collection listener");
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      console.log("Users collection update received", { docsCount: snapshot.docs.length });
      const usersMap = {};
      snapshot.docs.forEach((userDoc) => {
        const userData = userDoc.data();
        usersMap[userData.email] = {
          ...userData,
          uid: userDoc.id,
          name: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}` : 'Anonymous'
        };
      });
      setUsersData(usersMap);
      console.log("Updated usersData with", Object.keys(usersMap).length, "users");
    });
    
    return () => unsubscribe();
  }, []);

  // Add this effect to debounce the loading state
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setDebouncedLoading(true);
      }, 200); // Only show loading after 200ms
      return () => clearTimeout(timer);
    } else {
      setDebouncedLoading(false);
    }
  }, [loading]);
  

  // Real-time listener for all users regardless of simulation tab
  useEffect(() => {
    console.log("Setting up userLocation listener", { usersDataCount: Object.keys(usersData).length });
    setLoading(true);
    
    const userLocationsRef = collection(db, "userLocation");
    const unsubscribeLocations = onSnapshot(userLocationsRef, (snapshot) => {
      console.log("UserLocation collection update received", { docsCount: snapshot.docs.length });
      const allUsersData = [];
      const unsubscribePresenceArray = [];
      
      snapshot.docs.forEach((userDoc) => {
        const userEmail = userDoc.id;
        const locationData = userDoc.data();
        console.log("Processing user location for", userEmail);
        
        // Set up a real-time listener for this specific user's presence
        const presenceRef = doc(db, "userLocation", userEmail, "status", "presence");
        const unsubscribeUserPresence = onSnapshot(presenceRef, (presenceDoc) => {
          console.log("Presence update for", userEmail, { exists: presenceDoc.exists() });
          // Check if user is online based on presence status
          if (presenceDoc.exists()) {
            const presenceData = presenceDoc.data();
            // Get user data from our cached users data
            const userData = usersData[userEmail] || {
              name: 'Anonymous',
              email: userEmail
            };
            
            // Create or update user in our online users list
            const userIndex = allUsersData.findIndex(u => u.email === userEmail);
            const userInfo = {
              email: userEmail,
              name: userData.name,
              location: {
                latitude: locationData.latitude || 0,
                longitude: locationData.longitude || 0
              },
              timestamp: locationData.timestamp,
              uid: userData.uid,
              phone: userData.phone,
              address: userData.address,
              isOnline: presenceData.online === true, // Track online status separately
            };
            
            console.log("User info updated", { 
              email: userEmail, 
              name: userData.name, 
              isOnline: presenceData.online === true,
              existingIndex: userIndex 
            });
            
            if (userIndex >= 0) {
              allUsersData[userIndex] = userInfo;
            } else {
              allUsersData.push(userInfo);
            }
            
            // Update state with all users (both online and offline)
            // We'll filter based on the active tab when rendering
            setOnlineUsers([...allUsersData]);
            console.log("Updated onlineUsers array with", allUsersData.length, "users");
            
            // Update selected user if this was the selected user
            if (selectedUser && selectedUser.email === userEmail) {
              console.log("Updating selectedUser data for", userEmail);
              setSelectedUser(userInfo);
            }
          }
          
          setLoading(false);
        });
        
        // Keep track of unsubscribe functions
        unsubscribePresenceArray.push(unsubscribeUserPresence);
      });
      
      // Return a cleanup function that calls all the unsubscribe functions
      return () => {
        console.log("Cleaning up", unsubscribePresenceArray.length, "presence listeners");
        unsubscribePresenceArray.forEach(unsub => unsub());
      };
    });
    
    // THIS IS A CRUCIAL FIX: Return the proper cleanup function
    return () => {
      console.log("Cleaning up main userLocation listener");
      unsubscribeLocations();
    };
  }, [usersData, selectedUser]);

  // Real-time listener for selected user's reports
  useEffect(() => {
    console.log("Setting up reports listener", { selectedUser: selectedUser?.email });
    let unsubscribe = null;

    const setupReportsListener = async () => {
      if (!selectedUser?.email) {
        setUserReports([]);
        setLoading(false);
        return;
      }

      try {
        const reportsRef = collection(db, "userLocation", selectedUser.email, "reports");
        
        unsubscribe = onSnapshot(reportsRef, (snapshot) => {
          const reportsData = snapshot.docs
            .filter(doc => doc.id !== 'metadata')
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate() || new Date()
            }))
            .sort((a, b) => b.timestamp - a.timestamp);

          setUserReports(reportsData);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching reports:", error);
          setLoading(false);
        });
      } catch (error) {
        console.error("Error setting up reports listener:", error);
        setLoading(false);
      }
    };

    setupReportsListener();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedUser?.email]); // Only depend on email, not the entire selectedUser object

  // IMPORTANT: Adding a debug function to check the reports path
  const checkReportsPath = (user) => {
    if (!user || !user.email) {
      console.error("Invalid user or missing email", user);
      return;
    }
    
    console.log("Reports path would be:", `userLocation/${user.email}/reports`);
    // You might also log the entire user object to see what's available
    console.log("Full user object:", user);
  };

  const handleSendAlert = async (userId) => {
    try {
      console.log("Sending alert to user", userId);
      // Here you would implement your alert sending functionality
      // This could be through Firebase Cloud Messaging or another method
      
      // Example implementation (replace with your actual implementation)
      const userRef = doc(db, "users", userId);
      
      // You might want to add a subcollection for alerts
      // const alertsRef = collection(userRef, "alerts");
      // await addDoc(alertsRef, {
      //   message,
      //   timestamp: serverTimestamp(),
      //   read: false
      // });
      
      setAlertUserId(null);
      setMessage('');
      alert('Alert sent successfully!');
    } catch (error) {
      console.error('Error sending alert:', error);
      alert('Failed to send alert.');
    }
  };
  
  // Function to update report status
  const updateReportStatus = async (reportId, newStatus) => {
    try {
      if (!selectedUser) return;
      
      console.log("Updating report status", { reportId, newStatus, userEmail: selectedUser.email });
      const reportRef = doc(db, "userLocation", selectedUser.email, "reports", reportId);
      await updateDoc(reportRef, {
        status: newStatus
      });
      alert(`Report status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating report status:', error);
      alert('Failed to update report status.');
    }
  };

  // Filter users based on active tab and search term
  const filteredUsers = onlineUsers
    .filter(user => 
      (activeTab === 'online' ? user.isOnline : true) && // Show only online users when on 'online' tab
      (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return (a.email || '').localeCompare(b.email || '');
    });

  // Important: Modified the user selection function to prevent loading state issues
  const handleSelectUser = (user) => {
    console.log("User selected", user.email);
    
    // Add this to debug reports path
    checkReportsPath(user);
    
    // Important: don't set loading here, which would cause flickering
    // We'll manage loading state inside each effect
    setSelectedUser(user);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">User Management Dashboard</h1>
      
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <div className="mb-4 md:mb-0 w-full md:w-1/2 md:mr-4">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-4">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="email">Sort by Email</option>
          </select>
          <div className="flex border border-gray-300 rounded overflow-hidden">
            <button 
              className={`px-4 py-2 ${activeTab === 'online' ? 'bg-blue-500 text-white' : 'bg-white'}`}
              onClick={() => setActiveTab('online')}
            >
              Online Users
            </button>
            <button 
              className={`px-4 py-2 ${activeTab === 'all' ? 'bg-blue-500 text-white' : 'bg-white'}`}
              onClick={() => setActiveTab('all')}
            >
              All Users
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Users List */}
        <div className="w-full md:w-1/2 md:mr-4 mb-6 md:mb-0">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            {activeTab === 'online' ? 'Online Users' : 'All Users'} ({filteredUsers.length})
          </h2>
          {loading && onlineUsers.length === 0 ? (
            <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
              <p className="text-gray-500">No users found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {filteredUsers.map((user) => (
                <div 
                  key={user.email} 
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${selectedUser?.email === user.email ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-800">{user.name || 'Anonymous'}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm">
                        <span className={`inline-block w-2 h-2 ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'} rounded-full mr-1`}></span>
                        {user.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAlertUserId(user.uid);
                      }}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                    >
                      Alert
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Details and Reports */}
        <div className="w-full md:w-1/2">
          {selectedUser ? (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">User Details</h2>
              <div className="mb-6">
                <p className="mb-2"><span className="font-medium">Name:</span> {selectedUser.name}</p>
                <p className="mb-2"><span className="font-medium">Email:</span> {selectedUser.email}</p>
                {selectedUser.phone && (
                  <p className="mb-2"><span className="font-medium">Phone:</span> {selectedUser.phone}</p>
                )}
                {selectedUser.address && (
                  <p className="mb-2"><span className="font-medium">Address:</span> {selectedUser.address}</p>
                )}
                <p className="mb-2">
                  <span className="font-medium">Location:</span> 
                  {selectedUser.location ? 
                    ` Lat: ${selectedUser.location.latitude.toFixed(6)}, Lng: ${selectedUser.location.longitude.toFixed(6)}` : 
                    ' Not available'}
                </p>
                <p className="mb-2">
                  <span className="font-medium">Last Updated:</span> 
                  {selectedUser.timestamp ? 
                    ` ${new Date(selectedUser.timestamp.toDate()).toLocaleString()}` : 
                    ' Not available'}
                </p>
                <p className="mb-2">
                  <span className="font-medium">Status:</span> 
                  <span className={`ml-1 px-2 py-1 rounded text-xs ${selectedUser.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {selectedUser.isOnline ? 'Online' : 'Offline'}
                  </span>
                </p>
              </div>

              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                User Reports {!loading && `(${userReports.length})`}
              </h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
              {debouncedLoading ? (
  <div className="flex justify-center items-center h-32">
    <p className="text-gray-500">Loading reports...</p>
  </div>
) : userReports.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded">
                    <p className="text-gray-500">No reports found for this user.</p>
                  </div>
                ) : (
                  userReports.map(report => (
                    <div 
                      key={report.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 transition-all duration-200 ease-in-out"
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-medium">{report.id}</p>
                        {report.status && (
                          <div className="flex items-center">
                            <span className="text-sm mr-2">Status: 
                              <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                report.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                report.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {report.status}
                              </span>
                            </span>
                            <select 
                              onChange={(e) => updateReportStatus(report.id, e.target.value)}
                              className="text-sm border border-gray-300 rounded p-1"
                              value={report.status || 'pending'}
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 mt-1">
                        {Object.entries(report)
                          .filter(([key]) => key !== 'id' && key !== 'status')
                          .map(([key, value]) => (
                            <div key={key} className="mb-1">
                              <span className="font-medium">{key}: </span>
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
              <p className="text-gray-500">Select a user to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Alert Modal */}
      {alertUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold mb-4">Send Alert</h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter alert message"
              className="w-full p-2 border border-gray-300 rounded mb-4 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setAlertUserId(null);
                  setMessage('');
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendAlert(alertUserId)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;