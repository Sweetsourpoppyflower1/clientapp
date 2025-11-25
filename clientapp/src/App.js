import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/register";
import Login from "./pages/login";
import Homepage from "./pages/client/homepage";
import ActiveAuctions from "./pages/client/ActiveAuctions";
import UpcomingAuctions from "./pages/client/UpcomingAuctions"
import Navbar from "./components/Navbar";
import AuctionMasterDashboard from "./pages/master/auctionmasterDashboard";
import AuctionMasterActiveAuctions from "./pages/master/activeAuctionsMA";
import AuctionMasterUpcomingAuctions from "./pages/master/upcomingAuctionsMA";
import AuctionMasterCreateAuctions from "./pages/master/createAuctionsMA";


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
                <Route path="/auctionmasterDashboard" element={<AuctionMasterDashboard />} />
                <Route path="/activeAuctionsMA" element={<AuctionMasterActiveAuctions />} />
                <Route path="/upcomingAuctionsMA" element={<AuctionMasterUpcomingAuctions />} />
                <Route path="/createAuctionMA" element={<AuctionMasterCreateAuctions /> } />
            </Routes>
        </Router>
    );
}

export default App;
