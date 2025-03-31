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

const Dashboard = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [alertUserId, setAlertUserId] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Listen for online users in real-time
  useEffect(() => {
    setLoading(true);
    
    // Create a query to fetch all documents in userLocation collection
    const userLocationsRef = collection(db, "userLocation");
    
    const unsubscribe = onSnapshot(userLocationsRef, async (snapshot) => {
      const onlineUsersData = [];
      
      // For each user location document
      for (const userDoc of snapshot.docs) {
        const userEmail = userDoc.id;
        
        // Get the presence status document
        const presenceDoc = await getDoc(doc(db, "userLocation", userEmail, "status", "presence"));
        
        // Only include users who are online
        if (presenceDoc.exists() && presenceDoc.data().online === true) {
          // Get the user's location data
          const locationData = userDoc.data();
          
          // Find the user details from users collection
          const usersSnapshot = await getDocs(
            query(collection(db, "users"), where("email", "==", userEmail))
          );
          
          let userData = {};
          if (!usersSnapshot.empty) {
            userData = usersSnapshot.docs[0].data();
            userData.uid = usersSnapshot.docs[0].id;
          }
          
          onlineUsersData.push({
            email: userEmail,
            name: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}` : 'Anonymous',
            location: {
              latitude: locationData.latitude,
              longitude: locationData.longitude
            },
            timestamp: locationData.timestamp,
            uid: userData.uid,
            phone: userData.phone,
            address: userData.address
          });
        }
      }
      
      setOnlineUsers(onlineUsersData);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Fetch reports for a selected user
  useEffect(() => {
    if (!selectedUser) {
      setUserReports([]);
      return;
    }
    
    const fetchReports = async () => {
      try {
        const reportsRef = collection(db, "userLocation", selectedUser.email, "reports");
        const reportsSnapshot = await getDocs(reportsRef);
        
        const reportsData = [];
        reportsSnapshot.forEach(doc => {
          // Skip metadata document
          if (doc.id !== 'metadata') {
            reportsData.push({
              id: doc.id,
              ...doc.data()
            });
          }
        });
        
        setUserReports(reportsData);
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    };
    
    fetchReports();
  }, [selectedUser]);

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

  const filteredUsers = onlineUsers
    .filter(user => 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return (a.email || '').localeCompare(b.email || '');
    });

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
                      <h3 className="font-medium text-gray-800">{user.name || 'Anonymous'}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        Online
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
              </div>

              <h3 className="text-lg font-semibold mb-3 text-gray-700">Recent Reports</h3>
              {userReports.length === 0 ? (
                <p className="text-gray-500">No reports found for this user.</p>
              ) : (
                <div className="space-y-3">
                  {userReports.map(report => (
                    <div key={report.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                      <p className="font-medium">{report.id}</p>
                      <div className="text-sm text-gray-700 mt-1">
                        {Object.entries(report)
                          .filter(([key]) => key !== 'id')
                          .map(([key, value]) => (
                            <div key={key} className="mb-1">
                              <span className="font-medium">{key}: </span>
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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