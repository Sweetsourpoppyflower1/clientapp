import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/supplierPages/sEditPlantStyle.css';
import AccountDropdownMenu from "../../dropdown_menus/account_menus/master/account_dropdown_menu";
import SupplierNavigationDropdownMenu from "../../dropdown_menus/navigation_menus/supplier/supplier_navigation_dropdown_menu";

const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
const resolveUrl = (url = "") =>
    !url ? "" : url.startsWith("http") ? url : `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;

const fetchMaybe = async (url) => {
    try {
        const r = await fetch(url, { credentials: "same-origin" });
        return r.ok ? r.json() : null;
    } catch { return null; }
};

export default function SEditPlant() {
    const { plantId } = useParams();
    const navigate = useNavigate();
    
    const [logo, setLogo] = useState(null);
    const [plantData, setPlantData] = useState(null);
    const [plantImage, setPlantImage] = useState(null);
    const [minPrice, setMinPrice] = useState('');
    const [startPrice, setStartPrice] = useState('');
    const [currentContainers, setCurrentContainers] = useState(0);
    const [containersToAdd, setContainersToAdd] = useState('');
    const [auctionLotId, setAuctionLotId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    // Fetch logo and plant data together
    useEffect(() => {
        const mediaId = 1;
        fetch(`${API_BASE}/api/Media/${mediaId}`)
            .then(res => res.ok ? res.json() : null)
            .then(m => {
                if(m) {
                    const normalizedUrl = m.url && !m.url.startsWith('/') ? `/${m.url}` : m.url;
                    setLogo({ url: `${API_BASE}${normalizedUrl}`, alt: m.alt_text });
                }
            })
            .catch(() => {});
        
        const load = async () => {
            if (!plantId || plantId === 'undefined') {
                setError('Invalid plant ID in URL');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // Fetch plant data
                const plant = await fetchMaybe(`${API_BASE}/api/Plants/${plantId}`);
                
                if (!plant) {
                    setError('Plant not found or access denied');
                    setPlantData(null);
                    setIsLoading(false);
                    return;
                }

                setPlantData(plant);
                setMinPrice(String(plant.minPrice || plant.min_price || ''));
                setStartPrice(String(plant.startPrice || plant.start_price || ''));

                // Fetch plant images
                const mediaAll = await fetchMaybe(`${API_BASE}/api/MediaPlant`);
                let imageUrl = null;
                if (Array.isArray(mediaAll)) {
                    const plantMedia = mediaAll.filter(m => Number(m.plant_id) === Number(plant.plant_id));
                    if (plantMedia.length > 0) {
                        // Sort to get primary image first
                        plantMedia.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
                        imageUrl = resolveUrl(plantMedia[0].url);
                    }
                }
                setPlantImage(imageUrl);

                // Fetch auction lot data
                const lots = await fetchMaybe(`${API_BASE}/api/AuctionLots`);
                if (Array.isArray(lots)) {
                    const plantLot = lots.find(l => Number(l.plant_id) === Number(plant.plant_id));
                    if (plantLot) {
                        setAuctionLotId(plantLot.auctionlot_id);
                        setCurrentContainers(plantLot.remaining_quantity || 0);
                    }
                }

                setError(null);

            } catch (err) {
                console.error("Failed to load plant", err);
                setError('Failed to load plant data');
                setPlantData(null);
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, [plantId]);

    const handleSave = async () => {
        if (!plantData) return;

        const minPriceNum = parseFloat(minPrice);
        const startPriceNum = parseFloat(startPrice);

        if (isNaN(minPriceNum) || isNaN(startPriceNum)) {
            alert('Please enter valid prices');
            return;
        }

        if (minPriceNum < 0 || startPriceNum < 0) {
            alert('Prices cannot be negative');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const updatedPlant = {
                plant_id: plantData.plant_id,
                productname: plantData.productname,
                supplier_id: plantData.supplier_id,
                category: plantData.category,
                form: plantData.form,
                quality: plantData.quality,
                maturity: plantData.maturity,
                min_stem: plantData.min_stem,
                stems_bunch: plantData.stems_bunch,
                desc: plantData.desc,
                min_price: minPriceNum,
                start_price: startPriceNum
            };

            console.log('Saving plant with data:', updatedPlant);

            const response = await fetch(`${API_BASE}/api/Plants/${plantData.plant_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(updatedPlant)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Save error response:', errorText);
                throw new Error(`Failed to save plant: ${response.status}`);
            }

            alert('Plant prices updated successfully!');
            navigate(-1);
        } catch (err) {
            console.error('Error saving plant:', err);
            setError('Error saving plant: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddContainers = async () => {
        if (!auctionLotId) {
            alert('Auction lot not found');
            return;
        }

        const containersNum = parseInt(containersToAdd, 10);
        if (isNaN(containersNum) || containersNum <= 0) {
            alert('Please enter a valid number of containers to add');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const newTotal = currentContainers + containersNum;
            const updatedLot = {
                auctionlot_id: auctionLotId,
                plant_id: plantData.plant_id,
                remaining_quantity: newTotal,
                unit_per_container: 0,
                min_pickup: 0
            };

            console.log('Updating auction lot with data:', updatedLot);

            const response = await fetch(`${API_BASE}/api/AuctionLots/${auctionLotId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(updatedLot)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Save error response:', errorText);
                throw new Error(`Failed to update containers: ${response.status}`);
            }

            setCurrentContainers(newTotal);
            setContainersToAdd('');
            alert(`Successfully added ${containersNum} containers. Total: ${newTotal}`);
        } catch (err) {
            console.error('Error updating containers:', err);
            setError('Error updating containers: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        navigate(-1);
    };

    if (isLoading) return <div className="sedit-plant"><span>Loading…</span></div>;

    if (error) return <div className="sedit-plant"><span style={{ color: 'red' }}>⚠ {error}</span></div>;

    if (!plantData) return <div className="sedit-plant"><span>Plant not found</span></div>;

    return (
        <div className="sedit-plant" aria-label="edit-plant-page">
            <header className="sep-topbar">
                <div className="sep-logo" role="region" aria-label="logo-section">
                    {logo ? (
                        <img src={logo.url} alt={logo.alt} className="top-logo" />
                    ) : (
                        <span className="loading-label">Loading…</span>
                    )}
                </div>
            </header>

            <div className="sep-content-section" role="region" aria-label="edit-content">
                <div className="sep-left-panel">
                    <div className="sep-plant-image-container">
                        {plantImage ? (
                            <img
                                src={plantImage}
                                alt={plantData.productname || plantData.name}
                                className="sep-plant-image"
                            />
                        ) : (
                            <div className="sep-image-placeholder">No image available</div>
                        )}
                    </div>

                    <div className="sep-plant-info">
                        <div className="sep-plant-info-item">
                            <label className="sep-plant-info-label">Product Name:</label>
                            <span className="sep-plant-info-value">{plantData.productname || plantData.name || 'N/A'}</span>
                        </div>
                        <div className="sep-plant-info-item">
                            <label className="sep-plant-info-label">Category:</label>
                            <span className="sep-plant-info-value">{plantData.category || 'N/A'}</span>
                        </div>
                        <div className="sep-plant-info-item">
                            <label className="sep-plant-info-label">Form:</label>
                            <span className="sep-plant-info-value">{plantData.form || 'N/A'}</span>
                        </div>
                        <div className="sep-plant-info-item">
                            <label className="sep-plant-info-label">Quality:</label>
                            <span className="sep-plant-info-value">{plantData.quality || 'N/A'}</span>
                        </div>
                        <div className="sep-plant-info-item">
                            <label className="sep-plant-info-label">Maturity:</label>
                            <span className="sep-plant-info-value">{plantData.maturity || 'N/A'}</span>
                        </div>
                        <div className="sep-plant-info-item">
                            <label className="sep-plant-info-label">Min Stem Length:</label>
                            <span className="sep-plant-info-value">{plantData.min_stem || 'N/A'} cm</span>
                        </div>
                        <div className="sep-plant-info-item">
                            <label className="sep-plant-info-label">Stems per Bunch:</label>
                            <span className="sep-plant-info-value">{plantData.stems_bunch || 'N/A'}</span>
                        </div>
                        <div className="sep-plant-info-item">
                            <label className="sep-plant-info-label">Description:</label>
                            <span className="sep-plant-info-value">{plantData.desc || plantData.description || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="sep-right-panel">
                    <div className="sep-form-section">
                        <h3>Edit Pricing</h3>
                        <div className="sep-form-group">
                            <label htmlFor="minPrice">Minimum Price (€)</label>
                            <input
                                id="minPrice"
                                type="number"
                                step="0.01"
                                min="0"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                placeholder="Enter minimum price"
                                disabled={isSaving}
                            />
                        </div>
                        <div className="sep-form-group">
                            <label htmlFor="startPrice">Starting Price (€)</label>
                            <input
                                id="startPrice"
                                type="number"
                                step="0.01"
                                min="0"
                                value={startPrice}
                                onChange={(e) => setStartPrice(e.target.value)}
                                placeholder="Enter starting price"
                                disabled={isSaving}
                            />
                        </div>

                        <div className="sep-current-prices">
                            <div className="sep-current-price-item">
                                <label>Current Min Price:</label>
                                <span>€{plantData.minPrice || plantData.min_price || '0.00'}</span>
                            </div>
                            <div className="sep-current-price-item">
                                <label>Current Start Price:</label>
                                <span>€{plantData.startPrice || plantData.start_price || '0.00'}</span>
                            </div>
                        </div>

                        <div className="sep-button-group">
                            <button 
                                className="sep-btn sep-btn-primary" 
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button 
                                className="sep-btn sep-btn-secondary" 
                                onClick={handleCancel}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                    <div className="sep-form-section" style={{ marginTop: '30px', paddingTop: '30px', borderTop: '1px solid #ddd' }}>
                        <h3>Manage Containers</h3>
                        <div className="sep-form-group">
                            <label>Current Containers:</label>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d5016', marginBottom: '15px' }}>
                                {currentContainers} containers
                            </div>
                        </div>
                        <div className="sep-form-group">
                            <label htmlFor="containersToAdd">Add Containers</label>
                            <input
                                id="containersToAdd"
                                type="number"
                                min="1"
                                value={containersToAdd}
                                onChange={(e) => setContainersToAdd(e.target.value)}
                                placeholder="Enter number of containers to add"
                                disabled={isSaving}
                            />
                        </div>

                        <button 
                            className="sep-btn sep-btn-primary" 
                            onClick={handleAddContainers}
                            disabled={isSaving || !containersToAdd}
                            style={{ width: '100%' }}
                        >
                            {isSaving ? 'Updating...' : 'Add Containers'}
                        </button>
                    </div>
                </div>
            </div>

            <AccountDropdownMenu />
            <SupplierNavigationDropdownMenu navigateFn={(path) => navigate(path)} />
        </div>
    );
}
