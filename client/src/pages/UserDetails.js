import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

const UserDetails = ({ selectedUser, db }) => {
  const [userDetails, setUserDetails] = useState(selectedUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedUser || !db) return;
    
    setLoading(true);
    setUserDetails(selectedUser); // Set initial state from prop
    
    // Set up real-time listeners for user details
    const userDocRef = doc(db, "users", selectedUser.email);
    const userLocationRef = doc(db, "userLocation", selectedUser.email);
    const presenceRef = doc(db, "userLocation", selectedUser.email, "status", "presence");
    
    // Listen for changes to user details
    const detailsUnsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data();
        setUserDetails(prev => ({
          ...prev,
          name: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || prev.email.split('@')[0],
          phone: userData.phone,
          address: userData.address,
          // Add any other fields you want to track
        }));
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user details:", error);
      setLoading(false);
    });
    
    // Listen for changes to user location
    const locationUnsubscribe = onSnapshot(userLocationRef, (snapshot) => {
      if (snapshot.exists()) {
        const locationData = snapshot.data();
        setUserDetails(prev => ({
          ...prev,
          location: {
            latitude: locationData.latitude,
            longitude: locationData.longitude
          },
          timestamp: locationData.timestamp
        }));
      }
    }, (error) => {
      console.error("Error fetching user location:", error);
    });
    
    // Listen for changes to user online status
    const presenceUnsubscribe = onSnapshot(presenceRef, (snapshot) => {
      const isOnline = snapshot.exists() && snapshot.data().online === true;
      setUserDetails(prev => ({
        ...prev,
        isOnline
      }));
    }, (error) => {
      console.error("Error fetching user presence:", error);
    });
    
    return () => {
      detailsUnsubscribe();
      locationUnsubscribe();
      presenceUnsubscribe();
    };
  }, [selectedUser, db]);
  
  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return <div className="p-4">Loading user details...</div>;
  }

  return (
    <div className="user-details">
      <h3 className="text-lg font-semibold mb-3 text-gray-700">User Details</h3>
      <div className="space-y-2">
        <div className="flex items-center mb-1">
          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
            userDetails.isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}></span>
          <span className="font-medium">{userDetails.isOnline ? 'Online' : 'Offline'}</span>
        </div>
        
        <p><span className="font-medium">Name:</span> {userDetails.name}</p>
        <p><span className="font-medium">Email:</span> {userDetails.email}</p>
        
        {userDetails.phone && (
          <p><span className="font-medium">Phone:</span> {userDetails.phone}</p>
        )}
        
        {userDetails.address && (
          <p><span className="font-medium">Address:</span> {userDetails.address}</p>
        )}
        
        {userDetails.location && (
          <div>
            <p className="font-medium mb-1">Location:</p>
            <p className="ml-4">Latitude: {userDetails.location.latitude.toFixed(6)}</p>
            <p className="ml-4">Longitude: {userDetails.location.longitude.toFixed(6)}</p>
          </div>
        )}
        
        <p>
          <span className="font-medium">Last Updated:</span> 
          {userDetails.timestamp ? 
            ` ${formatTimestamp(userDetails.timestamp)}` : 
            ' Not available'}
        </p>
      </div>
    </div>
  );
};

export default UserDetails;