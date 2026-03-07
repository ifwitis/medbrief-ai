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
          {/* Wrap these in your Layout component */}
          <Route path="/patient" element={<Layout><PatientDashboard /></Layout>} />
          <Route path="/doctor" element={<Layout><DoctorDashboard /></Layout>} />
          <Route path="/chat/:roomId" element={<Layout><ChatPage /></Layout>} />
          <Route path="/document/:id" element={<Layout><DocumentView /></Layout>} />
        </Routes>
      </Layout>
    </Router>
  );
}