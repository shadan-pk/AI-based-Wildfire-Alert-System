# 🔥 AI-based Wildfire Alert System

The **AI-based Wildfire Alert System** is a smart, predictive platform designed to detect and alert users about potential wildfire risks. It uses environmental conditions like temperature, humidity, and historical wildfire data to forecast the likelihood of future wildfires using a machine learning model (LightGBM).

---

## 🚀 Features

- 🌡️ Real-time analysis of temperature and humidity  
- 🧠 Predictive alerts powered by the LightGBM ML algorithm  
- 📱 React Native mobile application for user notifications  
- 📍 User live location tracking via the app to the server  
- 📊 Simulated server data (no external APIs required)  
- 🔔 Instant alerts for users in high-risk zones  
- 🖥️ User management through a dashboard  

---

## 🧠 Tech Stack

### Frontend
- [React Native (Mobile App)](https://github.com/shadan-pk/WildfireAlertApp.git)  
- Firebase (Authentication)  

### Backend
- Node.js + Express  
- MongoDB (for storing user and alert data)  
- Python (for running ML model predictions)  
- LightGBM (for wildfire prediction)  

### Data
- Simulation data generated via the Simulation page  
- Data fed into the model for wildfire prediction  
- Simulated server data for testing and prediction  
- Preloaded historical wildfire and weather pattern datasets  

---

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/shadan-pk/AI-based-Wildfire-Alert-System.git
cd AI-based-Wildfire-Alert-System
```

### 2. Install Dependencies

#### Backend

```bash
cd backend
npm install
```

#### Frontend

```bash
cd ../frontend
npm install
```

### 3. Start the System

- Run frontend server:

```bash
cd client
npm start
```

- Run backend server:

```bash
cd backend
node server.js
```

- Run React Native app using Expo or Android Studio.

---

## 🔐 Authentication

- Firebase Google Authentication enabled
- Custom registration for non-Google users

---

## 📦 Folder Structure

```
AI-based-Wildfire-Alert-System/
│
├── backend/           # Node.js + Express API
├── frontend/          # React Native App
├── ml-model/          # LightGBM Prediction Model
├── data/              # Simulated Datasets
└── README.md
```

---

## 🤖 AI Model

- **Model**: LightGBM
- **Training Data**: Environmental + Wildfire historical records
- **Output**: Wildfire Risk Score (0–1)
- **Threshold**: Alert generated if risk > 0.7

---

### 👥 Team
This project was developed as part of a university academic project.

- Shadan PK
- Yousaf P
- Mohammed Salim KV 
- Nufail Abdulla

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

🌍 Let's use technology to prevent natural disasters and save lives!
