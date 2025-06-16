import Image from "next/image";
import Header from "./components/Header";
import Profile from "./components/Profile";
import ActiveItems from "./components/ActiveItems";

export default function Home() {
  return (
    <div>
      <ActiveItems />
    </div>
  );
}
