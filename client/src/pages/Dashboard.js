import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [alertUserId, setAlertUserId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/active-users`);
        setUsers(res.data);
      } catch (error) {
        console.error('Error fetching active users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleSendAlert = async (userId) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/send-alert`, {
        userId,
        message,
      });
      setAlertUserId(null);
      setMessage('');
      alert('Alert sent successfully!');
    } catch (error) {
      console.error('Error sending alert:', error);
      alert('Failed to send alert.');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>User Dashboard</h1>
      <h2 style={styles.subHeader}>Active Users</h2>
      {users.length === 0 ? (
        <p style={styles.noData}>No active users found.</p>
      ) : (
        <ul style={styles.userList}>
          {users.map((user) => (
            <li key={user.id} style={styles.userItem}>
              <p style={styles.text}>Name: {user.name || 'N/A'}</p>
              <p style={styles.text}>Email: {user.email || 'N/A'}</p>
              <button
                onClick={() => setAlertUserId(user.id)}
                style={styles.button}
              >
                Send Alert
              </button>
            </li>
          ))}
        </ul>
      )}
      {alertUserId && (
        <div style={styles.alertBox}>
          <h3 style={styles.alertHeader}>Send Alert to User</h3>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter alert message"
            style={styles.textarea}
          />
          <div style={styles.buttonGroup}>
            <button
              onClick={() => handleSendAlert(alertUserId)}
              style={styles.sendButton}
            >
              Send
            </button>
            <button
              onClick={() => {
                setAlertUserId(null);
                setMessage('');
              }}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
  },
  header: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
    textAlign: 'center',
  },
  subHeader: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '15px',
  },
  noData: {
    fontSize: '16px',
    color: '#666',
    textAlign: 'center',
  },
  userList: {
    listStyle: 'none',
    padding: 0,
  },
  userItem: {
    marginBottom: '15px',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  text: {
    fontSize: '14px',
    color: '#666',
    margin: '5px 0',
  },
  button: {
    padding: '8px 16px',
    fontSize: '14px',
    color: '#fff',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  alertBox: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  alertHeader: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px',
  },
  textarea: {
    width: '100%',
    height: '100px',
    padding: '10px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    resize: 'vertical',
    marginBottom: '10px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
  },
  sendButton: {
    padding: '8px 16px',
    fontSize: '14px',
    color: '#fff',
    backgroundColor: '#28a745',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '8px 16px',
    fontSize: '14px',
    color: '#fff',
    backgroundColor: '#dc3545',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default Dashboard;