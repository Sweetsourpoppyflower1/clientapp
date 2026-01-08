import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/companyPages/c_seeInfoAuctionStyle.css';
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";
import CompanyNavigationDropdownMenu from "../../dropdown_menus/navigation_menus/company/company_navigation_dropdown_menu";

const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
const resolveUrl = (url = "") =>
    !url ? "" : url.startsWith("http") ? url : `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;

const fetchMaybe = async (url) => {
    try {
        const r = await fetch(url, { credentials: "same-origin" });
        return r.ok ? r.json() : null;
    } catch { return null; }
};

export default function SeeInfoAuction() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [logo, setLogo] = useState(null);
    const [auction, setAuction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [plantImages, setPlantImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [priceHistory, setPriceHistory] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        const mediaId = 1;
        fetch(`/api/Media/${mediaId}`)
            .then(res => res.ok ? res.json() : null)
            .then(m => {
                if(m) {
                    const normalizedUrl = m.url && !m.url.startsWith('/') ? `/${m.url}` : m.url;
                    setLogo({ url: normalizedUrl, alt: m.alt_text });
                }
            })
            .catch(() => {});
        
        const load = async () => {
            setLoading(true);
            try {
                const a = await fetchMaybe(`/api/Auctions/${id}`);
                if (!a) {
                    setAuction(null); 
                    setLoading(false);
                    return; 
                }

                const plant = await fetchMaybe(`/api/Plants/${a.plant_id}`);
                
                let supplier = null;
                if (plant && plant.supplier_id) {
                     supplier = await fetchMaybe(`/api/Suppliers/${plant.supplier_id}`);
                }

                const lots = await fetchMaybe(`/api/AuctionLots`);
                let lot = null;
                if (Array.isArray(lots)) {
                    lot = lots.find(l => Number(l.plant_id) === Number(a.plant_id)); 
                }

                const mediaAll = await fetchMaybe("/api/MediaPlant");
                let images = [];
                let imageUrl = null;
                if (Array.isArray(mediaAll)) {
                     const plantMedia = mediaAll.filter(m => Number(m.plant_id) === Number(a.plant_id));
                     if (plantMedia.length > 0) {
                         plantMedia.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
                         images = plantMedia.map(m => resolveUrl(m.url)).filter(Boolean);
                         imageUrl = images[0];
                     }
                }
                setPlantImages(images.length > 0 ? images : ["https://via.placeholder.com/400x300?text=No+Image"]);

                const enriched = {
                    auction_id: a.auction_id,
                    plant_id: a.plant_id,
                    productname: plant?.productname || "Unknown Product",
                    description: plant?.desc || "No description available",
                    imageUrl: imageUrl || "https://via.placeholder.com/400x300?text=No+Image",
                    supplierName: supplier?.name || supplier?.displayName || "Unknown Supplier",
                    supplierEmail: supplier?.email || "-",
                    supplierPhone: supplier?.phone || supplier?.phoneNumber || "-",
                    form: plant?.form || "-",
                    maturity: plant?.maturity || "-",
                    quality: plant?.quality || "-",
                    category: plant?.category || "-",
                    quantityStems: plant?.stems_bunch ? `${plant.stems_bunch}` : "-",
                    minStemLength: plant?.min_stem ? `${plant.min_stem}` : "-",
                    startPrice: plant?.start_price || 0,
                    minPrice: plant?.min_price || 0,
                    startTime: a.start_time,
                    endTime: a.end_time
                };
                
                setAuction(enriched);
                await fetchPriceHistoryData(a.plant_id, enriched.supplierName);

            } catch (e) {
                console.error("Failed to load auction", e);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    const fetchPriceHistoryData = async (plantId, supplierName) => {
        if (!plantId) return;
        
        setLoadingHistory(true);
        try {
            const response = await fetch(`/api/PriceHistory/plant/${plantId}`);
            if (response.ok) {
                const data = await response.json();
                setPriceHistory({ ...data, supplierName });
            }
        } catch (error) {
            console.error("Failed to fetch price history", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    if (loading) return <div className="sia-loading">Loading...</div>;
    if (!auction) return <div className="sia-loading">Auction not found or invalid ID</div>;

    return (
        <div className="sia-page">
            <header className="sia-topbar">
                <div className="sia-logo-section">
                    {logo ? <img src={logo.url} alt={logo.alt} className="sia-top-logo" /> : <span className="sia-loading-label">Loading</span>}
                </div>
            </header>

            <main className="sia-main">
                <div className="sia-wrapper">
                    {/* Main Product Card - Left Side */}
                    <div className="sia-info-card">
                        {/* Header Section */}
                        <div className="sia-header">
                            <div className="sia-header-left">
                                <h1 className="sia-title">{auction.productname}</h1>
                                <div className="sia-supplier-info">
                                    <span className="sia-supplier-label">Supplier:</span>
                                    <span className="sia-supplier-name">{auction.supplierName}</span>
                                </div>
                            </div>
                            <div className="sia-header-right">
                                <div className="sia-price-display">
                                    <div className="sia-time">Starts: {new Date(auction.startTime).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="sia-content">
                            {/* Image Gallery on the left */}
                            <div className="sia-image-section">
                                <div className="sia-img-container">
                                    <img src={plantImages[currentImageIndex]} alt={auction.productname} className="sia-product-img" />
                                    {plantImages.length > 1 && (
                                        <>
                                            <button 
                                                className="sia-img-nav-btn left" 
                                                onClick={() => setCurrentImageIndex((prev) => (prev - 1 + plantImages.length) % plantImages.length)}
                                                aria-label="Previous image"
                                            >
                                                &lt;
                                            </button>
                                            <button 
                                                className="sia-img-nav-btn right" 
                                                onClick={() => setCurrentImageIndex((prev) => (prev + 1) % plantImages.length)}
                                                aria-label="Next image"
                                            >
                                                &gt;
                                            </button>
                                            <div className="sia-img-counter">
                                                {currentImageIndex + 1} / {plantImages.length}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Details Grid on the right */}
                            <div className="sia-details-section">
                                <div className="sia-details-grid">
                                    <div className="sia-detail-item">
                                        <span className="sia-label">Category:</span>
                                        <span className="sia-value">{auction.category}</span>
                                    </div>
                                    <div className="sia-detail-item">
                                        <span className="sia-label">Form:</span>
                                        <span className="sia-value">{auction.form}</span>
                                    </div>

                                    <div className="sia-detail-item">
                                        <span className="sia-label">Quality:</span>
                                        <span className="sia-value">{auction.quality}</span>
                                    </div>
                                    <div className="sia-detail-item">
                                        <span className="sia-label">Stems/Bunch:</span>
                                        <span className="sia-value">{auction.quantityStems}</span>
                                    </div>

                                    <div className="sia-detail-item">
                                        <span className="sia-label">Min Stems:</span>
                                        <span className="sia-value">{auction.minStemLength}</span>
                                    </div>
                                    <div className="sia-detail-item">
                                        <span className="sia-label">Maturity:</span>
                                        <span className="sia-value">{auction.maturity}</span>
                                    </div>

                                    <div className="sia-detail-item">
                                        <span className="sia-label">Min Price:</span>
                                        <span className="sia-value">€{(auction.minPrice || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="sia-detail-item">
                                        <span className="sia-label">Start Price:</span>
                                        <span className="sia-value">€{(auction.startPrice || 0).toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Description Box */}
                                <div className="sia-description-box">
                                    <div className="sia-description">{auction.description}</div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="sia-actions">
                            <button 
                                className="sia-btn sia-btn-primary"
                                onClick={() => navigate(`/ActiveAuction/${auction.auction_id}`)}
                            >
                                Go to auction
                            </button>
                            <button 
                                className="sia-btn sia-btn-secondary"
                                onClick={() => navigate(-1)}
                            >
                                Back
                            </button>
                        </div>
                    </div>

                    {/* Price History Card - Right Side */}
                    {priceHistory && (
                        <div className="sia-price-history-card">
                            <h2 className="sia-history-title">Price History</h2>
                            
                            {loadingHistory && <div className="sia-history-loading">Loading...</div>}
                            
                            {!loadingHistory && (
                                <div className="sia-history-content">
                                    {/* Supplier Section */}
                                    <div className="sia-supplier-section">
                                        <h4 className="sia-supplier-section-title">Supplier: {auction.supplierName} (Last 10)</h4>
                                        <div className="sia-history-table-wrapper">
                                            <table className="sia-history-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Old Price</th>
                                                        <th>New Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {priceHistory.currentSupplierHistory?.length > 0 ? (
                                                        priceHistory.currentSupplierHistory.map((entry, idx) => (
                                                            <tr key={idx} className={idx % 2 === 0 ? 'sia-history-row-even' : 'sia-history-row-odd'}>
                                                                <td className="sia-history-date">{entry.date}</td>
                                                                <td className="sia-history-price">€{Number(entry.old_start_price || 0).toFixed(2)}</td>
                                                                <td className="sia-history-price">€{Number(entry.new_start_price || 0).toFixed(2)}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr><td colSpan="3" style={{ textAlign: 'center', color: '#999', padding: '10px' }}>No data</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                        <p className="sia-average-price">
                                            Avg: €{Number(priceHistory.currentSupplierAverage || 0).toFixed(2)}
                                        </p>
                                    </div>

                                    {/* All Suppliers Section */}
                                    <div className="sia-supplier-section">
                                        <h4 className="sia-supplier-section-title">All Suppliers (Last 10)</h4>
                                        <div className="sia-history-table-wrapper">
                                            <table className="sia-history-table">
                                                <thead>
                                                    <tr>
                                                        <th>Product</th>
                                                        <th>Supplier</th>
                                                        <th>Date</th>
                                                        <th>Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {priceHistory.allSuppliersHistory?.length > 0 ? (
                                                        priceHistory.allSuppliersHistory.map((entry, idx) => (
                                                            <tr key={idx} className={idx % 2 === 0 ? 'sia-history-row-even' : 'sia-history-row-odd'}>
                                                                <td>{entry.productName}</td>
                                                                <td>{entry.supplierName || "Unknown Supplier"}</td>
                                                                <td className="sia-history-date">{entry.date}</td>
                                                                <td className="sia-history-price">€{Number(entry.price || 0).toFixed(2)}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr><td colSpan="4" style={{ textAlign: 'center', color: '#999', padding: '10px' }}>No data</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                        <p className="sia-average-price">
                                            Avg: €{Number(priceHistory.allSuppliersAverage || 0).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <CompanyNavigationDropdownMenu navigateFn={(path) => navigate(path)} />
            <AccountDropdownMenu />
        </div>
    );
}