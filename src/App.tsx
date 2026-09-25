import { useEffect } from 'react';
import { useRoute } from './hooks';
import { Home } from './pages/Home';
import { Aide, Rules } from './pages/Info';
import { RoomPage } from './pages/RoomPage';

const TITLES: Record<string, string> = {
  home: 'Le Grand Tour · Jeu de français',
  rules: 'Règles du jeu · Le Grand Tour',
  aide: 'Aide-mémoire · Le Grand Tour',
};

export function App() {
  const route = useRoute();

  useEffect(() => {
    document.title = route.name === 'room' || route.name === 'tv' ? `Partie ${route.code} · Le Grand Tour` : TITLES[route.name];
  }, [route]);

  switch (route.name) {
    case 'rules':
      return <Rules />;
    case 'aide':
      return <Aide />;
    case 'room':
      return <RoomPage key={route.code} code={route.code} />;
    case 'tv':
      return <RoomPage key={`tv-${route.code}`} code={route.code} tv />;
    default:
      return <Home />;
  }
}
