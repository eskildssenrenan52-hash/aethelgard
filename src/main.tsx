import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Android nativo: trava em paisagem e esconde a barra de status (imersivo).
import { Capacitor } from '@capacitor/core';
if (Capacitor.isNativePlatform()) {
  void import('@capacitor/screen-orientation').then(({ ScreenOrientation }) =>
    ScreenOrientation.lock({ orientation: 'landscape' }).catch(() => {}),
  );
  void import('@capacitor/status-bar').then(({ StatusBar }) => StatusBar.hide().catch(() => {}));
}
