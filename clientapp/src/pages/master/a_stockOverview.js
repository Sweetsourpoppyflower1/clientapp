import React, { useState, useEffect } from "react";
import "../../styles/masterPages/a_stockOverviewStyle.css";
import NavigationDropdownMenu from "../../dropdown_menus/navigation_menus/master/navigation_dropdown_menu";
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";
import { useNavigate } from "react-router-dom";

export default function AStockOverview() {
    const [expandedIndex, setExpandedIndex] = useState(null);
    const navigate = useNavigate();

    const [plants, setPlants] = useState([]);
    const [logo, setLogo] = useState(null);
    const [auctionLots, setAuctionLots] = useState([]);

    const toggleExpand = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const normalizeUrl = (url) => {
        if (!url) return null;
        const t = url.trim();
        if (t.startsWith("http://") || t.startsWith("https://")) return t;
        return t.startsWith("/") ? t : `/${t}`;
    };

    useEffect(() => {
        fetch("/api/plant/overview")
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch plants");
                return res.json();
            })
            .then((data) => {
                console.log("API Response:", data);
                if (data.length > 0) {
                    console.log("First plant:", data[0]);
                    console.log("Keys:", Object.keys(data[0]));
                }
                setPlants(data);
            })
            .catch((err) => {
                console.error("Error loading plants:", err);
                setPlants([]);
            });
    }, []);

    useEffect(() => {
        const mediaId = 1;
        fetch(`/api/Media/${mediaId}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch media");
                return res.json();
            })
            .then((m) => {
                setLogo({ url: normalizeUrl(m.url), alt: m.alt_text ?? "Flauction logo" });
            })
            .catch(() => {
                /* silent fallback */
            });
    }, []);

    useEffect(() => {
        fetch("/api/AuctionLots")
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch auction lots");
                return res.json();
            })
            .then((data) => setAuctionLots(data))
            .catch((err) => {
                console.error("Error loading auction lots:", err);
                setAuctionLots([]);
            });
    }, []);

    const getRemainingQuantity = (plantId) => {
        const lot = auctionLots.find(l => Number(l.plant_id) === Number(plantId));
        return lot ? lot.remaining_quantity : null;
    };

    return (
        <div className="stock-page">
            <div className="stock-header">
                {logo ? (
                    <img src={logo.url} alt={logo.alt} className="stock-logo" />
                ) : (
                    <img src="" alt="Flauction logo" className="stock-logo" />
                )}
                <div className="stock-title">Overview Stock</div>
            </div>

            <div className="stock-table-wrapper">
                <table className="stock-table" aria-label="stock-table">
                    <thead>
                        <tr>
                            <th className="stock-th">Stock name</th>
                            <th className="stock-th">supplier name</th>
                            <th className="stock-th">remaining quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plants.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="stock-td no-stock">No stock loaded</td>
                            </tr>
                        ) : (
                            plants.map((p, i) => (
                                <React.Fragment key={p.plantId ?? i}>
                                    <tr>
                                        <td
                                            className="stock-td stock-plant-name"
                                            onClick={() => toggleExpand(i)}
                                            aria-expanded={expandedIndex === i}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") toggleExpand(i);
                                            }}
                                        >
                                            {p.plantName}
                                        </td>
                                        <td className="stock-td stock-supplier">{p.supplier}</td>
                                        <td className="stock-td">{getRemainingQuantity(p.plantId) ?? "-"}</td>
                                    </tr>

                                    {expandedIndex === i && (
                                        <tr>
                                            <td colSpan={3} className="stock-details-row">
                                                <div className="stock-details-container">
                                                    <div className="stock-picture-box">
                                                        {p.imageUrl ? (
                                                            <img
                                                                src={
                                                                    p.imageUrl && !p.imageUrl.startsWith("/")
                                                                        ? "/" + p.imageUrl
                                                                        : p.imageUrl
                                                                }
                                                                alt={p.imageAlt ?? p.productName}
                                                                className="stock-picture"
                                                            />
                                                        ) : (
                                                            <div className="stock-picture-placeholder">No image</div>
                                                        )}
                                                    </div>

                                                    <div className="stock-details-content">
                                                        <div className="stock-details-grid">
                                                            <div>
                                                                <div><span className="stock-label">product name</span>{p.productName}</div>
                                                                <div><span className="stock-label">category</span>{p.category}</div>
                                                                <div><span className="stock-label">form</span>{p.form}</div>
                                                            </div>

                                                            <div>
                                                                <div><span className="stock-label">stems_bunch</span>{p.stemsBunch}</div>
                                                                <div><span className="stock-label">maturity</span>{p.maturity}</div>
                                                                <div><span className="stock-label">min price</span>{p.minPrice ?? p.min_price ?? "-"}</div>
                                                                <div><span className="stock-label">max price</span>{p.maxPrice ?? p.start_price ?? "-"}</div>
                                                            </div>

                                                            <div>
                                                                <div><span className="stock-label">desc</span>{p.desc}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <NavigationDropdownMenu navigateFn={(p) => navigate(p)} />

            <AccountDropdownMenu />
        </div>
    );
}
