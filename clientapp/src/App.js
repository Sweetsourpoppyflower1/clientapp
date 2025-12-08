import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import RegisterCompany from "./pages/login_regiser/registerCompany.js";
import RegisterSupplier from "./pages/login_regiser/registerSupplier.js";
import LoginUser from "./pages/login_regiser/login.js";
import AOverviewUpcomingAuctions from "./pages/master/a_overviewUpcomingAuctions.js";
import AuctionmasterDashboard from "./pages/master/auctionmasterDashboard.js";
import SupplierDashboard from "./pages/supplier/supplierDashboard.js";
import SAddProduct from "./pages/supplier/s_addProduct.js";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login_register/registerCompany" replace />} />
                <Route path="/login_register/registerCompany" element={<RegisterCompany />} />
                <Route path="/login_register/registerSupplier" element={<RegisterSupplier />} />
                <Route path="/login_register/login" element={<LoginUser /> } />
                <Route path="/master/a_overviewUpcomingAuctions" element={<AOverviewUpcomingAuctions /> } />
                <Route path="/master/auctionmasterDashboard" element={<AuctionmasterDashboard />} />
                <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
                <Route path="/supplier/addproduct" element={<SAddProduct />} />
            </Routes>
        </Router>
    );
}

export default App;
