import React, {useEffect, useState } from 'react';
import '../../styles/supplierPages/supplierDashboardStyle.css';
import SupplierNavigationDropdownMenu from "../../dropdown_menus/navigation_menus/supplier/supplier_navigation_dropdown_menu";
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";
import { useNavigate } from "react-router-dom";


export default function SupplierDashboard() {
    // Replace these with real data / hooks
    const [logo, setLogo] = useState(null);
    const [plants, setPlants] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [auctionLots, setAuctionLots] = useState([]);
    const userName = 'user';
    const userRole = 'Supplier';

    const navigate = useNavigate();

    const toggleExpand = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const getRemainingQuantity = (plantId) => {
        const lot = auctionLots.find(l => Number(l.plant_id) === Number(plantId));
        return lot ? lot.remaining_quantity : null;
    };

    useEffect(() => {
        // Top logo (media id 1)
        const mediaId = 1;
        fetch(`/api/Media/${mediaId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch media');
                return res.json();
            })
            .then(m => {
                const normalizedUrl = m.url && !m.url.startsWith('/') ? `/${m.url}` : m.url;
                setLogo({ url: normalizedUrl, alt: m.alt_text });
            })
            .catch(() => { /* silent fallback */ });
    }, []);

    useEffect(() => {
        fetch("/api/plant/overview")
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch plants");
                return res.json();
            })
            .then((data) => setPlants(data))
            .catch((err) => {
                console.error("Error loading plants:", err);
                setPlants([]);
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

  const handleAddProducts = () => navigate('/supplier/s_addProduct');


  return (
    <div className="sd-page">
      <header className="sd-topbar">

              <div className="sd-logo" role="region" aria-label="section-1">
                  {logo ? (
                      <img src={logo.url} alt={logo.alt} className="top-logo" />
                  ) : (
                      <span className="loading-label">Loading…</span>
                  )}
              </div>
 
      </header>

      <section className="sd-welcome">
        <h1>Welcome!</h1>
        <p>You can add products to the stock by clicking on the 'Add Products' button.<br/>You can also look at your stock.</p>
      </section>

      <main className="sd-main">
        <aside className="sd-left-card">
          <div className="sd-add-card">
            <div className="sd-add-graphic">
              <svg viewBox="0 0 64 64" width="96" height="96" aria-hidden>
                <rect x="8" y="8" width="48" height="48" rx="6" fill="rgba(0,0,0,0.08)"/>
                <rect x="22" y="22" width="20" height="20" rx="2" stroke="rgba(0,0,0,0.2)" strokeWidth="2" fill="none"/>
                <path d="M32 20v24M20 32h24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <div className="sd-add-footer">
              <button className="sd-add-btn" onClick={handleAddProducts}>Add Products</button>
            </div>
          </div>
        </aside>

        <section className="sd-stock">
          <div className="sd-stock-header">
            <div className="sd-stock-icon">▦</div>
            <div className="sd-stock-title">Stock View</div>
          </div>

          <div className="sd-stock-body" role="region" aria-label="Stock view content">
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
        </section>
      </main>

      {/* Use supplier-specific dropdown for supplier pages */}
      <SupplierNavigationDropdownMenu navigateFn={(p) => navigate(p)} />
      <AccountDropdownMenu userName={userName} userRole={userRole} />
    </div>
  );
}
