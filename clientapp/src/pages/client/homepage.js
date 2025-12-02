import React, {useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/homepage.css";

function Homepage() {
    const navigate = useNavigate();

    // UseState, een tijdelijk opslag van de productenlijst
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // actieve product en volgende producten
    const activeProduct = products[0];
    const nextProducts = products.slice(1, 4);


    useEffect(() => {
        const fetchProducts = async () => {
            try {
                console.log("Gestart met ophalen uit Veilingsproducten... ~ lex");
                const response = await fetch("https://localhost:7036/api/plant");
                if (response.ok) {
                    console.log("Netwerk reactie was ok...");
                }
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                console.log("Antwoord ontvangen, omzetten naar JSON... ~ lex");
                const data = await response.json();
                setProducts(data);
                console.log("Laden is gelukt! ~ lex");
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);


    if (loading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="homepage-container">
            {/* linker kolom Actief Veilingproduct */}
            <div className="homepage-column left-column">
                <h3 className="column-title">{activeProduct.p_productname}</h3>
                <div className="product-card active-product">
                    <div className="product-image-container">
                        <img src={activeProduct.Foto} alt={activeProduct.p_productname} className="product-image" />
                    </div>
                    <div className="product-info">
                        <h4 className="product-name">{activeProduct.p_productname}</h4>
                        <p className="product-description">
                            {activeProduct.p_desc}
                        </p>
                    </div>
                </div>
            </div>

            {/* homepagina - welkomsectie */}
            <div className="homepage-column center-column">
                <div className="welcome-section">
                    <p className="welcome-text">
                        Welcome to the HomePage of Flauction; the best Flora Auction Clock to date! Navigate to the Auction from here, or log out.
                    </p>
                    
                    <div className="button-section">
                        <h4 className="button-title">Go to Auction</h4>
                        <p className="button-subtitle">Click below to go to the live Auction</p>
                        <button className="auction-button" onClick={() => navigate('/ActiveAuctions')}>
                            AUCTION
                        </button>
                    </div>

                    <div className="button-section">
                        <p className="button-subtitle">Click below to view the next Products</p>
                        <button className="next-products-button" onClick={() => navigate('/UpcomingAuctions')}>
                            NEXT PRODUCTS
                        </button>
                    </div>
                </div>
            </div>

            {/* Rechterkolom volgende veilingsproducten */}
            <div className="homepage-column right-column">
                <h3 className="column-title">Next Auction Products</h3>
                <div className="next-products-list">
                    {nextProducts.map((product) => (
                        <div key={product.plant_id} className="product-card next-product">
                            <div className="product-image-container-small">
                                <img src={product.Foto} alt={product.p_productname} className="product-image-small" />
                            </div>
                            <div className="product-info-small">
                                <h4 className="product-name-small">{product.p_productname}</h4>
                                <p className="product-description-small">
                                    {product.p_desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Homepage;
