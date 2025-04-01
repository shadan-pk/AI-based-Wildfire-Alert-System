import React from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../FirebaseConfig'; // Adjust this import to match your firebase config

const UserReports = ({ selectedUser }) => {
  const [userReports, setUserReports] = React.useState([]);
  const [reportsLoading, setReportsLoading] = React.useState(false);

  // Set up real-time listener for user reports
  React.useEffect(() => {
    if (!selectedUser) {
      setUserReports([]);
      return;
    }
    
    setReportsLoading(true);
    
    // Create reference to the reports collection
    const reportsRef = collection(db, "userLocation", selectedUser.email, "reports");
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(reportsRef, (snapshot) => {
      const reportsData = [];
      
      snapshot.forEach(doc => {
        // Skip metadata document
        if (doc.id !== 'metadata') {
          reportsData.push({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp ? doc.data().timestamp : null
          });
        }
      });
      
      // Sort reports by timestamp (newest first) if timestamp exists
      const sortedReports = reportsData.sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return b.timestamp.seconds - a.timestamp.seconds;
      });
      
      setUserReports(sortedReports);
      setReportsLoading(false);
    }, (error) => {
      console.error("Error listening to reports:", error);
      setReportsLoading(false);
    });
    
    // Clean up listener on unmount or when selectedUser changes
    return () => unsubscribe();
  }, [selectedUser]);

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 text-gray-700">
        Recent Reports
        {reportsLoading && (
          <span className="ml-2 text-sm font-normal text-blue-500">
            (Loading...)
          </span>
        )}
        {!reportsLoading && userReports.length > 0 && (
          <span className="ml-2 text-sm font-normal text-green-500">
            (Live updates enabled)
          </span>
        )}
      </h3>
      
      {reportsLoading ? (
        <div className="flex justify-center items-center h-32 bg-gray-50">
          <p>Loading reports...</p>
        </div>
      ) : userReports.length === 0 ? (
        <p className="text-gray-500">No reports found for this user.</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {userReports.map(report => (
            <div key={report.id} className="p-3 bg-gray-50 rounded border border-gray-200">
              <div className="flex justify-between items-start">
                <p className="font-medium">{report.id}</p>
                {report.timestamp && (
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(report.timestamp)}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-700 mt-2">
                {Object.entries(report)
                  .filter(([key]) => !['id', 'timestamp'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="mb-1">
                      <span className="font-medium">{key}: </span>
                      {typeof value === 'object' && value !== null ? 
                        JSON.stringify(value) : 
                        String(value)}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserReports;