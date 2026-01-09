import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/companyPages/c_activeAuctionStyle.css';
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";
import CompanyNavigationDropdownMenu from "../../dropdown_menus/navigation_menus/company/company_navigation_dropdown_menu";
import AuctionClock from "../../components/AuctionClock";

const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
const resolveUrl = (url = "") =>
    !url ? "" : url.startsWith("http") ? url : `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;

const fetchMaybe = async (url) => {
    try {
        const r = await fetch(url, { credentials: "same-origin" });
        return r.ok ? r.json() : null;
    } catch { return null; }
};

export default function ActiveAuction() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [logo, setLogo] = useState(null);
    const [auction, setAuction] = useState(null);
    const [upcoming, setUpcoming] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeLot, setActiveLot] = useState(null);
    const [minBuy, setMinBuy] = useState(1);
    const [userAmount, setUserAmount] = useState(1);
    const [currentPrice, setCurrentPrice] = useState(0);
    const [plantImages, setPlantImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [notification, setNotification] = useState(null);
    const [timerReference, setTimerReference] = useState(null);
    const [showPriceHistory, setShowPriceHistory] = useState(false);
    const [priceHistory, setPriceHistory] = useState({ supplier: [], allSuppliers: [] });
    const [priceHistoryLoading, setPriceHistoryLoading] = useState(false);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

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
                setActiveLot(lot);

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

                // Fetch acceptance history to find the most recent one
                const acceptances = await fetchMaybe(`/api/Acceptances?auctionId=${id}`);
                let mostRecentAcceptance = null;
                if (Array.isArray(acceptances) && acceptances.length > 0) {
                    mostRecentAcceptance = acceptances.reduce((latest, current) => {
                        const latestTime = new Date(latest.time).getTime();
                        const currentTime = new Date(current.time).getTime();
                        return currentTime > latestTime ? current : latest;
                    });
                }

                // Timer reference: use acceptance time if exists, otherwise use auction start_time
                const timerRef = mostRecentAcceptance?.time || a.start_time;

                const enriched = {
                    auction_id: a.auction_id,
                    plant_id: a.plant_id,
                    productname: plant?.productname || "Unknown Product",
                    imageUrl: imageUrl || "https://via.placeholder.com/400x300?text=No+Image",
                    supplierName: supplier?.name || supplier?.displayName || "Unknown Supplier",
                    supplierId: plant?.supplier_id,
                    form: plant?.form || "-",
                    maturity: plant?.maturity || "-",
                    quality: plant?.quality || "-",
                    quantityStems: plant?.stems_bunch ? `${plant.stems_bunch} stems` : "-",
                    minStemLength: plant?.min_stem ? `${plant.min_stem} cm` : "-",
                    unitPerCont: lot?.unit_per_container || 0,
                    contInLot: lot?.remaining_quantity || 0,
                    minPickup: lot?.min_pickup || 1,
                    startPrice: plant?.start_price || 0,
                    minPrice: plant?.min_price || plant?.start_price * 0.3 || 10,
                    startTime: a.start_time,
                    durationMinutes: a.duration_minutes
                };
                
                setAuction(enriched);
                setTimerReference(timerRef);
                setMinBuy(enriched.minPickup);
                setUserAmount(enriched.minPickup);
                setCurrentPrice(enriched.startPrice);

                const allAuctions = await fetchMaybe("/api/Auctions");
                if (Array.isArray(allAuctions)) {
                     const allPlants = await fetchMaybe("/api/Plants");
                     const plantsMap = new Map();
                     if(Array.isArray(allPlants)) allPlants.forEach(p => plantsMap.set(p.plant_id, p));
                     
                     const allMedia = await fetchMaybe("/api/MediaPlant");
                     const mediaMap = new Map();
                     if(Array.isArray(allMedia)) {
                         allMedia.forEach(m => {
                             if (!mediaMap.has(m.plant_id)) {
                                 mediaMap.set(m.plant_id, []);
                             }
                             mediaMap.get(m.plant_id).push(m);
                         });
                     }
                     
                     const upcomingList = allAuctions
                        .filter(x => x.status === 'upcoming' && String(x.auction_id) !== String(id))
                        .slice(0, 10)
                        .map(x => {
                            const p = plantsMap.get(x.plant_id);
                            const plantMediaList = mediaMap.get(x.plant_id) || [];
                            
                            let imageUrl = null;
                            if (plantMediaList.length > 0) {
                                plantMediaList.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
                                imageUrl = resolveUrl(plantMediaList[0].url);
                            }
                            
                            return {
                                ...x,
                                plantName: p?.productname || "Auction Product",
                                imageUrl: imageUrl || "https://via.placeholder.com/400x300?text=No+Image"
                            };
                        });
                     setUpcoming(upcomingList);
                }

            } catch (e) {
                console.error("Failed to load auction", e);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    const handleBuy = async () => {
        if (!auction || !activeLot) return;
        
        let userData = {};
        try {
            userData = JSON.parse(localStorage.getItem("user_data") || "{}");
        } catch {}
        
        const companyId = userData.companyID || userData.companyId || userData.id || userData.Id;
        
        if (!companyId) {
            showNotification("You must be logged in as a company to purchase", "error");
            return;
        }

        if (userAmount > activeLot.remaining_quantity) {
            showNotification(`Maximum available quantity: ${activeLot.remaining_quantity}`, "error");
            return;
        }
        
        const acceptanceTime = new Date().toISOString();
        const acceptance = {
            auction_id: auction.auction_id,
            company_id: companyId,
            auction_lot_id: activeLot.auctionlot_id,
            tick_number: 0, 
            accepted_price: currentPrice,
            accepted_quantity: userAmount,
            time: acceptanceTime
        };

        try {
            const resAcc = await fetch('/api/Acceptances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(acceptance)
            });
            
            if (!resAcc.ok) {
                const txt = await resAcc.text();
                throw new Error(`Purchase failed: ${txt}`);
            }

            const updatedLot = {
                ...activeLot,
                remaining_quantity: activeLot.remaining_quantity - userAmount
            };

            const resLot = await fetch(`/api/AuctionLots/${activeLot.auctionlot_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedLot)
            });

            if (!resLot.ok) {
                throw new Error("Could not update quantity");
            }

            setActiveLot(updatedLot);
            setAuction(prev => ({ ...prev, contInLot: updatedLot.remaining_quantity }));
            
            // Update timer reference to the acceptance timestamp
            setTimerReference(acceptanceTime);
            
            showNotification(`Purchased: ${userAmount} containers for €${currentPrice.toFixed(2)}`, "success");

        } catch (err) {
            console.error(err);
            showNotification("Error during purchase: " + err.message, "error");
        }
    };

    const handlePriceHistory = async () => {
        setShowPriceHistory(true);
        setPriceHistoryLoading(true);
        try {
            const plantId = auction.plant_id;
            const supplierId = auction.supplierId;

            // Fetch supplier-specific price history
            const supplierHistory = await fetchMaybe(`/api/PriceHistory?plantId=${plantId}&supplierId=${supplierId}&limit=10`);
            
            // Fetch all suppliers price history for same plant
            const allHistory = await fetchMaybe(`/api/PriceHistory?plantId=${plantId}&limit=10`);

            setPriceHistory({
                supplier: Array.isArray(supplierHistory) ? supplierHistory : [],
                allSuppliers: Array.isArray(allHistory) ? allHistory : []
            });
        } catch (e) {
            console.error("Failed to load price history", e);
            setPriceHistory({ supplier: [], allSuppliers: [] });
        } finally {
            setPriceHistoryLoading(false);
        }
    };

    const closePriceHistory = () => {
        setShowPriceHistory(false);
    };

    // Guard clauses FIRST
    if (loading) return <div className="c-aa-loading">Loading...</div>;
    if (!auction) return <div className="c-aa-loading">Auction not found or invalid ID</div>;

    // Calculate timer based on timerReference (either start_time or acceptance time)
    const durationMs = (auction.durationMinutes || 60) * 60 * 1000;
    const now = new Date();
    const timerStartTime = timerReference ? new Date(timerReference) : new Date(auction.startTime);
    const hasStarted = now >= timerStartTime;
    const timeUntilStart = hasStarted ? 0 : timerStartTime.getTime() - now.getTime();

    // Single return statement
    return (
        <div className="c-aa-page">
            {notification && (
                <div className={`c-aa-notification ${notification.type}`}>
                    <span className="notification-icon">
                        {notification.type === 'success' ? '✓' : '✕'}
                    </span>
                    <span className="notification-message">{notification.message}</span>
                    <button className="notification-close" onClick={() => setNotification(null)}>×</button>
                </div>
            )}

            {/* Price History Modal */}
            {showPriceHistory && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '30px',
                        maxWidth: '900px',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        position: 'relative'
                    }}>
                        <button
                            onClick={closePriceHistory}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'none',
                                border: 'none',
                                fontSize: '28px',
                                cursor: 'pointer',
                                color: '#666'
                            }}
                        >
                            ×
                        </button>

                        <h2 style={{ marginTop: 0, marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                            Price History
                        </h2>

                        {priceHistoryLoading ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}>Loading price history...</div>
                        ) : (
                            <div style={{ display: 'flex', gap: '30px' }}>
                                {/* Supplier Specific History */}
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ marginTop: 0, fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>
                                        {auction.supplierName.toUpperCase()} (Last 10)
                                    </h3>
                                    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #ddd' }}>
                                                <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: '600' }}>Date</th>
                                                <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: '600' }}>Old Price</th>
                                                <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: '600' }}>New Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {priceHistory.supplier.length > 0 ? (
                                                priceHistory.supplier.map((item, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                        <td style={{ padding: '8px 0' }}>
                                                            {item.date ? new Date(item.date).toLocaleDateString() : '-'}
                                                        </td>
                                                        <td style={{ textAlign: 'right', padding: '8px 0' }}>
                                                            €{item.old_price?.toFixed(2) || '-'}
                                                        </td>
                                                        <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: '600' }}>
                                                            €{item.new_price?.toFixed(2) || '-'}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="3" style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
                                                        No price history available
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                    {priceHistory.supplier.length > 0 && (
                                        <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '12px', textAlign: 'center' }}>
                                            Avg: €{(priceHistory.supplier.reduce((sum, item) => sum + (item.new_price || 0), 0) / priceHistory.supplier.length).toFixed(2)}
                                        </div>
                                    )}
                                </div>

                                {/* All Suppliers History */}
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ marginTop: 0, fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', color: '#666' }}>
                                        All Suppliers (Last 10)
                                    </h3>
                                    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #ddd' }}>
                                                <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: '600' }}>Product</th>
                                                <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: '600' }}>Date</th>
                                                <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: '600' }}>Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {priceHistory.allSuppliers.length > 0 ? (
                                                priceHistory.allSuppliers.map((item, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                        <td style={{ padding: '8px 0' }}>{item.product_name || '-'}</td>
                                                        <td style={{ padding: '8px 0' }}>
                                                            {item.date ? new Date(item.date).toLocaleDateString() : '-'}
                                                        </td>
                                                        <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: '600' }}>
                                                            €{item.price?.toFixed(2) || '-'}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="3" style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
                                                        No price history available
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                    {priceHistory.allSuppliers.length > 0 && (
                                        <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '12px', textAlign: 'center' }}>
                                            Avg: €{(priceHistory.allSuppliers.reduce((sum, item) => sum + (item.price || 0), 0) / priceHistory.allSuppliers.length).toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <header className="c-aa-topbar">
                <div className="c-aa-logo-section">
                    {logo ? <img src={logo.url} alt={logo.alt} className="c-aa-top-logo" /> : <span className="c-aa-loading-label">Loading</span>}
                </div>
            </header>

            <main className="c-aa-main">
                <div className="c-aa-card c-aa-left-panel">
                    <div className="c-aa-img-container" style={{position: 'relative'}}>
                        <img src={plantImages[currentImageIndex]} alt={auction.productname} className="c-aa-product-img" />
                        {plantImages.length > 1 && (
                            <>
                                <button 
                                    className="c-aa-img-nav-btn left" 
                                    onClick={() => setCurrentImageIndex((prev) => (prev - 1 + plantImages.length) % plantImages.length)}
                                    style={{position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '20px'}}>
                                    &lt;
                                </button>
                                <button 
                                    className="c-aa-img-nav-btn right" 
                                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % plantImages.length)}
                                    style={{position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '20px'}}>
                                    &gt;
                                </button>
                                <div style={{position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '5px 10px', borderRadius: '10px', fontSize: '12px'}}>
                                    {currentImageIndex + 1} / {plantImages.length}
                                </div>
                            </>
                        )}
                    </div>
                    
                    <div className="c-aa-buy-controls">
                        <label className="c-aa-label-bold">How many containers do you want to buy?</label>
                        <div className="c-aa-slider-container">
                             <input 
                                type="range" 
                                min={minBuy} 
                                max={auction.contInLot} 
                                value={userAmount} 
                                onChange={e => setUserAmount(Number(e.target.value))} 
                                className="c-aa-range" 
                             />
                        </div>
                        
                        <div className="c-aa-input-row">
                            <div className="c-aa-input-group">
                                <label>Minimum to buy</label>
                                <div className="c-aa-input-box">{minBuy}</div>
                            </div>
                            <div className="c-aa-input-group">
                                <label>Your amount:</label>
                                <div className="c-aa-input-box">{userAmount}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="c-aa-clock-panel">
                    {!hasStarted ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                            Auction starts in {Math.ceil(timeUntilStart / 1000)} seconds
                        </div>
                    ) : (
                        <AuctionClock
                            startPrice={auction.startPrice}
                            minPrice={auction.minPrice}
                            durationMs={durationMs}
                            onPriceUpdate={(price) => setCurrentPrice(price)}
                            timerReference={timerStartTime}
                        />
                    )}
                    
                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <div className="c-aa-info-box" style={{ display: 'inline-block', margin: '10px' }}>
                            <span className="c-aa-box-label">Unit / cont.</span>
                            <span className="c-aa-box-val">{auction.unitPerCont}</span>
                        </div>
                        <div className="c-aa-info-box" style={{ display: 'inline-block', margin: '10px' }}>
                            <span className="c-aa-box-label">Available in lot</span>
                            <span className="c-aa-box-val">{auction.contInLot}</span>
                        </div>
                    </div>
                    
                    <button className="c-aa-buy-btn" onClick={handleBuy}>BUY</button>
                    <button 
                        className="c-aa-history-btn" 
                        onClick={handlePriceHistory}
                        style={{
                            marginTop: '10px',
                            padding: '10px 20px',
                            backgroundColor: '#f0f0f0',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            width: '100%',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#e0e0e0';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#f0f0f0';
                        }}
                    >
                        Price History
                    </button>
                </div>

                <div className="c-aa-card c-aa-details-panel">
                     <div className="c-aa-detail-group">
                         <label>Product Name:</label>
                         <div className="c-aa-detail-val box-white">{auction.productname}</div>
                     </div>
                     <div className="c-aa-detail-group">
                         <label>Supplier:</label>
                         <div className="c-aa-detail-val box-white">{auction.supplierName}</div>
                     </div>
                     <div className="c-aa-detail-group">
                         <label>Form:</label>
                         <div className="c-aa-detail-val box-white highlight-border">{auction.form}</div>
                     </div>
                     <div className="c-aa-detail-group">
                         <label>Maturity:</label>
                         <div className="c-aa-detail-val box-white">{auction.maturity}</div>
                     </div>
                     <div className="c-aa-row">
                         <div className="c-aa-detail-group half">
                             <label>Quality:</label>
                             <div className="c-aa-detail-val box-white">{auction.quality}</div>
                         </div>
                         <div className="c-aa-detail-group half">
                             <label>Quantity Stems per Unit:</label>
                             <div className="c-aa-detail-val box-white">{auction.quantityStems}</div>
                         </div>
                     </div>
                     <div className="c-aa-detail-group">
                         <label>Min Stem Length:</label>
                         <div className="c-aa-detail-val box-white">{auction.minStemLength}</div>
                     </div>
                </div>
            </main>

            <section className="c-aa-upcoming">
                <h2 className="c-aa-section-title">upcoming auctions</h2>
                <div className="c-aa-carousel">
                    <button className="c-aa-nav-btn left">{ '<' }</button>
                    
                    <div className="c-aa-cards-row">
                        {upcoming.length > 0 ? upcoming.map((mk, i) => (
                             <div className="c-aa-upcoming-card" key={i}>
                                 <div className="c-aa-uc-img">
                                     <img src={mk.imageUrl} alt={mk.plantName} />
                                 </div>
                                 <div className="c-aa-uc-details">
                                     <div className="c-aa-detail-group">
                                         <label>Product Name:</label>
                                         <div className="c-aa-detail-val box-white">{mk.plantName}</div>
                                     </div>
                                     <div className="c-aa-detail-group">
                                         <label>Starts at:</label>
                                         <div className="c-aa-detail-val box-white">{mk.start_time ? new Date(mk.start_time).toLocaleString() : "TBD"}</div>
                                     </div>
                                 </div>
                             </div>
                        )) : (
                            <div className="c-aa-upcoming-card empty">
                                <div style={{padding:20}}>No upcoming auctions</div>
                            </div>
                        )}
                    </div>
                    
                    <button className="c-aa-nav-btn right">{ '>' }</button>
                </div>
            </section>
            
            <CompanyNavigationDropdownMenu navigateFn={(path) => navigate(path)} />
            <AccountDropdownMenu />
        </div>
    );
}