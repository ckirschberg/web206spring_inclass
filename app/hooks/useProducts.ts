"use client";

import { useCallback, useEffect, useState } from "react";
import { Product } from "../../types/product";

export function useProducts() {
    const [products, setProducts] = useState([] as Product[])
    // We want to store the products here in a state variable
    const baseUrl = ""; //'http://localhost:8080' // Your docker python backend in the future
    // READ — fetch all products
    //
    // useCallback prevents a new function from being created on every render.
    // This is REQUIRED here because fetchProducts is used as a dependency in
    // the useEffect below. Without useCallback, every render would produce a
    // new function reference, which would trigger the effect again, causing
    // another fetch, another state update, another render — an infinite loop.
    // The empty array [] means the function is only created once (on mount).
    const fetchProducts = useCallback(async () => {
        const response = await fetch(baseUrl+"/api/products", {
            method: 'GET'
        })
        //console.log(response);
        setProducts(await response.json())
        // MSW intercepts this URL and returns the in-memory store.
        // When the real backend is ready, replace "/api/products" with
        // your actual API base URL, e.g. "https://api.example.com/products"
        // or an environment variable like `${process.env.NEXT_PUBLIC_API_URL}/products`
    }, []);

    // useEffect runs *after* the component mounts (appears on screen).
    // The function inside it calls fetchProducts to load the data from the API.
    // The dependency array [fetchProducts] tells React: "re-run this effect
    // whenever fetchProducts changes". Because fetchProducts is wrapped in
    // useCallback with [], it never changes — so this effect runs exactly once,
    // on mount. This is the standard pattern for fetching data when a page loads.
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // CREATE
    //
    // useCallback here is optional (there is no useEffect depending on it),
    // but it is a good habit: if this function is passed as a prop to a child
    // component wrapped in React.memo (tells React to skip re-rendering a component 
    // if its props haven't changed.), a stable reference prevents that child
    // from re-rendering unnecessarily every time the parent renders.
    const createProduct = useCallback(async (data: Omit<Product, "id">) => {
        // MSW handles POST and returns the new product with an auto-generated id.
        // With a real backend this fetch call stays exactly the same —
        // just make sure the server also responds with the created product (201).
        const response = await fetch(baseUrl+"/api/products", {
            method: 'POST',
            // headers: {
            //     'Content-Type': 'application/json'
            // },
            body: JSON.stringify(data)
        })
        const product = await response.json()
        //console.log(product)
        setProducts(products => [...products, product])

    }, []);

    // UPDATE — same reasoning as createProduct above
    const updateProduct = useCallback(async (id: number, data: Partial<Omit<Product, "id">>) => {
        // MSW handles PUT and merges the fields in the in-memory store.
        // Some REST APIs use PATCH instead of PUT for partial updates —
        // change method: "PUT" to method: "PATCH" if your backend requires it.
    }, []);

    // DELETE — same reasoning as createProduct above
    const deleteProduct = useCallback(async (id: number) => {
        // MSW handles DELETE and returns 204 No Content.
        // The real backend should also return 204 for this to work as-is.
        // If it returns 200 with a body instead, no changes are needed here
        // since we don't read the response body.
    }, []);

    return { products, createProduct, updateProduct, deleteProduct };
}

