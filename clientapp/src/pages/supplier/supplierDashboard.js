import React, {useEffect, useState } from 'react';
import '../../styles/supplierPages/supplierDashboardStyle.css';
import SupplierNavigationDropdownMenu from "../../dropdown_menus/navigation_menus/supplier/supplier_navigation_dropdown_menu";
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";
import { useNavigate } from "react-router-dom";


export default function SupplierDashboard() {
    // Replace these with real data / hooks
    const [logo, setLogo] = useState(null);
  const userName = 'user';
  const userRole = 'Supplier';

    const navigate = useNavigate();

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
            {/* Stock table / list goes here */}
          </div>
        </section>
      </main>

      {/* Use supplier-specific dropdown for supplier pages */}
      <SupplierNavigationDropdownMenu navigateFn={(p) => navigate(p)} />
      <AccountDropdownMenu userName={userName} userRole={userRole} />
    </div>
  );
}