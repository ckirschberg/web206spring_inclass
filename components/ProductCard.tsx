import Link from "next/link";
import { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
  setCartItemCount: () => void; // prepare so we can send the function in the prop object
};

export default function ProductCard({ product, setCartItemCount }: ProductCardProps) {
  return (
    <article className="card">
      <h2>{product.name}</h2>
      <p className="card__category">Category: {product.category}</p>
      <p>{product.description}</p>
      <p className="card__price">${product.price}</p>

      <Link href={`/products/${product.id}`} className="button-link">
        View details
      </Link>
      <button onClick={() => setCartItemCount()}>Add to cart</button>
    </article>
  );
}