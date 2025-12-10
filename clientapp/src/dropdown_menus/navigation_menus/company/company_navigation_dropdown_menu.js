import React, { useEffect, useRef, useState } from "react";
import "./company_navigation_dropdown_menu.css";

const MENU_ITEMS = [
  { id: "home", title: "Company Dashboard", desc: "Navigates to Company Dashboard", path: "/company/companyDashboard" },
  { id: "auctions", title: "Auctions", desc: "Navigates to the Auctions screen", path: "/company/c_auctions" },
  { id: "orders", title: "My Orders", desc: "Navigates to My Orders screen", path: "/company/c_myOrders" },
];

export default function CompanyNavigationDropdownMenu({ navigateFn }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (open && containerRef.current) {
      const firstItem = containerRef.current.querySelector('[role="menuitem"]');
      if (firstItem && typeof firstItem.focus === "function") firstItem.focus();
    }
  }, [open]);

  function navigateTo(path) {
    setOpen(false);
    if (typeof navigateFn === "function") {
      navigateFn(path);
      return;
    }
    window.location.href = path;
  }

  return (
    <div
      className="nav-dropdown-root"
      ref={containerRef}
    >
      <button
        className="nav-hamburger"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="nav-dropdown-menu"
        onClick={() => setOpen((s) => !s)}
        title="Menu"
      >
        <span className="bar" />
        <span className="bar" />
        <span className="bar" />
      </button>

      <div
        id="nav-dropdown-menu"
        className={`nav-menu-card ${open ? "open" : "closed"}`}
        role="menu"
        aria-hidden={!open}
      >

        <ul className="nav-menu-list">
          {MENU_ITEMS.map((it, idx) => (
            <li key={it.id} role="none">
              <button
                role="menuitem"
                className="nav-menu-item"
                onClick={() => navigateTo(it.path)}
                tabIndex={open ? 0 : -1}
              >
                <div className="item-title">{it.title}</div>
                <div className="item-desc">{it.desc}</div>
              </button>
              {idx !== MENU_ITEMS.length - 1 && <div className="item-sep" />}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
