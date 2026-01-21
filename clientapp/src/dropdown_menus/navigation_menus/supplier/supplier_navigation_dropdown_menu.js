import React, { useEffect, useRef, useState } from "react";
import "../master/navigation_dropdown_menu.css";
import "./supplier_navigation_dropdown_menu.css";

const MENU_ITEMS = [
    { id: "home", title: "Home", desc: "Back to Supplier Dashboard", path: "/supplierDashboard" },
    { id: "add", title: "Add Product", desc: "Create a new product listing", path: "/sAddProduct" },
];

export default function SupplierNavigationDropdownMenu({ navigateFn }) {
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
        <div className="nav-dropdown-root" ref={containerRef}>
            <button
                className="nav-hamburger"
                aria-haspopup="true"
                aria-expanded={open}
                aria-controls="supplier-nav-dropdown-menu"
                onClick={() => setOpen((s) => !s)}
                title="Supplier Menu"
            >
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
            </button>

            <div
                id="supplier-nav-dropdown-menu"
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
