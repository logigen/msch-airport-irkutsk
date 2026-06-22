import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import { colors } from './theme';
import Home from './pages/Home';
import Doctors from './pages/Doctors';
import DoctorProfile from './pages/DoctorProfile';
import Booking from './pages/Booking';
import Auth from './pages/Auth';
import Cabinet from './pages/Cabinet';
import AdminPanel from './pages/AdminPanel';
import DoctorCabinet from './pages/DoctorCabinet';
import About from './pages/About';
import Services from './pages/Services';

const App = () => (
  <BrowserRouter>
    <div style={{ background: colors.pageBg, minHeight: '100vh' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:id" element={<DoctorProfile />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/doctor-cabinet" element={
          <PrivateRoute roles={['doctor']}><DoctorCabinet /></PrivateRoute>
        } />
        <Route path="/admin" element={
          <PrivateRoute roles={['admin']}><AdminPanel /></PrivateRoute>
        } />
        <Route path="/booking/:slotId" element={
          <PrivateRoute roles={['patient']}><Booking /></PrivateRoute>
        } />
        <Route path="/cabinet" element={
          <PrivateRoute roles={['patient']}><Cabinet /></PrivateRoute>
        } />
      </Routes>
    </div>
  </BrowserRouter>
);

export default App;
