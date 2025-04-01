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

  // Handle status change of a report
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

  // Get color styling based on severity
// Improved severity styles function with consistent colors and stronger contrast
const getSeverityStyles = (severity) => {
    if (!severity) return {
      borderColor: 'border-gray-300',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      badgeColor: 'bg-gray-200 text-gray-800'
    };
  
    const severityLower = typeof severity === 'string' ? severity.toLowerCase() : '';
    
    switch (severityLower) {
      case 'high':
      case 'critical':
      case 'severe':
        return {
          borderColor: 'border-red-500',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          badgeColor: 'bg-red-600 text-white'
        };
      case 'medium':
      case 'moderate':
        return {
          borderColor: 'border-orange-500',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          badgeColor: 'bg-orange-500 text-white'
        };
      case 'low':
      case 'minor':
        return {
          // Fixed inconsistency: was using green border but yellow text
          borderColor: 'border-yellow-500',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          badgeColor: 'bg-yellow-500 text-white'
        };
      case 'info':
      case 'information':
      case 'informational':
        return {
          borderColor: 'border-blue-500',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          badgeColor: 'bg-blue-600 text-white'
        };
      default:
        return {
          borderColor: 'border-gray-300',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          badgeColor: 'bg-gray-600 text-white'
        };
    }
  };

  // Display report fields in a consistent, ordered way
  const renderReportFields = (report) => {
    // Define key order for displaying report fields
    const keyOrder = ['severity', 'location', 'address', 'reason', 'description', 'photoURL'];
    
    // Get all keys that aren't special fields
    const allKeys = Object.keys(report).filter(key => 
      !['id', 'timestamp', 'status', 'updatedAt'].includes(key)
    );
    
    // Sort keys - first the ordered ones, then any remaining alphabetically
    const sortedKeys = [
      ...keyOrder.filter(key => allKeys.includes(key)),
      ...allKeys.filter(key => !keyOrder.includes(key)).sort()
    ];
    
    return sortedKeys.map(key => (
      <div key={key} className="mb-1">
        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}: </span>
        {key === 'severity' ? (
          <span className={`px-2 py-0.5 rounded text-xs ${getSeverityStyles(report[key]).badgeColor}`}>
            {String(report[key])}
          </span>
        ) : (
          typeof report[key] === 'object' && report[key] !== null ? 
            JSON.stringify(report[key]) : 
            String(report[key])
        )}
      </div>
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* <h3 className="text-lg font-medium mb-4">User Reports</h3> */}
      
      {reportsLoading ? (
        <div className="flex justify-center items-center h-32 bg-gray-50 rounded">
          <p>Loading reports...</p>
        </div>
      ) : userReports.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No reports found for this user.</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto p-1">
          {userReports.map(report => {
            const severityStyles = getSeverityStyles(report.severity);
            
            return (
              <div 
                key={report.id} 
                className={`p-4 rounded border ${severityStyles.borderColor} ${severityStyles.bgColor}`}
              >
                <div className="flex justify-between items-start">
                  <p className={`font-medium ${report.severity ? severityStyles.textColor : 'text-blue-600'}`}>
                    Report #{report.id}
                  </p>
                  {report.timestamp && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {formatTimestamp(report.timestamp)}
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-700 mt-3 space-y-1">
                  {renderReportFields(report)}
                </div>
                
                <div className="mt-4 flex items-center justify-between border-t border-gray-300 pt-4">
                    <span className="text-sm font-medium flex items-center">
                        Status: 
                        <span className={`ml-2 px-3 py-1 rounded-md text-sm font-semibold ${
                        report.status === 'pending' ? 'bg-blue-600 text-white' : 
                        report.status === 'approved' ? 'bg-green-600 text-white' : 
                        report.status === 'rejected' ? 'bg-red-600 text-white' : 
                        'bg-gray-600 text-white'
                        }`}>
                        {report.status || 'pending'}
                        </span>
                    </span>
                    
                    <div className="flex gap-3">
                        <button
                        onClick={() => handleStatusChange(report.id, 'approved')}
                        disabled={report.status === 'approved'}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            report.status === 'approved'
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-1'
                        }`}
                        >
                        Approve
                        </button>
                        <button
                        onClick={() => handleStatusChange(report.id, 'rejected')}
                        disabled={report.status === 'rejected'}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            report.status === 'rejected'
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-1'
                        }`}
                        >
                        Reject
                        </button>
                        <button
                        onClick={() => handleStatusChange(report.id, 'pending')}
                        disabled={report.status === 'pending'}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            report.status === 'pending'
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                        }`}
                        >
                        Pending
                        </button>
                        </div>
                    
                    </div>
              </div>

            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserReports;