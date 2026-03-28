"use client";

import { useState } from "react";
import { useProducts } from "../app/hooks/useProducts";
import { Product } from "../types/product";

type FormState = Omit<Product, "id">;

const empty: FormState = { name: "", price: 0, description: "", category: "" };

export default function CrudProductList() {
    const { products, createProduct, updateProduct, deleteProduct } = useProducts();

    const [form, setForm] = useState<FormState>(empty);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: name === "price" ? Number(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId !== null) {
                await updateProduct(editingId, form);
            } else {
                await createProduct(form);
            }
            setForm(empty);
            setEditingId(null);
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
            <h1>Products (MSW CRUD demo)</h1>

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
                                    <button onClick={() => deleteProduct(p.id)} className="danger">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
        </div>
    )};