import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/register";
import Login from "./pages/login";
import Homepage from "./pages/homepage";
import ActiveAuctions from "./pages/ActiveAuctions";
import UpcomingAuctions from "./pages/UpcomingAuctions"
import Navbar from "./components/Navbar";


function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Navigate to="/homepage" replace />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/homepage" element={<Homepage />} />
                <Route path="/ActiveAuctions" element={<ActiveAuctions />} />
                <Route path="/UpcomingAuctions" element={<UpcomingAuctions />} />
            </Routes>
        </Router>
    );
}

export default App;
