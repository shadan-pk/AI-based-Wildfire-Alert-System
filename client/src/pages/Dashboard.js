import React, { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  onSnapshot,
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../FirebaseConfig'; // Adjust this import to match your firebase config
import UserReports from './UserReports'; // Import the new component
import UserDetails from './UserDetails'; // Import the new UserDetails component

const Dashboard = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [alertUserId, setAlertUserId] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('online');

  useEffect(() => {
    setLoading(true);
    const userLocationsRef = collection(db, "userLocation");
    let userStatusListeners = new Map();

    const unsubscribe = onSnapshot(userLocationsRef, async (snapshot) => {
      try {
        // Clear previous status listeners
        userStatusListeners.forEach(unsubscribe => unsubscribe());
        userStatusListeners.clear();

        // Process all users first
        const processedUsers = await Promise.all(snapshot.docs
          .filter(doc => doc.id !== 'structure_test')
          .map(async (userDoc) => {
            const userEmail = userDoc.id;
            const locationData = userDoc.data();
            
            // Get user details
            const userDetailsDoc = await getDoc(doc(db, "users", userEmail));
            const userData = userDetailsDoc.exists() ? userDetailsDoc.data() : {};
            
            // Get initial online status
            const presenceRef = doc(db, "userLocation", userEmail, "status", "presence");
            const presenceDoc = await getDoc(presenceRef);
            const isOnline = presenceDoc.exists() && presenceDoc.data().online === true;
            
            return {
              email: userEmail,
              name: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userEmail.split('@')[0],
              location: {
                latitude: locationData.latitude,
                longitude: locationData.longitude
              },
              timestamp: locationData.timestamp,
              isOnline,
              phone: userData.phone,
              address: userData.address,
              uid: userEmail
            };
          }));

        // Update all users at once
        setAllUsers(processedUsers);
        setLoading(false);

        // Set up status listeners after initial load
        processedUsers.forEach(user => {
          const presenceRef = doc(db, "userLocation", user.email, "status", "presence");
          const statusListener = onSnapshot(presenceRef, (statusDoc) => {
            const isOnline = statusDoc.exists() && statusDoc.data().online === true;
            
            setAllUsers(prev => {
              const updatedUsers = prev.map(u => 
                u.email === user.email ? { ...u, isOnline } : u
              );
              
              // Clear selected user if they go offline and we're in online tab
              if (!isOnline && activeTab === 'online' && selectedUser?.email === user.email) {
                setSelectedUser(null);
              }
              
              return updatedUsers;
            });
          });
        
          userStatusListeners.set(user.email, statusListener);
        });

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

  useEffect(() => {
    // Clear selected user if they don't match the current tab filter
    if (selectedUser) {
      const isVisible = 
        activeTab === 'all' || 
        (activeTab === 'online' && selectedUser.isOnline) ||
        (activeTab === 'offline' && !selectedUser.isOnline);
      
      if (!isVisible) {
        setSelectedUser(null);
      }
    }
  }, [activeTab, selectedUser]);
  
  const handleSendAlert = async (userId) => {
    try {
      const alertId = `alert_${Date.now()}`;
      const alertRef = doc(db, "userLocation", userId, "alerts", alertId);
      
      await setDoc(alertRef, {
        message: message,
        timestamp: serverTimestamp(),
        type: 'admin_alert',
        sender: 'system',
        severity: 'high',
        read: false
      });
      
      setAlertUserId(null);
      setMessage('');
      alert('Alert sent successfully!');
    } catch (error) {
      console.error('Error sending alert:', error);
      alert('Failed to send alert: ' + error.message);
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
        {/* Users List */}
        <div className="w-full md:w-1/2 md:mr-4 mb-6 md:mb-0">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Users</h2>
          {loading ? (
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

        {/* User Details Section */}
        <div className="w-full md:w-1/2">
          {selectedUser ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold text-gray-700">User Information</h2>
              </div>
              
              {/* Tabbed interface for user details and reports */}
              <div className="tabs p-4">
                {/* User Details Component */}
                <UserDetails selectedUser={selectedUser} db={db} />
                
                {/* User Reports Component */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">User Reports</h3>
                  <UserReports selectedUser={selectedUser} />
                </div>
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