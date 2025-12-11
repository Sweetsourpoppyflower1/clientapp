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
    const [auctionData, setAuctionData] = useState(null);
    const [resetTrigger, setResetTrigger] = useState(0);

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

                const enriched = {
                    auction_id: a.auction_id,
                    plant_id: a.plant_id,
                    productname: plant?.productname || "Unknown Product",
                    imageUrl: imageUrl || "https://via.placeholder.com/400x300?text=No+Image",
                    supplierName: supplier?.name || supplier?.displayName || "Unknown Supplier",
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
                    endTime: a.end_time
                };
                
                setAuction(enriched);
                setAuctionData(a);
                setMinBuy(enriched.minPickup);
                setUserAmount(enriched.minPickup);
                setCurrentPrice(enriched.startPrice);

                const allAuctions = await fetchMaybe("/api/Auctions");
                if (Array.isArray(allAuctions)) {
                     const allPlants = await fetchMaybe("/api/Plants");
                     const plantsMap = new Map();
                     if(Array.isArray(allPlants)) allPlants.forEach(p => plantsMap.set(p.plant_id, p));
                     
                     const upcomingList = allAuctions
                        .filter(x => x.status === 'upcoming' && String(x.auction_id) !== String(id))
                        .slice(0, 10)
                        .map(x => {
                            const p = plantsMap.get(x.plant_id);
                            return {
                                ...x,
                                plantName: p?.productname || "Auction Product",
                                imageUrl: null
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
        
        const currentTime = new Date();
        const auctionStartTime = new Date(auction.startTime);
        
        if (currentTime < auctionStartTime) {
            alert("De veiling is nog niet begonnen. U kunt geen aankoop doen voordat de veiling is gestart.");
            return;
        }
        
        let userData = {};
        try {
            userData = JSON.parse(localStorage.getItem("user_data") || "{}");
        } catch {}
        
        const companyId = userData.companyID || userData.companyId || userData.id || userData.Id;
        
        if (!companyId) {
            alert("You must be logged in as a company to buy.");
            return;
        }

        if (userAmount > activeLot.remaining_quantity) {
            alert(`You cannot buy more than available quantity (${activeLot.remaining_quantity}).`);
            return;
        }
        
        const acceptance = {
            auction_id: auction.auction_id,
            company_id: companyId,
            auction_lot_id: activeLot.auctionlot_id,
            tick_number: 0, 
            accepted_price: currentPrice,
            accepted_quantity: userAmount,
            time: new Date().toISOString()
        };

        try {
            const resAcc = await fetch('/api/Acceptances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(acceptance)
            });
            
            if (!resAcc.ok) {
                const txt = await resAcc.text();
                throw new Error(`Failed to create acceptance: ${txt}`);
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
                throw new Error("Failed to update lot quantity");
            }

            setActiveLot(updatedLot);
            setAuction(prev => ({ ...prev, contInLot: updatedLot.remaining_quantity }));
            
            setResetTrigger(prev => prev + 1);
            
            alert(`Successfully bought ${userAmount} containers!`);

        } catch (err) {
            console.error(err);
            alert("Error processing purchase: " + err.message);
        }
    };

    if (loading) return <div className="c-aa-loading">Loading...</div>;
    if (!auction) return <div className="c-aa-loading">Auction not found or invalid ID</div>;

    return (
        <div className="c-aa-page">
            <header className="c-aa-header">
                 <div className="c-aa-header-left">
                     <CompanyNavigationDropdownMenu navigateFn={(path) => navigate(path)} />
                 </div>
                 
                 <div className="c-aa-logo">
                    {logo ? <img src={logo.url} alt={logo.alt} /> : <span>Flora</span>}
                 </div>
                 
                 <div className="c-aa-header-right">
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
                    <AuctionClock 
                        startPrice={auction.startPrice}
                        minPrice={auction.minPrice}
                        startTime={auction.startTime}
                        endTime={auction.endTime}
                        onPriceUpdate={(price) => setCurrentPrice(price)}
                        resetTrigger={resetTrigger}
                    />
                    
                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <div className="c-aa-info-box" style={{ display: 'inline-block', margin: '10px' }}>
                            <span className="c-aa-box-label">Unit / cont.</span>
                            <span className="c-aa-box-val">{auction.unitPerCont}</span>
                        </div>
                        <div className="c-aa-info-box" style={{ display: 'inline-block', margin: '10px' }}>
                            <span className="c-aa-box-label">a/cont. in lot</span>
                            <span className="c-aa-box-val">{auction.contInLot}</span>
                        </div>
                    </div>
                    
                    <button className="c-aa-buy-btn" onClick={handleBuy}>BUY</button>
                </div>

                <div className="c-aa-card c-aa-details-panel">
                     <div className="c-aa-detail-group">
                         <label>Productname:</label>
                         <div className="c-aa-detail-val box-white">{auction.productname}</div>
                     </div>
                     <div className="c-aa-detail-group">
                         <label>Supplier:</label>
                         <div className="c-aa-detail-val box-white">{auction.supplierName}</div>
                     </div>
                     <div className="c-aa-detail-group">
                         <label>Form</label>
                         <div className="c-aa-detail-val box-white highlight-border">{auction.form}</div>
                     </div>
                     <div className="c-aa-detail-group">
                         <label>Maturity</label>
                         <div className="c-aa-detail-val box-white">{auction.maturity}</div>
                     </div>
                     <div className="c-aa-row">
                         <div className="c-aa-detail-group half">
                             <label>Quality</label>
                             <div className="c-aa-detail-val box-white">{auction.quality}</div>
                         </div>
                         <div className="c-aa-detail-group half">
                             <label>Quantity stems per Unit</label>
                             <div className="c-aa-detail-val box-white">{auction.quantityStems}</div>
                         </div>
                     </div>
                     <div className="c-aa-detail-group">
                         <label>Min Stem Lenght</label>
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
                                     <img src={resolveUrl(mk.imageUrl) || "https://via.placeholder.com/400x300?text=No+Image"} alt={mk.plantName} />
                                 </div>
                                 <div className="c-aa-uc-details">
                                     <div className="c-aa-detail-group">
                                         <label>Productname:</label>
                                         <div className="c-aa-detail-val box-white">{mk.plantName}</div>
                                     </div>
                                     <div className="c-aa-detail-group">
                                         <label>When will this auction start?</label>
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
            
            <AccountDropdownMenu />
        </div>
    );
}
