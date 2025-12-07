import type { Menu } from "../types";

export default function MenuCard({ menu }: { menu: Menu }) {
  return (
    <div className="card">
      <img src={menu.image} alt={menu.name} />
      <h3>{menu.name}</h3>
      <p>{menu.description}</p>
      <strong>Rp {menu.price.toLocaleString()}</strong>
    </div>
  );
}
