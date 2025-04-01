import React, { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  query, 
  where, 
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { db } from '../FirebaseConfig'; // Adjust this import to match your firebase config
import { getAuth } from 'firebase/auth';
import UserReports from './UserReports'; // Import the new component

const Dashboard = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [alertUserId, setAlertUserId] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('online');

  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    setLoading(true);
    const userLocationsRef = collection(db, "userLocation");
    let userStatusListeners = new Map();

    const unsubscribe = onSnapshot(userLocationsRef, async (snapshot) => {
      try {
        // Clear previous status listeners
        userStatusListeners.forEach(unsubscribe => unsubscribe());
        userStatusListeners.clear();

        const usersData = new Map();

        // First, get all user documents
        for (const userDoc of snapshot.docs) {
          const userEmail = userDoc.id;
          if (userEmail === 'structure_test') continue;

          const locationData = userDoc.data();
          
          // Set up individual status listener for each user
          const presenceRef = doc(db, "userLocation", userEmail, "status", "presence");
          const statusListener = onSnapshot(presenceRef, async (statusDoc) => {
            const isOnline = statusDoc.exists() && statusDoc.data().online === true;
            
            // Get user details from users collection if not already fetched
            if (!usersData.has(userEmail)) {
              const userDetailsDoc = await getDoc(doc(db, "users", userEmail));
              const userData = userDetailsDoc.exists() ? userDetailsDoc.data() : {};
              
              const updatedUser = {
                email: userEmail,
                name: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
                location: {
                  latitude: locationData.latitude,
                  longitude: locationData.longitude
                },
                timestamp: locationData.timestamp,
                isOnline,
                phone: userData.phone,
                address: userData.address,
                uid: userEmail // Use email as uid if not specified
              };

              // Update state with new user data
              setAllUsers(prev => {
                const filtered = prev.filter(u => u.email !== userEmail);
                return [...filtered, updatedUser];
              });
            } else {
              // Just update online status for existing user
              setAllUsers(prev => prev.map(user => 
                user.email === userEmail ? { ...user, isOnline } : user
              ));
            }
          });

          userStatusListeners.set(userEmail, statusListener);
        }
      } catch (error) {
        console.error('Error processing users:', error);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      userStatusListeners.forEach(unsubscribe => unsubscribe());
      userStatusListeners.clear();
    };
  }, []);

  const handleSendAlert = async (userId) => {
    try {
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

  const filteredUsers = allUsers
    .filter(user => {
      const userName = user.name || 'Unknown User';
      const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'all' || 
                        (activeTab === 'online' && user.isOnline) ||
                        (activeTab === 'offline' && !user.isOnline);
      return matchesSearch && matchesTab;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || 'Unknown User').localeCompare(b.name || 'Unknown User');
      }
      return (a.email || '').localeCompare(b.email || '');
    });

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">User Management Dashboard</h1>
      
      {/* Add tabs */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setActiveTab('online')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'online' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Online Users ({allUsers.filter(u => u.isOnline).length})
        </button>
        <button
          onClick={() => setActiveTab('offline')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'offline' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Offline Users ({allUsers.filter(u => !u.isOnline).length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Users ({allUsers.length})
        </button>
      </div>

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
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="name">Sort by Name</option>
          <option value="email">Sort by Email</option>
        </select>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Online Users List */}
        <div className="w-full md:w-1/2 md:mr-4 mb-6 md:mb-0">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Online Users</h2>
          {loading ? (
            <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
              <p className="text-gray-500">No online users found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {filteredUsers.map((user) => (
                <div 
                  key={user.email} 
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${selectedUser?.email === user.email ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {user.name || user.email.split('@')[0]}
                      </h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm">
                        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                          user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`}></span>
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
                    ` ${formatTimestamp(selectedUser.timestamp)}` : 
                    ' Not available'}
                </p>
              </div>

              {/* Using the UserReports component */}
              <UserReports selectedUser={selectedUser} />
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
                disabled={!message.trim()}
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