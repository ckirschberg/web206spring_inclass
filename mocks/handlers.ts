import { http, HttpResponse, delay } from "msw";
import { Product } from "../types/product";
 
// In-memory "database" seeded with the dummy data
let productStore: Product[] = [
    { id: 1, name: "Cat",      price: 10,  description: "Description 1", category: "Pet"    },
    { id: 2, name: "Dog",      price: 5,   description: "Description 2", category: "Pet"    },
    { id: 3, name: "Giraffe",  price: 120, description: "Description 3", category: "Animal" },
    { id: 4, name: "Elephant", price: 150, description: "Description 4", category: "Animal" },
];

let nextId = 5;

export const handlers = [
    // GET /api/products
    // Supports optional ?search= query parameter for server-side filtering.
    // The server checks the query against name, category and price —
    // exactly what a real backend search endpoint would do.
    http.get("/api/products", async ({ request }) => {
        await delay(1000); // simulates 1s network latency
        const url = new URL(request.url);
        const search = url.searchParams.get("search")?.toLowerCase() ?? "";

        const results = search
            ? productStore.filter(
                  (p) =>
                      p.name.toLowerCase().includes(search) ||
                      p.category.toLowerCase().includes(search) ||
                      p.price < Number(search)
              )
            : productStore;

        return HttpResponse.json(results);
    }),

    // GET /api/products/:id
    http.get("/api/products/:id", async ({ params }) => {
        await delay(1000); // simulates 1s network latency
        const product = productStore.find((p) => p.id === Number(params.id));
        if (!product) return new HttpResponse(null, { status: 404 });
        return HttpResponse.json(product);
    }),

    // POST /api/products
    http.post("/api/products", async ({ request }) => {
        await delay(1000); // simulates 1s network latency
        const body = (await request.json()) as Omit<Product, "id">;
        const newProduct: Product = { id: nextId++, ...body };
        productStore.push(newProduct);
        return HttpResponse.json(newProduct, { status: 201 });
    }),

    // PUT /api/products/:id
    http.put("/api/products/:id", async ({ params, request }) => {
        await delay(1000); // simulates 1s network latency
        const body = (await request.json()) as Partial<Product>;
        const index = productStore.findIndex((p) => p.id === Number(params.id));
        if (index === -1) return new HttpResponse(null, { status: 404 });
        productStore[index] = { ...productStore[index], ...body };
        return HttpResponse.json(productStore[index]);
    }),

    // DELETE /api/products/:id
    http.delete("/api/products/:id", async ({ params }) => {
        await delay(1000); // simulates 1s network latency
        const index = productStore.findIndex((p) => p.id === Number(params.id));
        if (index === -1) return new HttpResponse(null, { status: 404 });
        productStore.splice(index, 1);
        return new HttpResponse(null, { status: 204 });
    }),
];
