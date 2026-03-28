"use client";

import { useState } from "react";
import { useProducts } from "../app/hooks/useProducts";
import { Product } from "../types/product";

type FormState = Omit<Product, "id">;

const empty: FormState = { name: "", price: 0, description: "", category: "" };

export default function CrudProductList() {
    const { products, loading, error, createProduct, updateProduct, deleteProduct } = useProducts();

    const [form, setForm] = useState<FormState>(empty);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    // Separate error state for mutations so we can show rollback feedback
    const [mutationError, setMutationError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: name === "price" ? Number(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMutationError(null);
        try {
            if (editingId !== null) {
                await updateProduct(editingId, form);
            } else {
                await createProduct(form);
            }
            setForm(empty);
            setEditingId(null);
        } catch (e) {
            // Server failed — the hook already rolled back the optimistic change
            setMutationError((e as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    const startEdit = (product: Product) => {
        setEditingId(product.id);
        setForm({ name: product.name, price: product.price, description: product.description, category: product.category });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm(empty);
    };

    return (
        <div className="container">
            <h1>Products (MSW CRUD demo — Optimistic UI)</h1>
            <p style={{ color: "#6b7280", marginTop: 0 }}>
                Changes appear <strong>instantly</strong> in the table — the UI updates before
                the server responds. If the server fails, the change is automatically rolled back.
            </p>

            {/* Form */}
            <form className="crud-form" onSubmit={handleSubmit}>
                <h2>{editingId !== null ? "Edit product" : "Add product"}</h2>
                <div className="crud-form__fields">
                    <input required name="name" placeholder="Name" value={form.name} onChange={handleChange} />
                    <input required name="price" type="number" min={0} placeholder="Price" value={form.price} onChange={handleChange} />
                    <input required name="category" placeholder="Category" value={form.category} onChange={handleChange} />
                    <input required name="description" placeholder="Description" value={form.description} onChange={handleChange} />
                </div>
                <div className="crud-form__actions">
                    <button type="submit" disabled={submitting}>
                        {editingId !== null ? "Save changes" : "Add product"}
                    </button>
                    {editingId !== null && (
                        <button type="button" onClick={cancelEdit}>Cancel</button>
                    )}
                </div>
            </form>

            {/* List */}
            {loading && <p>Loading…</p>}
            {error && <p style={{ color: "red" }}>Error: {error}</p>}
            {mutationError && (
                <p style={{ color: "#b45309", background: "#fef3c7", padding: "0.6rem 1rem", borderRadius: 8 }}>
                    ⚠ Action failed (rolled back): {mutationError}
                </p>
            )}

            {!loading && (
                <table className="crud-table">
                    <thead>
                        <tr>
                            <th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Description</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p) => (
                            <tr key={p.id}>
                                <td>{p.id}</td>
                                <td>{p.name}</td>
                                <td>{p.category}</td>
                                <td>${p.price}</td>
                                <td>{p.description}</td>
                                <td className="crud-table__actions">
                                    <button onClick={() => startEdit(p)}>Edit</button>
                                    <button
                                        onClick={async () => {
                                            setMutationError(null);
                                            try {
                                                await deleteProduct(p.id);
                                            } catch (e) {
                                                setMutationError((e as Error).message);
                                            }
                                        }}
                                        className="danger"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
