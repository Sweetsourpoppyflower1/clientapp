import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/companyPages/c_activeAuctionStyle.css';
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";
import CompanyNavigationDropdownMenu from "../../dropdown_menus/navigation_menus/company/company_navigation_dropdown_menu";
import AuctionClock from "../../components/AuctionClock";
import { API_BASE } from '../../config/api';

const resolveUrl = (url = "") =>
    !url ? "" : url.startsWith("http") ? url : `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;

const fetchMaybe = async (url) => {
    try {
        const r = await fetch(url, { credentials: "same-origin" });
        return r.ok ? r.json() : null;
    } catch { return null; }
};

const parseUtcDate = (s) => {
    if (!s) return null;
    if (/(?:Z|[+\-]\d{2}:\d{2})$/i.test(s)) return new Date(s);
    return new Date(s);  
};

const parseLocalDateTime = (s) => {
    if (!s) return Date.now();
    const d = new Date(s);
    return isNaN(d.getTime()) ? Date.now() : d.getTime();
};

// Pagina voor een actieve veiling waar bedrijven kunnen bieden op producten
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
    const [notificationPersist, setNotificationPersist] = useState(false);
    const [timerReference, setTimerReference] = useState(null);
    const [durationMinutes, setDurationMinutes] = useState(60);
    const [showPriceHistory, setShowPriceHistory] = useState(false);
    const [priceHistory, setPriceHistory] = useState({
        plantName: null,
        currentSupplierName: null,
        currentSupplierHistory: [],
        currentSupplierAverage: 0,
        allSuppliersHistory: [],
        allSuppliersAverage: 0
    });
    const [priceHistoryLoading, setPriceHistoryLoading] = useState(false);
    const [secondsUntilStart, setSecondsUntilStart] = useState(0);

    // Toon een melding aan de gebruiker, bijvoorbeeld succes of fout
    const showNotification = (message, type = 'success', persist = false) => {
        setNotification({ message, type });
        setNotificationPersist(persist);
        if (!persist) {
            setTimeout(() => setNotification(null), 4000);
        }
    };

    // Opruimen van oude timer gegevens uit lokale opslag
    useEffect(() => {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('auction_timer_')) {
                localStorage.removeItem(key);
            }
        });

        const mediaId = 1;
        fetch(`${API_BASE}/api/Media/${mediaId}`)
            .then(res => res.ok ? res.json() : null)
            .then(m => {
                if(m) {
                    const normalizedUrl = m.url && !m.url.startsWith('/') ? `/${m.url}` : m.url;
                    setLogo({ url: `${API_BASE}${normalizedUrl}`, alt: m.alt_text });
                }
            })
            .catch(() => {});
        
        // Laad alle benodigde gegevens voor de veiling: plant, leverancier, loten, afbeeldingen, etc.
        const load = async () => {
            setLoading(true);
            try {
                const aData = await fetchMaybe(`${API_BASE}/api/Auctions/${id}`);
                if (!aData) {
                    setAuction(null);
                    return;
                }

                const effectiveStartTime = aData.effective_start_time;
                const durationMinutes = aData.duration_minutes;

                const plant = await fetchMaybe(`${API_BASE}/api/Plants/${aData.plant_id}`);

                let supplier = null;
                if (plant?.supplier_id) {
                    supplier = await fetchMaybe(`${API_BASE}/api/Suppliers/${plant.supplier_id}`);
                }

                const lots = await fetchMaybe(`${API_BASE}/api/AuctionLots`);
                const lot = Array.isArray(lots)
                    ? lots.find(l => Number(l.plant_id) === Number(aData.plant_id))
                    : null;

                setActiveLot(lot);

                const mediaAll = await fetchMaybe(`${API_BASE}/api/MediaPlant`);
                let images = [];
                let imageUrl = null;

                if (Array.isArray(mediaAll)) {
                    const plantMedia = mediaAll.filter(
                        m => Number(m.plant_id) === Number(aData.plant_id)
                    );
                    if (plantMedia.length > 0) {
                        plantMedia.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
                        images = plantMedia.map(m => resolveUrl(m.url)).filter(Boolean);
                        imageUrl = images[0];
                    }
                }

                setPlantImages(
                    images.length > 0
                        ? images
                        : ["https://via.placeholder.com/400x300?text=No+Image"]
                );


                const enriched = {
                    auction_id: aData.auction_id,
                    plant_id: aData.plant_id,
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

                    effectiveStartTime,
                    durationMinutes,
                    start_time: aData.start_time
                };

                setAuction(enriched);
                setMinBuy(enriched.minPickup);
                setUserAmount(enriched.minPickup);
                setCurrentPrice(enriched.startPrice);

                const allAuctions = await fetchMaybe(`${API_BASE}/api/Auctions`);
                if (Array.isArray(allAuctions)) {
                    const allPlants = await fetchMaybe(`${API_BASE}/api/Plants`);
                    const plantsMap = new Map();
                    if (Array.isArray(allPlants)) {
                        allPlants.forEach(p => plantsMap.set(p.plant_id, p));
                    }

                    const allMedia = await fetchMaybe(`${API_BASE}/api/MediaPlant`);
                    const mediaMap = new Map();
                    if (Array.isArray(allMedia)) {
                        allMedia.forEach(m => {
                            if (!mediaMap.has(m.plant_id)) {
                                mediaMap.set(m.plant_id, []);
                            }
                            mediaMap.get(m.plant_id).push(m);
                        });
                    }

                    const upcomingList = allAuctions
                        .filter(x => x.status === "upcoming" && String(x.auction_id) !== String(id))
                        .slice(0, 10)
                        .map(x => {
                            const p = plantsMap.get(x.plant_id);
                            const plantMediaList = mediaMap.get(x.plant_id) || [];

                            let img = null;
                            if (plantMediaList.length > 0) {
                                plantMediaList.sort(
                                    (a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)
                                );
                                img = resolveUrl(plantMediaList[0].url);
                            }

                            return {
                                ...x,
                                plantName: p?.productname || "Auction Product",
                                imageUrl: img || "https://via.placeholder.com/400x300?text=No+Image"
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

    // Start een countdown timer voor wanneer de veiling begint
    useEffect(() => {
        if (!auction) return;

        const timerStartTime = new Date(auction.effectiveStartTime);

        const updateCountdown = () => {
            const now = Date.now();
            const remaining = Math.max(timerStartTime.getTime() - now, 0);
            setSecondsUntilStart(Math.ceil(remaining / 1000));
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [auction?.effectiveStartTime]);

    // Verwerk het kopen van een hoeveelheid containers in de veiling
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
        
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ms = String(now.getMilliseconds()).padStart(3, '0');
        const acceptanceTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`;
        
        const totalAmount = currentPrice * userAmount;
        
        const acceptance = {
            auction_id: auction.auction_id,
            company_id: companyId,
            auction_lot_id: activeLot.auctionlot_id,
            tick_number: 0, 
            accepted_price: totalAmount,
            accepted_quantity: userAmount,
            time: acceptanceTime
        };

        try {
            // Verstuur de aankoop naar de server
            const resAcc = await fetch(`${API_BASE}/api/Acceptances`, {
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

            const resLot = await fetch(`${API_BASE}/api/AuctionLots/${activeLot.auctionlot_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedLot)
            });

            if (!resLot.ok) {
                throw new Error("Could not update quantity");
            }

            const successMessage = `Purchased: ${userAmount} containers for €${totalAmount.toFixed(2)}`;
            showNotification(successMessage, "success", true);

            // Na een korte wachttijd, vernieuw de veiling gegevens om de interface bij te werken
            setTimeout(async () => {
                try {
                    const freshData = await fetchMaybe(`${API_BASE}/api/Auctions/${id}`);
                    if (freshData) {
                        const updatedAuction = {
                            auction_id: freshData.auction_id,
                            plant_id: auction.plant_id,
                            productname: auction.productname,
                            imageUrl: auction.imageUrl,
                            supplierName: auction.supplierName,
                            supplierId: auction.supplierId,
                            form: auction.form,
                            maturity: auction.maturity,
                            quality: auction.quality,
                            quantityStems: auction.quantityStems,
                            minStemLength: auction.minStemLength,
                            unitPerCont: auction.unitPerCont,
                            contInLot: auction.contInLot,
                            minPickup: auction.minPickup,
                            startPrice: auction.startPrice,
                            minPrice: auction.minPrice,
                            effectiveStartTime: freshData.effective_start_time,
                            durationMinutes: freshData.duration_minutes,
                            start_time: freshData.start_time
                        };
                        setAuction(updatedAuction);
                        setCurrentPrice(auction.startPrice);
                    }

                    const freshLots = await fetchMaybe(`${API_BASE}/api/AuctionLots`);
                    if (Array.isArray(freshLots)) {
                        const freshLot = freshLots.find(l => Number(l.plant_id) === Number(auction.plant_id));
                        if (freshLot) {
                            setActiveLot(freshLot);
                            setAuction(prev => ({
                                ...prev,
                                contInLot: freshLot.remaining_quantity
                            }));

                            if (freshLot.remaining_quantity <= 0 || freshLot.remaining_quantity < minBuy) {
                                const completedAuction = {
                                    ...auction,
                                    status: "completed"
                                };
                                const resStatus = await fetch(`${API_BASE}/api/Auctions/${id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(completedAuction)
                                });

                                if (resStatus.ok) {
                                    showNotification("Auction completed!", "success", true);
                                    setTimeout(() => {
                                        navigate('/cAuctions');
                                    }, 2000);
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error refreshing auction after purchase:", err);
                    showNotification("Warning: Could not refresh auction data", "error");
                }
            }, 500);

        } catch (err) {
            console.error(err);
            showNotification("Error during purchase: " + err.message, "error");
        }
    };

    // Laad de prijsgeschiedenis voor deze plant en toon deze in een modal
    const handlePriceHistory = async () => {
        setShowPriceHistory(true);
        setPriceHistoryLoading(true);
        try {
            const plantId = auction.plant_id;
            const response = await fetchMaybe(
                `${API_BASE}/api/PriceHistory/plant/${plantId}`
            );

            if (response) {
                setPriceHistory({
                    plantName: auction.productname,
                    currentSupplierName: auction.supplierName,
                    currentSupplierHistory: response.currentSupplierHistory || [],
                    currentSupplierAverage: response.currentSupplierAverage || 0,
                    allSuppliersHistory: response.allSuppliersHistory || [],
                    allSuppliersAverage: response.allSuppliersAverage || 0
                });
            }
        } catch (e) {
            console.error("Failed to load price history", e);
            setPriceHistory({
                plantName: auction.productname,
                currentSupplierName: auction.supplierName,
                currentSupplierHistory: [],
                currentSupplierAverage: 0,
                allSuppliersHistory: [],
                allSuppliersAverage: 0
            });
        } finally {
            setPriceHistoryLoading(false);
        }
    };

    // Sluit het prijsgeschiedenis venster
    const closePriceHistory = () => {
        setShowPriceHistory(false);
    };

    // Update de huidige prijs wanneer de klok deze aanpast
    const handlePriceUpdate = useCallback((price) => {
        setCurrentPrice(price);
    }, []);

    if (loading) return <div className="c-aa-loading">Loading...</div>;
    if (!auction) return <div className="c-aa-loading">Auction not found or invalid ID</div>;

    const durationMs = (auction.durationMinutes || 60) * 60 * 1000;
    const timerStartTime = new Date(auction.effectiveStartTime);
    const now = new Date();
    const elapsed = now - timerStartTime;
    const timeUntilStart = Math.max(timerStartTime.getTime() - now.getTime(), 0);
    const hasStarted = elapsed >= 0;
    const validStartTime = timerStartTime.getTime();


    console.log('Auction Data:', {
        auctionId: auction.auction_id,
        effectiveStartTime: auction.effectiveStartTime,
        durationMinutes: auction.durationMinutes,
        validStartTime,
        hasStarted,
        now: Date.now(),
        elapsed
    });


    return (
        <div className="c-aa-page">
            {notification && (
                <div className={`c-aa-notification ${notification.type}`}>
                    <span className="notification-icon">
                        {notification.type === 'success' ? '✓' : '✕'}
                    </span>
                    <span className="notification-message">{notification.message}</span>
                    {!notificationPersist && (
                        <button className="notification-close" onClick={() => setNotification(null)}>×</button>
                    )}
                </div>
            )}

            {showPriceHistory && (
                <div className="c-aa-price-history-modal">
                    <div className="c-aa-price-history-modal-content">
                        <button
                            onClick={closePriceHistory}
                            className="c-aa-price-history-close"
                        >
                            ×
                        </button>

                        <h2 className="c-aa-price-history-title">
                            Price History - {priceHistory.plantName}
                        </h2>

                        {priceHistoryLoading ? (
                            <div className="c-aa-price-history-loading">Loading price history...</div>
                        ) : (
                            <div className="c-aa-price-history-tables">
                                <div className="c-aa-price-history-table-section">
                                    <h3 className="c-aa-price-history-table-title">
                                        {priceHistory.currentSupplierName?.toUpperCase()} (LAST 10 CHANGES)
                                    </h3>
                                    {priceHistory.currentSupplierHistory.length > 0 ? (
                                        <>
                                            <table className="c-aa-price-history-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date Changed</th>
                                                        <th>Old Min Price</th>
                                                        <th>New Min Price</th>
                                                        <th>Old Start Price</th>
                                                        <th>New Start Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {priceHistory.currentSupplierHistory.map((entry, idx) => (
                                                        <tr key={idx}>
                                                            <td>{new Date(entry.changed_at).toLocaleDateString()}</td>
                                                            <td>€{entry.old_min_price?.toFixed(2)}</td>
                                                            <td className="c-aa-price-history-price">
                                                                €{entry.new_min_price?.toFixed(2)}
                                                            </td>
                                                            <td>€{entry.old_start_price?.toFixed(2)}</td>
                                                            <td className="c-aa-price-history-price">
                                                                €{entry.new_start_price?.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <div className="c-aa-price-history-avg">
                                                Average Start Price: €{priceHistory.currentSupplierAverage?.toFixed(2)}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="c-aa-price-history-loading">No price history available</div>
                                    )}
                                </div>

                                <div className="c-aa-price-history-table-section">
                                    <h3 className="c-aa-price-history-table-title">
                                        ALL SUPPLIERS (LAST 10)
                                    </h3>
                                    {priceHistory.allSuppliersHistory.length > 0 ? (
                                        <>
                                            <table className="c-aa-price-history-table">
                                                <thead>
                                                    <tr>
                                                        <th>Supplier</th>
                                                        <th>Date Changed</th>
                                                        <th>Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {priceHistory.allSuppliersHistory.map((entry, idx) => (
                                                        <tr key={idx}>
                                                            <td>{entry.supplierName}</td>
                                                            <td>{new Date(entry.date).toLocaleDateString()}</td>
                                                            <td className="c-aa-price-history-price">
                                                                €{entry.price?.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <div className="c-aa-price-history-avg">
                                                Average Price (All): €{priceHistory.allSuppliersAverage?.toFixed(2)}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="c-aa-price-history-loading">No price history available</div>
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
                Auction starts in {secondsUntilStart} seconds
            </div>
                     ) : (
                        <AuctionClock
    startPrice={auction.startPrice}
    minPrice={auction.minPrice}
    durationMs={durationMs}
    onPriceUpdate={handlePriceUpdate}
    startTime={timerStartTime.getTime()}
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
                                         <div className="c-aa-detail-val box-white">
                                             {mk.start_time ? parseUtcDate(mk.start_time).toLocaleString('en-NL') : "TBD"}
                                         </div>
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
