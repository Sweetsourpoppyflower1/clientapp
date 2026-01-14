import React, { useEffect, useState } from "react";
import "../../styles/masterPages/a_overviewUpcomingAuctionsStyle.css";
import NavigationDropdownMenu from "../../dropdown_menus/navigation_menus/master/navigation_dropdown_menu";
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || '';

export default function AOverviewUpcomingAuctions() {
    const [upcoming, setUpcoming] = useState([]);
    const [logo, setLogo] = useState(null);
    const [plantMap, setPlantMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [todayUpcoming, setTodayUpcoming] = useState([]);
    const [restUpcoming, setRestUpcoming] = useState([]);


    useEffect(() => {
        const mediaId = 1;
        fetch(`${API_BASE}/api/Media/${mediaId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch media');
                return res.json();
            })
            .then(m => {
                const normalizedUrl = m.url && !m.url.startsWith('/') ? `/${m.url}` : m.url;
                setLogo({ url: normalizedUrl, alt: m.alt_text });
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        let mounted = true;

        async function loadAuctionsAndPlants() {
            try {
                const res = await fetch("/api/Auctions");
                if (!res.ok) throw new Error(`Auctions endpoint returned ${res.status}`);
                const all = await res.json();

                const filtered = Array.isArray(all)
                    ? all.filter(
                        (a) =>
                            a &&
                            a.status &&
                            String(a.status).toLowerCase() === "upcoming"
                    )
                    : [];

                let map = {};
                try {
                    const pRes = await fetch("/api/Plants");
                    if (pRes.ok) {
                        const plants = await pRes.json();
                        if (Array.isArray(plants)) {
                            plants.forEach((p) => {
                                const id = p?.plant_id ?? p?.PlantId ?? p?.plantId;
                                const name =
                                    p?.productname ??
                                    p?.productName ??
                                    p?.ProductName ??
                                    p?.name ??
                                    p?.Name;
                                const startPrice = p?.start_price ?? p?.StartPrice ?? p?.startPrice;
                                const minPrice = p?.min_price ?? p?.MinimumPrice ?? p?.minPrice;
                                if (id != null) {
                                    map[String(id)] = {
                                        name: name ?? String(id),
                                        startPrice: startPrice,
                                        minPrice: minPrice
                                    };
                                }
                            });
                        }
                    }
                } catch (plantErr) {
                }

                if (mounted) {
                    const now = new Date();
                    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

                    const todays = filtered.filter(a => {
                        const st = a.start_time ? new Date(a.start_time) : null;
                        return st && st >= startOfToday && st < endOfToday;
                    });

                    const rest = filtered.filter(a => {
                        const st = a.start_time ? new Date(a.start_time) : null;
                        return !st || st < startOfToday || st >= endOfToday;
                    });

                    setTodayUpcoming(todays);
                    setRestUpcoming(rest);
                    setPlantMap(map);
                    setLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    setError(err.message || "Failed to load auctions");
                    setLoading(false);
                }
            }
        }

        loadAuctionsAndPlants();
        return () => {
            mounted = false;
        };
    }, []);

    if (loading) return <div className="au-loading">Loading upcoming auctions...</div>;
    if (error) return <div className="au-error">Error loading auctions: {error}</div>;

    return (
        <div className="au-page">

            <div className="logo-au-header">
                {logo ? (
                    <img src={logo.url} alt={logo.alt} className="u-top-logo" />
                ) : (
                    <span className="loading-label">Loading�</span>
                )}
            </div>

            <div className="body-upc">
                <div>
                    <h2 className="upcoming-header">Upcoming Auctions</h2>
                </div>

                <div className="au-panels">
                    <div className="au-panel au-today">
                        <div className="au-panel-header">Today</div>

                        <div className="au-panel-body">
                            {todayUpcoming.length === 0 && (
                                <div className="au-no-items">No auctions today.</div>
                            )}

                            <ul className="au-list">
                                {todayUpcoming.map((a) => {
                                    const plantKey = String(a.plant_id ?? a.PlantId ?? a.plantId);
                                    const plantEntry = plantMap[plantKey];
                                    const plantName = plantEntry?.name ?? a.plant_id;
                                    const startPrice = plantEntry?.startPrice ?? a.start_price ?? a.StartPrice ?? null;
                                    const minPrice = plantEntry?.minPrice ?? a.min_price ?? a.MinimumPrice ?? null;

                                    const fmt = (v) => (v == null ? "N/A" : v);

                                    return (
                                        <li key={a.auction_id} className="au-list-item">
                                            <div><strong>Plant: </strong> {plantName}</div>
                                            <div><strong>Start: </strong>{a.start_time ? new Date(a.start_time).toLocaleString() : "N/A"}</div>
                                            <div><strong>End: </strong>{a.end_time ? new Date(a.end_time).toLocaleString() : "N/A"}</div>
                                            <div><strong>Start Price:</strong> {fmt(startPrice)}</div>
                                            <div><strong>Min Price:</strong> {fmt(minPrice)}</div>
                                            <hr />
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>


                    </div>

                    <div className="au-panel au-rest">
                        <div className="au-panel-header au-rest-header">Rest</div>
                        <div className="au-panel-body au-rest-body">
                            <ul className="au-list">
                                {restUpcoming.length === 0 && (
                                    <div className="au-no-items">No other upcoming auctions.</div>
                                )}

                                {restUpcoming.map((a) => {
                                    const plantKey = String(a.plant_id ?? a.PlantId ?? a.plantId);
                                    const plantEntry = plantMap[plantKey];
                                    const plantName = plantEntry?.name ?? a.plant_id;
                                    const startPrice = plantEntry?.startPrice ?? a.start_price ?? a.StartPrice ?? null;
                                    const minPrice = plantEntry?.minPrice ?? a.min_price ?? a.MinimumPrice ?? null;

                                    const fmt = (v) => (v == null ? "N/A" : v);

                                    return (
                                        <li key={a.auction_id} className="au-list-item">
                                            <div><strong>Plant: </strong> {plantName}</div>
                                            <div><strong>Start:</strong> {a.start_time ? new Date(a.start_time).toLocaleString() : "N/A"}</div>
                                            <div><strong>End:</strong> {a.end_time ? new Date(a.end_time).toLocaleString() : "N/A"}</div>
                                            <div><strong>Start Price:</strong> {fmt(startPrice)}</div>
                                            <div><strong>Min Price:</strong> {fmt(minPrice)}</div>
                                            <hr />
                                        </li>
                                    );
                                })}
                            </ul>

                        </div>
                    </div>
                </div>
            </div>            

            <NavigationDropdownMenu navigateFn={(p) => navigate(p)} />

            <AccountDropdownMenu />

        </div>
    );
}