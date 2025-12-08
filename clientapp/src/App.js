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
import AuctionCalender from "./pages/master/a_overviewAuctionCalendar.js";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login_register/login" replace />} />
                <Route path="/login_register/registerOptions" element={<RegisterOptions />} />
                <Route path="/login_register/registerCompany" element={<RegisterCompany />} />
                <Route path="/login_register/registerSupplier" element={<RegisterSupplier />} />
                <Route path="/login_register/login" element={<LoginUser />} />
                <Route path="/master/a_overviewUpcomingAuctions" element={<AOverviewUpcomingAuctions />} />
                <Route path="/master/auctionmasterDashboard" element={<AuctionmasterDashboard />} />
                <Route path="/master/a_overviewStock" element={<AStockOverview />} />
                <Route path="/master/a_createAuction" element={<ACreateAuction />} />
                <Route path="/company/auctions" element={<Auctions />} />
                <Route path="/master/a_overviewAuctionCalendar" element={<AuctionCalender /> } />
            </Routes>
        </Router>
    );
}

export default App;
