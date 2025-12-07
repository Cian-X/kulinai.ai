import MenuCard from "../components/MenuCard";
import { useMenus } from "../hooks/use-api";

export default function MenuList() {
  const { menus, loading } = useMenus();

  if (loading) return <p>Loading...</p>;

  return (
    <div className="grid">
      {menus.map(menu => (
        <MenuCard key={menu.id} menu={menu} />
      ))}
    </div>
  );
}
