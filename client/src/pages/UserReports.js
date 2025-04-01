import React from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
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

    // Add handleStatusChange method
    const handleStatusChange = async (reportId, newStatus) => {
        if (!selectedUser?.email || !reportId) return;

        try {
            const reportRef = doc(db, "userLocation", selectedUser.email, "reports", reportId);
            await updateDoc(reportRef, {
            status: newStatus,
            updatedAt: new Date()
            });
        } catch (error) {
            console.error("Error updating report status:", error);
        }
    };

    return (
        <div>
          {/* ...existing header... */}
          
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
                      .filter(([key]) => !['id', 'timestamp', 'status'].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="mb-1">
                          <span className="font-medium">{key}: </span>
                          {typeof value === 'object' && value !== null ? 
                            JSON.stringify(value) : 
                            String(value)}
                        </div>
                      ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm mr-2">Status: 
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        report.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        report.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {report.status || 'pending'}
                      </span>
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(report.id, 'approved')}
                        disabled={report.status === 'approved'}
                        className={`px-2 py-1 rounded text-xs ${
                          report.status === 'approved'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusChange(report.id, 'rejected')}
                        disabled={report.status === 'rejected'}
                        className={`px-2 py-1 rounded text-xs ${
                          report.status === 'rejected'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleStatusChange(report.id, 'pending')}
                        disabled={report.status === 'pending'}
                        className={`px-2 py-1 rounded text-xs ${
                          report.status === 'pending'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        pending
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };

export default UserReports;