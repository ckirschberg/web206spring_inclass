"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { Product } from "../../types/product";

export function useProducts() {
    const queryClient = useQueryClient();
    const [error, setError] = useState("")
    const [liked, setLiked] = useState(false);

    // We want to store the products here in a state variable
    const baseUrl = ""; //'http://localhost:8080' // Your docker python backend in the future

    // ── WITHOUT TanStack Query ────────────────────────────────────────────────
    // Manual fetch pattern: we manage the products array, loading flag, and
    // effect ourselves.
    //
    // const [products, setProducts] = useState([] as Product[])
    // const [isLoading, setIsLoading] = useState(false);
    //
    // useCallback prevents a new function from being created on every render.
    // This is REQUIRED here because fetchProducts is used as a dependency in
    // the useEffect below. Without useCallback, every render would produce a
    // new function reference, which would trigger the effect again, causing
    // another fetch, another state update, another render — an infinite loop.
    // The empty array [] means the function is only created once (on mount).
    //
    // const fetchProducts = useCallback(async () => {
    //     setIsLoading(true);
    //     const response = await fetch(baseUrl + "/api/products", { method: "GET" });
    //     setProducts(await response.json());
    //     setIsLoading(false);
    // }, []);
    //
    // useEffect runs *after* the component mounts (appears on screen).
    // The dependency array [fetchProducts] tells React: "re-run this effect
    // whenever fetchProducts changes". Because fetchProducts is wrapped in
    // useCallback with [], it never changes — so this effect runs exactly once,
    // on mount. This is the standard pattern for fetching data when a page loads.
    //
    // useEffect(() => {
    //     fetchProducts();
    // }, [fetchProducts]);
    // ─────────────────────────────────────────────────────────────────────────

    // ── WITH TanStack Query ───────────────────────────────────────────────────
    // useQuery fetches and caches the product list automatically.
    // It replaces all of the manual code above.
    // TanStack Query handles: caching, deduplication, background refetching,
    // and loading/error states — no boilerplate needed.
    //
    // queryKey: ["products"] is the cache key. Any component that calls
    // useQuery with the same key shares the same cached result.
    const {
        data: products = [],
        isLoading,
        error: fetchError,
    } = useQuery<Product[]>({
        queryKey: ["products"],
        queryFn: () =>
            fetch(baseUrl + "/api/products").then((res) => res.json()),
    });
    // ─────────────────────────────────────────────────────────────────────────

    const voteUpLike = useCallback(async (like: boolean) => {
        setLiked(like => !like); // optimistic UI update because we dont know yet if the server-save works out.
        
        console.log("like is", like);
        const response = await fetch(baseUrl+"/api/products/like", {
            method: 'POST',
            // headers: {
            //     'Content-Type': 'application/json'
            // },
            body: JSON.stringify(!like) 
        })
        if (!response.ok) {
            setLiked(like => !like);
            alert("Something went wrong");
            return;
        }
        
    }, []);

    // CREATE
    //
    // ── WITHOUT TanStack useMutation (commented out) ──────────────────────────
    // Plain useCallback approach — we manage the fetch and cache update manually.
    //
    // const createProduct = useCallback(async (data: Omit<Product, "id">) => {
    //     const response = await fetch(baseUrl + "/api/products", {
    //         method: "POST",
    //         body: JSON.stringify(data),
    //     });
    //     const product = await response.json();
    //
    //     // ── WITHOUT TanStack Query ────────────────────────────────────────
    //     // Manually append to the local products state:
    //     // setProducts(products => [...products, product])
    //     // ─────────────────────────────────────────────────────────────────
    //
    //     // ── WITH TanStack Query ───────────────────────────────────────────
    //     // Option 1 — setQueryData: instant, no extra fetch:
    //     // queryClient.setQueryData<Product[]>(["products"], (old = []) => [...old, product])
    //     //
    //     // Option 2 — invalidateQueries: re-fetches from server to stay in sync:
    //     // queryClient.invalidateQueries({ queryKey: ["products"] })
    //     // ─────────────────────────────────────────────────────────────────
    // }, []);
    // ─────────────────────────────────────────────────────────────────────────

    // ── WITH TanStack useMutation ─────────────────────────────────────────────
    // useMutation is TanStack's way to handle CUD operations (Create, Update, Delete).
    // Benefits over plain useCallback:
    //   - isPending / isError / isSuccess states are tracked automatically.
    //   - onSuccess / onError / onSettled lifecycle hooks keep side-effects tidy.
    //   - No manual try/catch needed for standard error handling.
    //
    // mutationFn: the async function that performs the actual request.
    // onSuccess:  runs after mutationFn resolves. We update the cache here so
    //             the new product appears immediately without a refetch.
    const createMutation = useMutation({
        mutationFn: async (data: Omit<Product, "id">) => {
            // MSW handles POST and returns the new product with an auto-generated id.
            // With a real backend this fetch call stays exactly the same —
            // just make sure the server also responds with the created product (201).
            const response = await fetch(baseUrl + "/api/products", {
                method: "POST",
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed to create product");
            return response.json() as Promise<Product>;
        },
        onSuccess: (product) => {
            // Option 1 — setQueryData: append the new product directly to the cache.
            // No extra network request. Works because the server returned the full item.
            queryClient.setQueryData<Product[]>(["products"], (old = []) => [...old, product]);

            // Option 2 — invalidateQueries (commented out):
            // Re-fetches the full list. Use this if the server may have made
            // other changes you don't know about.
            // queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });

    // Wrap in a plain async function so the rest of the component API stays the same.
    // Callers use createProduct(data) exactly as before.
    const createProduct = (data: Omit<Product, "id">) => createMutation.mutateAsync(data);
    // ─────────────────────────────────────────────────────────────────────────

     const updateProduct = (id: number, data: Omit<Product, "id">) => updateMutation.mutateAsync({id, data});

     const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Omit<Product, "id">> }) => {
            // MSW handles POST and returns the new product with an auto-generated id.
            // With a real backend this fetch call stays exactly the same —
            // just make sure the server also responds with the created product (201).
            const response = await fetch(baseUrl + "/api/products/"+ id, {
                method: "PUT",
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed to update product");
            return response.json() as Promise<Product>;
        },
        onSuccess: (product) => {
            // Option 1 — setQueryData: append the new product directly to the cache.
            // No extra network request. Works because the server returned the full item.
            // queryClient.setQueryData<Product[]>(["products"], (old = []) => [...old, product]);

            // Option 2 — invalidateQueries (commented out):
            // Re-fetches the full list. Use this if the server may have made
            // other changes you don't know about.
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });
    // UPDATE — same reasoning as createProduct above
    // const updateProduct = useCallback(async (id: number, data: Partial<Omit<Product, "id">>) => {
    //     // MSW handles PUT and merges the fields in the in-memory store.
    //     // Some REST APIs use PATCH instead of PUT for partial updates —
    //     // change method: "PUT" to method: "PATCH" if your backend requires it.
    // }, []);

    const deleteProduct = (id: number) => deleteMutation.mutateAsync(id);
    // DELETE — same reasoning as createProduct above

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            // MSW handles DELETE and returns 204 No Content.
            // The real backend should also return 204 for this to work as-is.
            // If it returns 200 with a body instead, no changes are needed here
            // since we don't read the response body.
            console.log(id);
            const response = await fetch(baseUrl+"/api/products/"+id, {
                method: 'DELETE',
            })
            if (!response.ok) { // check for fejl.
                const res: any = await response.json();
            }
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });
        
    return { products, createProduct, updateProduct, deleteProduct, isLoading, isCreating: createMutation.isPending, error: error || fetchError?.message || "", voteUpLike, liked };
}

