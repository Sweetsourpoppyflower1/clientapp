import React, { useEffect, useRef, useState } from "react";
import "./account_dropdown_menu.css";

export default function AccountDropdownMenu({
  userName,
  logoutFn,
  logoutUrl = "/login_register/login",
}) {
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(userName ?? "<user>");
  const rootRef = useRef(null);

  useEffect(() => {
    if (!userName) {
      const stored = localStorage.getItem("user_email");
      if (stored) setUserEmail(stored);
    } else {
      setUserEmail(userName);
    }
  }, [userName]);

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
    };
  }, []);

  useEffect(() => {
    if (open && rootRef.current) {
      const focusTarget = rootRef.current.querySelector(".acc-logout-button");
      if (focusTarget && typeof focusTarget.focus === "function") focusTarget.focus();
    }
  }, [open]);

  function clearUserStorage() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_roles");
    localStorage.removeItem("user_data");
  }

  function handleLogout() {
    setOpen(false);
    clearUserStorage();

    if (typeof logoutFn === "function") {
      logoutFn();
      return;
    }

    window.location.href = logoutUrl;
  }

  return (
    <div className="acc-dropdown-root" ref={rootRef}>
      <button
        className="acc-avatar-btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="acc-dropdown-menu"
        onClick={() => setOpen((s) => !s)}
        title="Account"
      >
        <svg className="acc-avatar-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4 20c1.5-3 4.5-4.5 8-4.5s6.5 1.5 8 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <div
        id="acc-dropdown-menu"
        className={`acc-menu-card ${open ? "open" : "closed"}`}
        role="menu"
        aria-hidden={!open}
      >
        <div className="acc-menu-header">
          <div className="acc-logged-in">
            <div className="acc-logged-as">Logged in as:</div>
            <div className="acc-user">
              <span className="acc-username">{userEmail ?? "<user>"}</span>
            </div>
          </div>
        </div>

        <div className="acc-divider" />

        <div className="acc-action-row">
          <button
            className="acc-logout-button"
            role="menuitem"
            onClick={handleLogout}
            tabIndex={open ? 0 : -1}
            aria-label="Log out"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}