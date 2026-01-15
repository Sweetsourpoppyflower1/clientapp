import React, { useEffect, useState } from "react";
import "../../styles/masterPages/a_manageUsersStyle.css";
import NavigationDropdownMenu from "../../dropdown_menus/navigation_menus/master/navigation_dropdown_menu";
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";
import { useNavigate } from "react-router-dom";

const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");

const fetchMaybe = async (url) => {
    try {
        const r = await fetch(url, { credentials: "same-origin" });
        return r.ok ? r.json().catch(() => null) : null;
    } catch {
        return null;
    }
};

export default function AManageUsers() {
    const [companies, setCompanies] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loadingCompanies, setLoadingCompanies] = useState(true);
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadCompanies();
        loadSuppliers();
    }, []);

    // fetch alle companies and suppliers
    const loadCompanies = async () => {
        setLoadingCompanies(true);
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch("/api/Companies", {
                credentials: "same-origin",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            
            if (response.ok) {
                const data = await response.json();
                setCompanies(Array.isArray(data) ? data : []);
            } else {
                console.error("Failed to load companies:", response.status);
                setCompanies([]);
            }
        } catch (err) {
            console.error("Failed to load companies:", err);
            setCompanies([]);
        } finally {
            setLoadingCompanies(false);
        }
    };

    const loadSuppliers = async () => {
        setLoadingSuppliers(true);
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch("/api/Suppliers", {
                credentials: "same-origin",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            
            if (response.ok) {
                const data = await response.json();
                setSuppliers(Array.isArray(data) ? data : []);
            } else {
                console.error("Failed to load suppliers:", response.status);
                setSuppliers([]);
            }
        } catch (err) {
            console.error("Failed to load suppliers:", err);
            setSuppliers([]);
        } finally {
            setLoadingSuppliers(false);
        }
    };

    const handleDeleteCompany = async (company) => {
        const companyId = company.id || company.company_id;
        const companyName = company.name || company.displayName || "this company";
        
        if (!window.confirm(`Are you sure you want to delete ${companyName}? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(`${API_BASE}/api/Companies/${companyId}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });

            if (!res.ok) {
                throw new Error(`Failed to delete (${res.status})`);
            }

            alert(`${companyName} has been successfully deleted.`);
            setCompanies(prev => prev.filter(c => (c.id || c.company_id) !== companyId));
        } catch (err) {
            console.error("Failed to delete company:", err);
            alert("Failed to delete the company. Please try again.");
        }
    };

    const handleDeleteSupplier = async (supplier) => {
        const supplierId = supplier.id || supplier.supplier_id;
        const supplierName = supplier.name || supplier.displayName || "this supplier";
        
        if (!window.confirm(`Are you sure you want to delete ${supplierName}? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(`${API_BASE}/api/Suppliers/${supplierId}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });

            if (!res.ok) {
                throw new Error(`Failed to delete (${res.status})`);
            }

            alert(`${supplierName} has been successfully deleted.`);
            setSuppliers(prev => prev.filter(s => (s.id || s.supplier_id) !== supplierId));
        } catch (err) {
            console.error("Failed to delete supplier:", err);
            alert("Failed to delete the supplier. Please try again.");
        }
    };

    return (
        <div className="manage-users-page">
            <section className="manage-users-welcome-section" role="region" aria-label="manage-users-banner">
                <div className="manage-users-welcome-header">
                    <div className="manage-users-welcome-text">
                        <h1 className="manage-users-welcome-title">Manage Users</h1>
                        <p className="manage-users-welcome-subtitle">
                            View and manage all companies and suppliers in the system. Remove users when necessary.
                        </p>
                    </div>
                </div>
            </section>

            <main className="manage-users-main">
                <div className="manage-users-container">
                    <div className="manage-users-tables-wrapper">
                        <div className="manage-users-table-section">
                            <div className="manage-users-section-header">
                                <h2 className="manage-users-section-title">Companies</h2>
                                <p className="manage-users-section-subtitle">
                                    {companies.length} compan{companies.length !== 1 ? 'ies' : 'y'} registered
                                </p>
                            </div>

                            {loadingCompanies ? (
                                <div className="manage-users-loading">Loading companies...</div>
                            ) : companies.length === 0 ? (
                                <div className="manage-users-empty">
                                    <div className="empty-icon">🏢</div>
                                    <div className="empty-message">No companies found</div>
                                </div>
                            ) : (
                                <div className="manage-users-table-container">
                                    <table className="manage-users-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {companies.map((company, index) => (
                                                <tr key={company.id || company.company_id || index}>
                                                    <td>{company.id || company.company_id || '-'}</td>
                                                    <td className="name-cell">{company.name || company.displayName || 'Unknown'}</td>
                                                    <td>{company.email || '-'}</td>
                                                    <td>{company.phone || company.phoneNumber || '-'}</td>
                                                    <td>
                                                        <button
                                                            className="delete-btn"
                                                            onClick={() => handleDeleteCompany(company)}
                                                            title="Delete company"
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="manage-users-table-section">
                            <div className="manage-users-section-header">
                                <h2 className="manage-users-section-title">Suppliers</h2>
                                <p className="manage-users-section-subtitle">
                                    {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} registered
                                </p>
                            </div>

                            {loadingSuppliers ? (
                                <div className="manage-users-loading">Loading suppliers...</div>
                            ) : suppliers.length === 0 ? (
                                <div className="manage-users-empty">
                                    <div className="empty-icon">🌿</div>
                                    <div className="empty-message">No suppliers found</div>
                                </div>
                            ) : (
                                <div className="manage-users-table-container">
                                    <table className="manage-users-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {suppliers.map((supplier, index) => (
                                                <tr key={supplier.id || supplier.supplier_id || index}>
                                                    <td>{supplier.id || supplier.supplier_id || '-'}</td>
                                                    <td className="name-cell">{supplier.name || supplier.displayName || 'Unknown'}</td>
                                                    <td>{supplier.email || '-'}</td>
                                                    <td>{supplier.phone || supplier.phoneNumber || '-'}</td>
                                                    <td>
                                                        <button
                                                            className="delete-btn"
                                                            onClick={() => handleDeleteSupplier(supplier)}
                                                            title="Delete supplier"
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="manage-users-footer-actions">
                        <button
                            className="manage-users-back-btn"
                            onClick={() => navigate("/auctionmasterDashboard")}
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </main>

            <NavigationDropdownMenu navigateFn={(p) => navigate(p)} />
            <AccountDropdownMenu />
        </div>
    );
}
