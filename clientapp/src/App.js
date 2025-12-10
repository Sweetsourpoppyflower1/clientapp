import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import RegisterOptions from "./pages/login_regiser/registerOptions.js";
import RegisterCompany from "./pages/login_regiser/registerCompany.js";
import RegisterSupplier from "./pages/login_regiser/registerSupplier.js";
import LoginUser from "./pages/login_regiser/login.js";
import AOverviewUpcomingAuctions from "./pages/master/a_overviewUpcomingAuctions.js";
import AuctionmasterDashboard from "./pages/master/auctionmasterDashboard.js";
import AStockOverview from "./pages/master/a_stockOverview.js";
import ACreateAuction from "./pages/master/a_createAuction.js";
import Auctions from "./pages/company/c_auctions.js"
import ActiveAuction from "./pages/company/c_activeAuction.js";
import AuctionCalender from "./pages/master/a_overviewAuctionCalendar.js";
import SupplierDashboard from "./pages/supplier/supplierDashboard.js";
import SAddProduct from "./pages/supplier/s_addProduct.js";
import CMyOrders from "./pages/company/c_myOrders.js";
import CompanyDashboard from "./pages/company/companyDashboard.js";
import AOverviewAcceptances from "./pages/master/a_overviewAcceptances.js";

function App() {
    return (
        <Router>
            <Routes>
                {/* Authentication Routes */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginUser />} />
                <Route path="/login_regiser/login" element={<LoginUser />} />
                <Route path="/login_register/registerOptions" element={<RegisterOptions />} />
                <Route path="/login_register/registerCompany" element={<RegisterCompany />} />
                <Route path="/login_register/registerSupplier" element={<RegisterSupplier />} />

                {/* Master Routes */}
                <Route path="/master/auctionmasterDashboard" element={<AuctionmasterDashboard />} />
                <Route path="/master/a_createAuction" element={<ACreateAuction />} />
                <Route path="/master/a_createauction" element={<ACreateAuction />} />
                <Route path="/master/a_overviewAuctionCalendar" element={<AuctionCalender />} />
                <Route path="/master/a_overviewStock" element={<AStockOverview />} />
                <Route path="/master/a_overviewAcceptances" element={<AOverviewAcceptances />} />
                <Route path="/master/a_overviewUpcomingAuctions" element={<AOverviewUpcomingAuctions />} />

                {/* Supplier Routes */}
                <Route path="/supplier/supplierDashboard" element={<SupplierDashboard />} />
                <Route path="/supplier/s_addProduct" element={<SAddProduct />} />

                {/* Company Routes */}
                <Route path="/company/companyDashboard" element={<CompanyDashboard />} />
                <Route path="/company/dashboard" element={<CompanyDashboard />} />
                <Route path="/company/auctions" element={<Auctions />} />
                <Route path="/company/auction/:id" element={<ActiveAuction />} />
                <Route path="/company/auctions/:id" element={<ActiveAuction />} />
                <Route path="/company/c_myOrders" element={<CMyOrders />} />
                <Route path="/company/myOrders" element={<CMyOrders />} />
            </Routes>
        </Router>
    );
}

export default App;
