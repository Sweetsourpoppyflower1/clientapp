import React, { useEffect, useState } from "react";
import "../../styles/masterPages/a_createAuctionStyle.css";
import NavigationDropdownMenu from "../../dropdown_menus/navigation_menus/master/navigation_dropdown_menu";
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";
import { useNavigate } from "react-router-dom";

const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");

// zorgt ervoor dat media urls correct worden opgebouwd
function resolveMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return API_BASE ? `${API_BASE}${path}` : path;
}

// pakt auctionMasterId uit localStorage op verschillende mogelijke plekken
function getAuctionMasterIdFromStorage() {
  const direct = localStorage.getItem("auctionMasterId") || localStorage.getItem("userId");
  if (direct && direct.trim() !== "") return direct;

  const userDataRaw = localStorage.getItem("user_data");
  if (userDataRaw) {
    try {
      const parsed = JSON.parse(userDataRaw);
      if (parsed) {
        if (parsed.auctionMasterId) return parsed.auctionMasterId;
        if (parsed.auctionmasterId) return parsed.auctionmasterId;
        if (parsed.id) return parsed.id;
      }
    } catch (err) {
      console.debug("getAuctionMasterIdFromStorage: failed to parse user_data", err);
    }
  }

  const email = localStorage.getItem("user_email");
  return email || null;
}

export default function CreateAuction() {
  const [logo, setLogo] = useState(null);
  const navigate = useNavigate();

  const [plants, setPlants] = useState([]);
  const [selectedPlantId, setSelectedPlantId] = useState(null);
  const [plantMedia, setPlantMedia] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [remainingContainers, setRemainingContainers] = useState(null);

  const [startTime, setStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);


  useEffect(() => {
    // het logo ophalen uit de database (altijd media ID 1)
    const mediaId = 1;
    fetch(`${API_BASE}/api/Media/${mediaId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch media');
        return res.json();
      })
      .then(m => {
        const normalizedUrl = m.url && !m.url.startsWith('/') ? `/${m.url}` : m.url;
        setLogo({ url: `${API_BASE}${normalizedUrl}`, alt: m.alt_text });
      })
      .catch(() => {});

    fetchPlants();
  }, []);

    // wanneer selectedPlantId verandert, media en containers ophalen
  useEffect(() => {
    if (selectedPlantId !== null) {
      fetchMediaForPlant(selectedPlantId);
      fetchRemainingContainers(selectedPlantId);
    } else {
      setPlantMedia([]);
      setSelectedImageIndex(0);
      setRemainingContainers(null);
    }
  }, [selectedPlantId]);

    // fetch alle planten
  async function fetchPlants() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/Plants`);
      if (!res.ok) throw new Error(`Failed to load plants: ${res.status}`);
      const data = await res.json();
      setPlants(data);
      if (data.length > 0) {
        setSelectedPlantId((prev) => prev ?? data[0].plant_id);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load plants.");
    } finally {
      setLoading(false);
    }
  }

    // fetch media voor geselecteerde plant
  async function fetchMediaForPlant(plantId) {
    setPlantMedia([]);
    setSelectedImageIndex(0);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/MediaPlant`);
      if (!res.ok) {
        console.warn("Failed to load MediaPlant:", res.status);
        setPlantMedia([]);
        return;
      }
      const payload = await res.json();
      if (!Array.isArray(payload)) {
        const single = payload || [];
        const filtered = single.filter ? single.filter((m) => m.plant_id === plantId) : [];
        setPlantMedia(filtered);
        setSelectedImageIndex(0);
        return;
      }

      const mediaForPlant = payload.filter((m) => Number(m.plant_id) === Number(plantId));

      mediaForPlant.sort((a, b) => {
        const ai = a.is_primary ? 0 : 1;
        const bi = b.is_primary ? 0 : 1;
        return ai - bi;
      });

      setPlantMedia(mediaForPlant);
      setSelectedImageIndex(0);
    } catch (err) {
      console.warn("error fetching media for plant", plantId, err);
      setPlantMedia([]);
    }
    }

    // fetch remaining containers voor geselecteerde plant
  async function fetchRemainingContainers(plantId) {
    try {
      const res = await fetch(`${API_BASE}/api/AuctionLots`);
      if (!res.ok) {
        console.warn("Failed to load AuctionLots:", res.status);
        setRemainingContainers(null);
        return;
      }
      const lots = await res.json();
      const plantLot = Array.isArray(lots) 
        ? lots.find(l => Number(l.plant_id) === Number(plantId))
        : null;
      
      setRemainingContainers(plantLot?.remaining_quantity ?? 0);
    } catch (err) {
      console.warn("error fetching auction lots", err);
      setRemainingContainers(null);
    }
  }

  function onPrevImage() {
    setSelectedImageIndex((i) => {
      if (plantMedia.length === 0) return 0;
      return (i - 1 + plantMedia.length) % plantMedia.length;
    });
  }
  function onNextImage() {
    setSelectedImageIndex((i) => {
      if (plantMedia.length === 0) return 0;
      return (i + 1) % plantMedia.length;
    });
  }

  function onThumbnailClick(idx) {
    setSelectedImageIndex(idx);
  }

  function getSelectedPlant() {
    return plants.find((p) => p.plant_id === selectedPlantId) ?? null;
  }

  async function onCreateAuction(e) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const auctionmaster_id = getAuctionMasterIdFromStorage();
    console.debug("onCreateAuction: auctionmaster_id from storage =>", auctionmaster_id);
    console.debug("localStorage keys:", {
      auctionMasterId: localStorage.getItem("auctionMasterId"),
      user_data: localStorage.getItem("user_data"),
      user_email: localStorage.getItem("user_email"),
      user_roles: localStorage.getItem("user_roles")
    });

    if (!auctionmaster_id) {
      setError("Auction Master ID not found (not logged in). Open DevTools Console and verify localStorage keys.");
      return;
    }
    if (!selectedPlantId) {
      setError("Select a plant first.");
      return;
    }
    if (remainingContainers <= 0) {
      setError("Cannot create auction: no containers available for this plant.");
      return;
    }
    if (!startTime || !durationMinutes) {
      setError("Provide both start time and auction duration.");
      return;
    }

    const duration = parseInt(durationMinutes, 10);
    if (isNaN(duration) || duration <= 0) {
      setError("Auction duration must be a positive number (in minutes).");
      return;
    }

      // zorgt ervoor dat de start_time in UTC wordt opgeslagen
    const localDate = new Date(startTime);
    const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
    const startIso = utcDate.toISOString();
    
    const payload = {
      auctionmaster_id,
      plant_id: Number(selectedPlantId),
      status: "upcoming",
      start_time: startIso,  
      duration_minutes: duration
    };

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/Auctions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Save failed: ${res.status} ${txt}`);
      }
      const created = await res.json();
      setSuccessMessage("Auction created successfully.");
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError("Failed to create auction. " + err.message);
    } finally {
      setSaving(false);
    }
  }

  const selectedPlant = getSelectedPlant();
  const selectedImage = plantMedia[selectedImageIndex];
  const isCreateDisabled = remainingContainers === null || remainingContainers <= 0 || saving;

  return (
    <div className="create-auction-page">
      <div className="create-auction-topbar" role="banner" aria-label="top-logo">
        {logo ? (
          <img src={resolveMediaUrl(logo.url)} alt={logo.alt} className="top-logo" />
        ) : (
          <span className="loading-label">Loading</span>
        )}
      </div>

      <h2 className="create-auction-header">Create Auction</h2>

      <div className="create-auction-grid">
        <div className="left-panel">
          <div className="carousel">
            <button aria-label="previous image" onClick={onPrevImage} className="arrow-button" type="button">
              <svg className="icon-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="image-wrapper">
              {selectedImage ? (
                <img src={resolveMediaUrl(selectedImage.url)} alt={selectedImage.alt_text || "plant image"} />
              ) : (
                <div style={{ color: "#333" }}>No image</div>
              )}
            </div>
            <button aria-label="next image" onClick={onNextImage} className="arrow-button" type="button">
              <svg className="icon-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="thumbnails">
            {plantMedia.length > 0 ? plantMedia.map((m, idx) => (
              <button
                key={m.mediaplant_id ?? m.media_id ?? idx}
                onClick={() => onThumbnailClick(idx)}
                className={`thumbnail ${idx === selectedImageIndex ? "selected" : ""}`}
                type="button"
              >
                <img src={resolveMediaUrl(m.url)} alt={m.alt_text} />
              </button>
            )) : (
              <div style={{ color: "#fff", padding: 8 }}>No thumbnails</div>
            )}
          </div>
        </div>

        <div className="middle-panel">
          <label className="label">Plant name</label>
          <input className="input" type="text" readOnly value={selectedPlant?.productname ?? ""} />

          <label className="label">Plant Category</label>
          <input className="input" type="text" readOnly value={selectedPlant?.category ?? ""} />

          <label className="label">Start Price</label>
          <input className="input" type="text" readOnly value={selectedPlant?.start_price ?? ""} />

          <label className="label">Min price</label>
          <input className="input" type="text" readOnly value={selectedPlant?.min_price ?? ""} />

          <label className="label">Remaining Containers</label>
          <input 
            className="input" 
            type="text" 
            readOnly 
            value={remainingContainers === null ? "Loading..." : remainingContainers}
            style={remainingContainers === 0 ? { color: "#d32f2f" } : {}}
          />

          <label className="label">Description</label>
          <textarea className="input" readOnly value={selectedPlant?.desc ?? ""} rows={7} />
        </div>

        <div className="right-panel">
          <label className="label">Select Plant</label>
          <select
            className="input"
            value={selectedPlantId ?? ""}
            onChange={(e) => setSelectedPlantId(Number(e.target.value))}
          >
            {plants.map((p) => (
              <option key={p.plant_id} value={p.plant_id}>
                {p.productname}
              </option>
            ))}
          </select>

          <label className="label">Start Time</label>
          <input
            className="input"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />

          <label className="label">Auction Duration (minutes)</label>
          <input
            className="input"
            type="number"
            min="1"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            placeholder="Enter duration in minutes"
          />

          <div style={{ marginTop: 20 }}>
            <button onClick={onCreateAuction} disabled={isCreateDisabled} className="create-btn">
              {saving ? "Creating..." : "Create Auction"}
            </button>
            <button onClick={() => window.history.back()} className="cancel-btn" type="button">Cancel</button>
          </div>

          {error && <div className="error">{error}</div>}
          {successMessage && <div className="success">{successMessage}</div>}
        </div>
      </div>

      <NavigationDropdownMenu navigateFn={(p) => navigate(p)} />
      <AccountDropdownMenu />
    </div>
  );
}
