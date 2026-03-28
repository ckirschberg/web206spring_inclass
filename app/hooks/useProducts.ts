"use client";

import { useCallback, useEffect, useState } from "react";
import { Product } from "../../types/product";

export function useProducts(search: string = "") {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // READ — fetch all products
    //
    // useCallback prevents a new function from being created on every render.
    // This is REQUIRED here because fetchProducts is used as a dependency in
    // the useEffect below. Without useCallback, every render would produce a
    // new function reference, which would trigger the effect again, causing
    // another fetch, another state update, another render — an infinite loop.
    // The search string IS in the dependency array [] so the function is
    // recreated (and the effect re-runs) whenever the search term changes.
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // MSW intercepts this URL and returns the in-memory store.
            // When the real backend is ready, replace "/api/products" with
            // your actual API base URL, e.g. "https://api.example.com/products"
            // or an environment variable like `${process.env.NEXT_PUBLIC_API_URL}/products`
            //
            // The ?search= query param is sent to the server so filtering
            // happens there — only matching products are returned.
            const url = search
                ? `/api/products?search=${encodeURIComponent(search)}`
                : "/api/products";
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch products");
            setProducts(await res.json());
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }, [search]);

    // useEffect runs *after* the component mounts (appears on screen).
    // The function inside it calls fetchProducts to load the data from the API.
    // The dependency array [fetchProducts] tells React: "re-run this effect
    // whenever fetchProducts changes". Because fetchProducts is wrapped in
    // useCallback with [], it never changes — so this effect runs exactly once,
    // on mount. This is the standard pattern for fetching data when a page loads.
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // CREATE — same reasoning as createProduct above
    //
    // OPTIMISTIC UI: add a temporary product to the list immediately with a
    // negative temp ID, so the row appears before the server responds.
    // When the server replies, swap the temp item for the real one (with the
    // real ID). If the server fails, remove the temp item (rollback).
    const createProduct = useCallback(async (data: Omit<Product, "id">) => {
        const tempId = -Date.now();
        const tempProduct: Product = { id: tempId, ...data };
        setProducts((prev) => [...prev, tempProduct]); // optimistic add
        try {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to create product");
            const created: Product = await res.json();
            // Replace temp placeholder with the real product from the server
            setProducts((prev) => prev.map((p) => (p.id === tempId ? created : p)));
            return created;
        } catch (e) {
            setProducts((prev) => prev.filter((p) => p.id !== tempId)); // rollback
            throw e;
        }
    }, []);

    // UPDATE — same reasoning as createProduct above
    //
    // OPTIMISTIC UI: apply the new field values to the local list immediately,
    // then confirm with the server. Rollback to the original list if it fails.
    const updateProduct = useCallback(async (id: number, data: Partial<Omit<Product, "id">>) => {
        // MSW handles PUT and merges the fields in the in-memory store.
        // Some REST APIs use PATCH instead of PUT for partial updates —
        // change method: "PUT" to method: "PATCH" if your backend requires it.
        let previousProducts: Product[] = [];
        setProducts((prev) => {
            previousProducts = prev;
            return prev.map((p) => (p.id === id ? { ...p, ...data } : p)); // optimistic update
        });
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update product");
            const updated: Product = await res.json();
            // Confirm with the server's canonical version
            setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
            return updated;
        } catch (e) {
            setProducts(previousProducts); // rollback
            throw e;
        }
    }, []);

    // DELETE — same reasoning as createProduct above
    //
    // OPTIMISTIC UI: remove the product from the list immediately so the row
    // disappears at once. Rollback (restore the list) if the server fails.
    const deleteProduct = useCallback(async (id: number) => {
        // MSW handles DELETE and returns 204 No Content.
        // The real backend should also return 204 for this to work as-is.
        // If it returns 200 with a body instead, no changes are needed here
        // since we don't read the response body.
        let previousProducts: Product[] = [];
        setProducts((prev) => {
            previousProducts = prev;
            return prev.filter((p) => p.id !== id); // optimistic remove
        });
        try {
            const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete product");
        } catch (e) {
            setProducts(previousProducts); // rollback
            throw e;
        }
    }, []);

    return { products, loading, error, createProduct, updateProduct, deleteProduct };
}

