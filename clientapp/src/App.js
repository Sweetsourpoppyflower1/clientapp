import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import RegisterCompany from "./pages/login_regiser/registerCompany.js";
import RegisterSupplier from "./pages/login_regiser/registerSupplier.js";
import AuctionmasterDashboard from "./pages/master/auctionmasterDashboard.js";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login_register/registerCompany" replace />} />
                <Route path="/login_register/registerCompany" element={<RegisterCompany />} />
                <Route path="/login_register/registerSupplier" element={<RegisterSupplier />} />
                <Route path="/master/auctionmasterDashboard" element={<AuctionmasterDashboard />} />
            </Routes>
        </Router>
    );
}

export default App;
