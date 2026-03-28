"use client"

import Link from "next/link";
import ProductCard from "../../components/ProductCard";
import { useState, useEffect } from "react";
import Cart from "../../components/Cart";
import { useCart } from "../hooks/useCart";
import { useProducts } from "../hooks/useProducts";
import { MSWProvider } from "../../components/MSWProvider";

// Wrap in MSWProvider so the service worker is active before any fetch is made
export default function ProductsPage() {
    return (
        <MSWProvider>
            <Products />
        </MSWProvider>
    );
}

function Products() {
    const { addToCart, cartItems, cartItemCount } = useCart();
    const [search, setSearch] = useState("");

    // Debounce: wait until the user stops typing for 300ms before updating
    // debouncedSearch. Each keystroke resets the timer via the cleanup function.
    // This prevents a fetch request on every single keystroke.
    const [debouncedSearch, setDebouncedSearch] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Pass the debounced value — the hook only re-fetches after typing pauses.
    // No client-side filtering needed; the server returns only matching products.
    const { products: filteredProducts, loading } = useProducts(debouncedSearch);

    return (
        <div>
            <Cart cart={cartItems} cartItemCount={cartItemCount}></Cart>
            <h1>Products</h1>
            <h2>Item count in cart: {cartItemCount}</h2>
            <input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />

            {loading && <p>Loading products…</p>}

            <div className="grid">
                {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} 
                        setCartItemCount={() => addToCart(product)}/>
                ))}
            </div>
            {!loading && filteredProducts.length===0 && <p>No products found</p>}

            <Link href="/products/2">Product 2</Link>
        </div>
    );
}