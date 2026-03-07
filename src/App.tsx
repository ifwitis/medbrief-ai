import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login'; // Add this import
import Signup from './pages/Signup';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import DocumentView from './pages/DocumentView';
import ChatPage from './pages/ChatPage';

export default function App() {
  return (
    <Router>
      <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* The Layout should wrap the protected portal routes */}
            <Route path="/patient" element={<PatientDashboard />} />
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/chat/:roomId" element={<ChatPage />} />
            <Route path="/document/:id" element={<DocumentView />} />
          </Routes>
      </Layout>
    </Router>
  );
}