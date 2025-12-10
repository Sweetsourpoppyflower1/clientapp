import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import '../../styles/companyPages/c_myOrdersStyle.css';
import CompanyNavigationDropdownMenu from "../../dropdown_menus/navigation_menus/company/company_navigation_dropdown_menu";

export default function CMyOrders() {
  const navigate = useNavigate();

  const [logo, setLogo] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Adjust this endpoint to match your backend
  const API_ENDPOINT = "/api/acceptances";

  useEffect(() => {
    // Top logo (media id 1) - same approach as supplier dashboard
    const mediaId = 1;
    fetch(`/api/Media/${mediaId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch media');
        return res.json();
      })
      .then(m => {
        const normalizedUrl = m.url && !m.url.startsWith('/') ? `/${m.url}` : m.url;
        setLogo({ url: normalizedUrl, alt: m.alt_text || m.altText || "Flauction" });
      })
      .catch(() => { /* silent fallback */ });
  }, []);

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
        if (mounted) setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load orders.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadOrders();
    return () => {
      mounted = false;
    };
  }, [API_ENDPOINT]);

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  return (
    <div className="sd-page">
      <header className="sd-topbar" style={{ position: "relative" }}>
        <div className="sd-left" aria-hidden>
          <button aria-label="menu" className="sd-icon-btn sd-hamburger">
            <span />
            <span />
            <span />
          </button>
        </div>

        <div className="sd-logo" role="region" aria-label="brand-logo">
          {logo ? (
            <img src={logo.url} alt={logo.alt} className="top-logo" />
          ) : (
            <span className="loading-label">Loading…</span>
          )}
        </div>

        <div className="sd-right" aria-hidden />
      </header>

      <main className="sd-main" style={{ gridTemplateColumns: "1fr", paddingTop: 20 }}>
        <section style={{ width: "100%" }}>
          <div className="sd-stock">
            <div className="sd-stock-header">
              <div className="sd-stock-icon">📦</div>
              <div className="sd-stock-title">My Orders</div>
            </div>

            <div className="sd-stock-body" role="region" aria-label="Company my orders">
              {loading && <div className="status-text">Loading orders...</div>}
              {error && <div className="status-text error">{error}</div>}

              {!loading && !error && orders.length === 0 && (
                <div className="status-text">No orders found for this company.</div>
              )}

              {!loading && !error && orders.length > 0 && (
                <div className="orders-grid">
                  {orders.map((o) => (
                    <div
                      key={o.acceptance_id ?? `${o.auction_id}-${o.auction_lot_id}-${o.tick_number}`}
                      className="order-card"
                    >
                      <div className="order-content">
                        <div className="order-title">
                          Auction #{o.auction_id} — Lot #{o.auction_lot_id}
                        </div>

                        <div className="order-meta">
                          Tick: {o.tick_number ?? "—"} • Accepted qty: {o.accepted_quantity ?? "—"} • Price: {o.accepted_price ?? "—"}
                        </div>

                        <div className="order-time">
                          Order time: {o.time ? formatDate(o.time) : "—"}
                        </div>

                        {o.company_id && (
                          <div className="order-company">Company: {o.company_id}</div>
                        )}
                      </div>

                      <div className="order-actions">
                        <button
                          className="sd-logout"
                          onClick={() => navigate(`/company/auctions/${o.auction_id}`)}
                        >
                          View auction
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button
                  className="sd-settings"
                  onClick={() => navigate("/company/dashboard")}
                  style={{ padding: "8px 14px" }}
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <CompanyNavigationDropdownMenu navigateFn={(path) => navigate(path)} />
    </div>
  );
}
