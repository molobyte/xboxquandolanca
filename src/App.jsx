import { useRoute } from './lib/router.js';
import HomePage from './pages/HomePage.jsx';
import GamePage from './pages/GamePage.jsx';

export default function App() {
  const route = useRoute();
  if (route.name === 'game') return <GamePage key={route.id} id={route.id} />;
  return <HomePage section={route.section} />;
}
