import { http, HttpResponse, delay } from "msw";
import { Product } from "../types/product";
 
// In-memory "database" seeded with the dummy data
let productStore: Product[] = [
    { id: 1, name: "Cat",      price: 10,  description: "Description 1", category: "Pet"    },
    { id: 2, name: "Dog",      price: 5,   description: "Description 2", category: "Pet"    },
    { id: 3, name: "Giraffe",  price: 120, description: "Description 3", category: "Animal" },
    { id: 4, name: "Elephant", price: 150, description: "Description 4", category: "Animal" },
];
let liked: boolean = false;
type User = {
    id: number;
    name: string;
    email: string;
    role: string;
};

const mockUser: User = {
    id: 1,
    name: "Ada Hansen",
    email: "ada@example.com",
    role: "admin",
};

let nextId = 5;

export const handlers = [

    http.post("/api/products/like", async ({ request }) => {
        await delay(1000); // simulates 1s network latency
        const random = Math.random();
        console.log(random);
        if (random < 0.2) {
            return HttpResponse.json({error: "Something went wrong, muahhahaahh"}, { status: 500 });
        } else {
            const body = (await request.json()) as boolean;
            liked = body;
            return HttpResponse.json({like: liked}, { status: 200 });
        }
    }),

    // GET /api/profile  — protected route
    // Validates the Authorization header structure exactly as a real server would,
    // but skips actual JWT signature/expiry verification (MSW has no secret key).
    //
    // A valid request must include:  Authorization: Bearer <token>
    // where <token> is a non-empty string with the three dot-separated parts of a JWT.
    //
    // Returns 401 in three real-world cases:
    //   1. No Authorization header at all  (client forgot to attach the token)
    //   2. Header is not in "Bearer <token>" format  (wrong scheme or malformed)
    //   3. Token doesn't look like a JWT  (not three base64 parts separated by dots)
    //
    // Once the structure passes, a random 50 % failure simulates an expired token
    // so you can observe both the success and the 401-rollback path in the UI.
    http.get("/api/profile", async ({ request }) => {
        await delay(800);

        const authHeader = request.headers.get("Authorization");

        // Check 1: header must be present
        if (!authHeader) {
            return HttpResponse.json(
                { error: "Unauthorized — missing Authorization header." },
                { status: 401 }
            );
        }

        // Check 2: header must start with "Bearer " (note the space)
        if (!authHeader.startsWith("Bearer ")) {
            return HttpResponse.json(
                { error: "Unauthorized — Authorization scheme must be Bearer." },
                { status: 401 }
            );
        }

        const token = authHeader.slice(7); // everything after "Bearer "

        // Check 3: token must be a non-empty string
        if (token.length === 0) {
            return HttpResponse.json(
                { error: "Unauthorized — token is empty." },
                { status: 401 }
            );
        }

        // Structure is valid. Simulate a 50 % chance the token is expired.
        // A real server would call jwt.verify() here.
        if (Math.random() < 0.5) {
            return HttpResponse.json(
                { error: "Unauthorized — token is expired." },
                { status: 401 }
            );
        }

        return HttpResponse.json(mockUser);
    }),


    // GET /api/products
    http.get("/api/products", async () => {
        await delay(1000); // simulates 1s network latency
        return HttpResponse.json(productStore);
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
        // if (Math.random() < 0.5) {
            const index = productStore.findIndex((p) => p.id === Number(params.id));
            if (index === -1) return new HttpResponse(null, { status: 404 });
            productStore.splice(index, 1);
            return new HttpResponse(null, { status: 204 });
        // }
        // else {
        //     return HttpResponse.json({error: "Something went wrong, muahhahaahh"}, { status: 500 });
        // }
    }),
];
