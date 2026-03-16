"use client"

import Link from "next/link";
import { products } from "../../dummy-data/products";
import ProductCard from "../../components/ProductCard";
import { useState } from "react";
import { log } from "console";

export default function Products() {
    const [search, setSearch] = useState("");
    const [cartItemCount, setCartItemCount] = useState(0); // 

    const filteredProducts = products.filter((prod) => 
        prod.name.toLowerCase().includes(search.toLowerCase()) ||
        prod.category.toLowerCase().includes(search.toLowerCase()) ||
        prod.price < Number(search)
    )
    //console.log(filteredProducts);
    const addToCart = () =>  {
        setCartItemCount(cartItemCount => cartItemCount+1);
    }

    return (
        <div>
            <h1>Products</h1>
            <h2>Item count in cart: {cartItemCount}</h2>
            <input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />

            {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} 
                    setCartItemCount={addToCart}/>
            ))}

            {filteredProducts.length===0 && <p>No products found</p>}

            <Link href="/products/2">Product 2</Link>
        </div>
    );
}