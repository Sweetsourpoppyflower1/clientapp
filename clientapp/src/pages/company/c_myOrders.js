// Pagina met de bestellingen van het bedrijf, waar ze hun gekochte producten kunnen bekijken
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import '../../styles/companyPages/c_myOrdersStyle.css';
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";
import CompanyNavigationDropdownMenu from "../../dropdown_menus/navigation_menus/company/company_navigation_dropdown_menu";
import { API_BASE } from "../../config/api";

export default function CMyOrders() {
  const navigate = useNavigate();

  const [logo, setLogo] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [plantDetails, setPlantDetails] = useState({});
  const [plantMediaMap, setPlantMediaMap] = useState({});
  const [loadingPlants, setLoadingPlants] = useState({});

  const API_ENDPOINT = `${API_BASE}/api/acceptances`;

  const normalizeUrl = (url) => {
    if (!url) return null;
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  };

// Laad de afbeeldingen van planten om later te gebruiken bij bestellingsdetails
  useEffect(() => {
    async function loadMediaPlants() {
      try {
        const res = await fetch(`${API_BASE}/api/MediaPlant`);
        if (res.ok) {
          const mediaList = await res.json();
          const mediaMap = {};

          if (Array.isArray(mediaList)) {
            mediaList.forEach(media => {
              const plantId = media.plant_id;
              if (!mediaMap[plantId]) {
                mediaMap[plantId] = [];
              }
              mediaMap[plantId].push(media);
            });
          }

          setPlantMediaMap(mediaMap);
        }
      } catch (err) {
        console.error("Failed to fetch MediaPlant data:", err);
      }
    }

    loadMediaPlants();
  }, []);

  useEffect(() => {
    const mediaId = 1;
    fetch(`${API_BASE}/api/Media/${mediaId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch media');
        return res.json();
      })
      .then(m => {
        const normalizedUrl = m.url && !m.url.startsWith('/') ? `/${m.url}` : m.url;
        setLogo({ url: `${API_BASE}${normalizedUrl}`, alt: m.alt_text || m.altText || "Flauction" });
      })
      .catch(() => {  });
  }, []);

  useEffect(() => {
    const userDataStr = localStorage.getItem("user_data");
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        if (userData.companyID) {
          setCompanyId(userData.companyID);
        }
      } catch (err) {
        console.error("Failed to parse user_data:", err);
      }
    }
  }, []);

// Laad de bestellingen voor dit bedrijf van de server
  useEffect(() => {
    let mounted = true;
    async function loadOrders() {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch(API_ENDPOINT, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => null);
          throw new Error(txt || `Request failed (${res.status})`);
        }

        const data = await res.json();
        if (mounted && Array.isArray(data)) {
          const filteredOrders = companyId
            ? data.filter(order => order.company_id === companyId)
            : data;
          setOrders(filteredOrders);
        }
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load orders.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (companyId) {
      loadOrders();
    }
    return () => {
      mounted = false;
    };
  }, [API_ENDPOINT, companyId]);

// Toon of verberg de details van een bestelling, en laad plantinformatie indien nodig
  const toggleExpand = async (index, auctionId) => {
    setExpandedIndex(expandedIndex === index ? null : index);

    if (expandedIndex !== index && !plantDetails[auctionId]) {
      setLoadingPlants(prev => ({ ...prev, [auctionId]: true }));
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch(`${API_BASE}/api/Auctions/${auctionId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (res.ok) {
          const auctionData = await res.json();
          const plantId = auctionData.plant_id;

          if (plantId) {
            const plantRes = await fetch(`${API_BASE}/api/Plants/${plantId}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });

            if (plantRes.ok) {
              const plant = await plantRes.json();

              let imageUrl = null;
              let imageAlt = null;

              const mediaForPlant = plantMediaMap[plantId];
              if (mediaForPlant && mediaForPlant.length > 0) {
                const sortedMedia = [...mediaForPlant].sort((a, b) => {
                  const ai = a.is_primary ? 0 : 1;
                  const bi = b.is_primary ? 0 : 1;
                  return ai - bi;
                });

                const primaryImage = sortedMedia[0];
                if (primaryImage) {
                  imageUrl = normalizeUrl(primaryImage.url);
                  imageAlt = primaryImage.alt_text || plant.productname;
                }
              }

              setPlantDetails(prev => ({
                ...prev,
                [auctionId]: {
                  ...plant,
                  imageUrl,
                  imageAlt
                }
              }));
            }
          }
        }
      } catch (err) {
        console.error("Failed to load plant details:", err);
      } finally {
        setLoadingPlants(prev => ({ ...prev, [auctionId]: false }));
      }
    }
  };

// Zet een ISO datum om naar een leesbare string
  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  return (
    <div className="cmo-page">
      <header className="cmo-topbar">
        <div className="cmo-logo" role="region" aria-label="brand-logo">
          {logo ? (
            <img src={logo.url} alt={logo.alt} className="top-logo" />
          ) : (
            <span className="loading-label">Loading…</span>
          )}
        </div>
      </header>

      <section className="cmo-welcome-section" role="region" aria-label="my-orders-banner">
        <div className="cmo-welcome-header">
          <div className="cmo-welcome-text">
            <p className="cmo-welcome-subtitle">
              Track and manage all your auction orders in one place. Review your accepted bids and order details.
            </p>
          </div>
        </div>
      </section>

      <main className="cmo-main">
        <section className="cmo-orders-container">
          <div className="cmo-orders-header">
            <h1 className="cmo-orders-title">My Orders</h1>
            <p className="cmo-orders-subtitle">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="cmo-orders-body" role="region" aria-label="company-orders">
            {loading && <div className="cmo-status-text">Loading orders...</div>}
            {error && <div className="cmo-status-text cmo-error">{error}</div>}

            {!loading && !error && orders.length === 0 && (
              <div className="cmo-status-text">No orders found. Start by browsing available auctions.</div>
            )}

            {!loading && !error && orders.length > 0 && (
              <div className="cmo-orders-list">
                <table className="cmo-orders-table" aria-label="Company auction orders">
                  <thead>
                    <tr>
                      <th>Auction</th>
                      <th>Lot</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Order Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o, index) => (
                      <React.Fragment key={o.acceptance_id ?? `${o.auction_id}-${o.auction_lot_id}-${o.tick_number}`}>
                        <tr
                          className={`cmo-orders-row ${expandedIndex === index ? 'cmo-expanded' : ''}`}
                          onClick={() => toggleExpand(index, o.auction_id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleExpand(index, o.auction_id);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-expanded={expandedIndex === index}
                          aria-controls={`order-details-${index}`}
                        >
                          <td>#{o.auction_id}</td>
                          <td>#{o.auction_lot_id}</td>
                          <td>{o.accepted_quantity ?? "—"}</td>
                          <td>€{o.accepted_price ?? "—"}</td>
                          <td>{o.time ? formatDate(o.time) : "—"}</td>
                        </tr>

                        {expandedIndex === index && (
                          <tr className="cmo-details-row" id={`order-details-${index}`}>
                            <td colSpan="5" className="cmo-details-cell">
                              {loadingPlants[o.auction_id] ? (
                                <div className="cmo-loading-details">Loading plant information...</div>
                              ) : plantDetails[o.auction_id] ? (
                                <div className="cmo-details-container">

                                  <div className="cmo-details-image">
                                    {plantDetails[o.auction_id].imageUrl ? (
                                      <img
                                        src={plantDetails[o.auction_id].imageUrl}
                                        alt={plantDetails[o.auction_id].imageAlt || plantDetails[o.auction_id].productname}
                                        className="cmo-details-img"
                                      />
                                    ) : (
                                      <div className="cmo-image-placeholder">No image available</div>
                                    )}
                                  </div>


                                  <div className="cmo-details-grid">
                                    <div>
                                      <div><span className="cmo-label">Product</span>{plantDetails[o.auction_id].productname || "—"}</div>
                                      <div><span className="cmo-label">Category</span>{plantDetails[o.auction_id].category || "—"}</div>
                                      <div><span className="cmo-label">Form</span>{plantDetails[o.auction_id].form || "—"}</div>
                                      <div><span className="cmo-label">Quality</span>{plantDetails[o.auction_id].quality || "—"}</div>
                                    </div>
                                    <div>
                                      <div><span className="cmo-label">Min Stems</span>{plantDetails[o.auction_id].min_stem || "—"}</div>
                                      <div><span className="cmo-label">Stems/Bunch</span>{plantDetails[o.auction_id].stems_bunch || "—"}</div>
                                      <div><span className="cmo-label">Maturity</span>{plantDetails[o.auction_id].maturity || "—"}</div>
                                      <div><span className="cmo-label">Accepted Qty</span>{o.accepted_quantity || "—"}</div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="cmo-no-details">Plant information not available</div>
                              )}

                              {plantDetails[o.auction_id]?.desc && (
                                <div className="cmo-description-box">
                                  <span className="cmo-label">Description</span>
                                  <p>{plantDetails[o.auction_id].desc}</p>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="cmo-footer-actions">
              <button
                className="cmo-back-btn"
                onClick={() => navigate("/companyDashboard")}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </section>
      </main>

      <AccountDropdownMenu />
      <CompanyNavigationDropdownMenu navigateFn={(path) => navigate(path)} />
    </div>
  );
}
