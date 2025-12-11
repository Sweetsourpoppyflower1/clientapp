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
import AManageUsers from "./pages/master/a_manageUsers.js";

function App() {
    return (
        <Router>
            <Routes>
                {/* Authentication Routes */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/registerOptions" element={<RegisterOptions />} />
                <Route path="/registerCompany" element={<RegisterCompany />} />
                <Route path="/registerSupplier" element={<RegisterSupplier />} />
                <Route path="/login" element={<LoginUser /> } />
                <Route path="/overviewUpcomingAuctions" element={<AOverviewUpcomingAuctions /> } />
                <Route path="/auctionmasterDashboard" element={<AuctionmasterDashboard />} />
                <Route path="/aStockOverview" element={<AStockOverview />} />
                <Route path="/aCreateAuction" element={<ACreateAuction />} />
                <Route path="/cAuctions" element={<Auctions />} />
                <Route path="/auctionCalender" element={<AuctionCalender />} />
                <Route path="/supplierDashboard" element={<SupplierDashboard />} />
                <Route path="/sAddProduct" element={<SAddProduct />} />
                <Route path="/cMyOrders" element={<CMyOrders />} />
                <Route path="/companyDashboard" element={<CompanyDashboard />} />
                <Route path="/AOverviewAcceptances" element={<AOverviewAcceptances />} />
                <Route path="/aManageUsers" element={<AManageUsers />} />
                <Route path="/ActiveAuction/:id" element={<ActiveAuction /> } />
            </Routes>
        </Router>
    );
}

export default App;
