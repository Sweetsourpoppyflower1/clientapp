import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/masterPages/a_auctionLogStyle.css";
import NavigationDropdownMenu from "../../dropdown_menus/navigation_menus/master/navigation_dropdown_menu";
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";

const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");

const AuctionLog = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [auction, setAuction] = useState(null);
    const [plant, setPlant] = useState(null);
    const [lot, setLot] = useState(null);
    const [supplier, setSupplier] = useState(null);
    const [acceptances, setAcceptances] = useState([]);
    const [companiesMap, setCompaniesMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);
    const [currentPrice, setCurrentPrice] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState("00:00:00");
    const [logo, setLogo] = useState(null);

    // Helper function to get auth headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        return {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` })
        };
    };

    useEffect(() => {
        // Top logo (media id 1)
        const mediaId = 1;
        fetch(`${API_BASE}/api/Media/${mediaId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch media');
                return res.json();
            })
            .then(m => {
                const normalizedUrl = m.url && !m.url.startsWith('/') ? `/${m.url}` : m.url;
                setLogo({ url: `${API_BASE}${normalizedUrl}`, alt: m.alt_text });
            })
            .catch(() => { /* silent fallback */ });
    }, []);

    useEffect(() => {
        const fetchAuctionData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch auction details
                const auctionRes = await fetch(`${API_BASE}/api/Auctions/${id}`, {
                    credentials: "same-origin",
                    headers: getAuthHeaders()
                });
                if (!auctionRes.ok) throw new Error("Failed to fetch auction");
                const auctionData = await auctionRes.json();
                setAuction(auctionData);

                // Fetch plant details
                const plantRes = await fetch(`${API_BASE}/api/Plants/${auctionData.plant_id}`, {
                    credentials: "same-origin",
                    headers: getAuthHeaders()
                });
                if (plantRes.ok) {
                    const plantData = await plantRes.json();
                    setPlant(plantData);

                    // Fetch supplier details
                    if (plantData.supplier_id) {
                        const supplierRes = await fetch(`${API_BASE}/api/Suppliers/${plantData.supplier_id}`, {
                            credentials: "same-origin",
                            headers: getAuthHeaders()
                        });
                        if (supplierRes.ok) {
                            const supplierData = await supplierRes.json();
                            setSupplier(supplierData);
                        }
                    }
                }

                // Fetch auction lot details
                const lotsRes = await fetch(`${API_BASE}/api/AuctionLots`, {
                    credentials: "same-origin",
                    headers: getAuthHeaders()
                });
                if (lotsRes.ok) {
                    const lotsData = await lotsRes.json();
                    if (Array.isArray(lotsData)) {
                        const auctionLot = lotsData.find(l => Number(l.plant_id) === Number(auctionData.plant_id));
                        if (auctionLot) {
                            setLot(auctionLot);
                        }
                    }
                }

                // Fetch acceptances (transactions) for this auction
                const acceptancesRes = await fetch(`${API_BASE}/api/Acceptances`, {
                    credentials: "same-origin",
                    headers: getAuthHeaders()
                });
                if (acceptancesRes.ok) {
                    const allAcceptances = await acceptancesRes.json();
                    if (Array.isArray(allAcceptances)) {
                        const auctionAcceptances = allAcceptances.filter(
                            a => Number(a.auction_id) === Number(id)
                        );
                        setAcceptances(auctionAcceptances);

                        // Fetch company details for all unique company IDs
                        const uniqueCompanyIds = [...new Set(auctionAcceptances.map(a => a.company_id))];
                        const companiesMapTemp = {};

                        for (const companyId of uniqueCompanyIds) {
                            try {
                                const companyRes = await fetch(`${API_BASE}/api/Companies/${companyId}`, {
                                    credentials: "same-origin",
                                    headers: getAuthHeaders()
                                });

                                if (companyRes.ok) {
                                    const companyData = await companyRes.json();
                                    companiesMapTemp[companyId] = companyData.CompanyName || companyData.name || companyId;
                                } else if (companyRes.status === 401) {
                                    console.warn(`Unauthorized to fetch company ${companyId}`);
                                    companiesMapTemp[companyId] = companyId;
                                } else {
                                    companiesMapTemp[companyId] = companyId;
                                }
                            } catch (err) {
                                console.error(`Error fetching company ${companyId}:`, err);
                                companiesMapTemp[companyId] = companyId;
                            }
                        }

                        setCompaniesMap(companiesMapTemp);
                    }
                }
            } catch (err) {
                console.error("Error fetching auction data:", err);
                setError(err.message || "Failed to load auction data");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchAuctionData();
        }
    }, [id]);

    // Update progress bar and timer
    useEffect(() => {
        if (!auction) return;

        const updateProgress = () => {
            const effectiveStartTime = new Date(auction.effective_start_time || auction.start_time);
            const durationMs = (auction.duration_minutes || 60) * 60 * 1000;
            const now = new Date();
            const elapsed = now - effectiveStartTime;
            const remaining = Math.max(durationMs - elapsed, 0);

            const progressPercent = Math.min((elapsed / durationMs) * 100, 100);
            setProgress(progressPercent);

            // Calculate current price based on progress
            const minPrice = plant?.min_price || plant?.start_price * 0.3 || 10;
            const startPrice = plant?.start_price || 100;
            const calculatedPrice = Math.max(
                startPrice - (startPrice - minPrice) * (progressPercent / 100),
                minPrice
            );
            setCurrentPrice(calculatedPrice);

            // Format time remaining
            const h = Math.floor(remaining / 3600000);
            const m = Math.floor((remaining % 3600000) / 60000);
            const s = Math.floor((remaining % 60000) / 1000);
            setTimeRemaining(
                `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
            );
        };

        updateProgress();
        const interval = setInterval(updateProgress, 100);
        return () => clearInterval(interval);
    }, [auction, plant]);

    if (loading) {
        return (
            <div className="a-auction-log-container">
                <div className="loading">Loading auction data...</div>
            </div>
        );
    }

    if (error || !auction) {
        return (
            <div className="a-auction-log-container">
                <div className="error">
                    <p>{error || "Auction not found"}</p>
                    <button onClick={() => navigate(-1)}>Go Back</button>
                </div>
            </div>
        );
    }

    const plantName = plant?.productname || "Unknown Product";
    const supplierName = supplier?.name || supplier?.displayName || "Unknown Supplier";
    const startPrice = plant?.start_price || 100;
    const minPrice = plant?.min_price || startPrice * 0.3 || 10;

    return (
        <div className="a-auction-log-page">
            {/* Header */}
            <div className="section-top" role="region" aria-label="section-1">
                {logo ? (
                    <img src={logo.url} alt={logo.alt} className="top-logo" />
                ) : (
                    <span className="loading-label">Loading…</span>
                )}
            </div>

            {/* Progress Bar */}
            <div className="a-auction-log-progress-section">
                <div className="a-auction-log-progress-container">
                    <div className="a-auction-log-progress-bar">
                        <div
                            className="a-auction-log-progress-fill"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="a-auction-log-progress-info">
                        <div className="a-auction-log-time">Time: {timeRemaining}</div>
                        <div className="a-auction-log-price">
                            Current Price: {currentPrice.toFixed(2)}
                        </div>
                        <div className="a-auction-log-price-range">
                            <span>Start: {startPrice.toFixed(2)}</span>
                            <span>Min: {minPrice.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="a-auction-log-content">
                {/* Left Sidebar - Plant Info */}
                <aside className="a-auction-log-sidebar">
                    {/* Supplier Info Card */}
                    <div className="a-auction-log-card">
                        <div className="a-auction-log-card-title">Supplier</div>
                        <div className="a-auction-log-supplier-info">
                            <div className="a-auction-log-info-row">
                                <label>Name</label>
                                <span>{supplierName}</span>
                            </div>
                        </div>
                    </div>

                    {/* Product Info Card */}
                    <div className="a-auction-log-card">
                        <div className="a-auction-log-card-title">Product Info</div>
                        <div className="a-auction-log-product-info">
                            <div className="a-auction-log-info-row">
                                <label>Product</label>
                                <span>{plantName}</span>
                            </div>
                            <div className="a-auction-log-info-row">
                                <label>Form</label>
                                <span>{plant?.form || "—"}</span>
                            </div>
                            <div className="a-auction-log-info-row">
                                <label>Quality</label>
                                <span>{plant?.quality || "—"}</span>
                            </div>
                            <div className="a-auction-log-info-row">
                                <label>Stems / Bunch</label>
                                <span>{plant?.stems_bunch || "—"}</span>
                            </div>
                            <div className="a-auction-log-info-row">
                                <label>Min Stem Length</label>
                                <span>{plant?.min_stem || "—"} cm</span>
                            </div>
                            <div className="a-auction-log-info-row">
                                <label>Maturity</label>
                                <span>{plant?.maturity || "—"}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Right Side - Transactions Table */}
                <main className="a-auction-log-main">
                    <div className="a-auction-log-table-container">
                        <h3 className="a-auction-log-table-title">Transaction Log</h3>
                        <table className="a-auction-log-transactions-table">
                            <thead>
                                <tr>
                                    <th>Tick #</th>
                                    <th>Company</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {acceptances.length > 0 ? (
                                    acceptances.map((tx, idx) => (
                                        <tr key={idx} className={idx % 2 === 0 ? "even" : "odd"}>
                                            <td>{tx.tick_number}</td>
                                            <td>{companiesMap[tx.company_id] || "Unknown Company"}</td>
                                            <td>{tx.accepted_quantity}</td>
                                            <td>{Number(tx.accepted_price).toFixed(2)}</td>
                                            <td>{new Date(tx.time).toLocaleString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="no-data">
                                            No transactions found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>

            {/* Navigation */}
            <NavigationDropdownMenu navigateFn={(p) => navigate(p)} />
            <AccountDropdownMenu />
        </div>
    );
};

export default AuctionLog;