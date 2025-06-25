import ActiveItems from "./components/ActiveItems";
import Proceed from "./components/Proceed";

export default function Home() {
  return (
    <div className="max-w-5xl w-full">
      <ActiveItems />
      <Proceed />
    </div>
  );
}
