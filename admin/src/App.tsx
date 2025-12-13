import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import AlbumDetail from './routes/AlbumDetail';
import Home from './routes/Home';
import NotFound from './routes/NotFound';
import Photos from './routes/Photos';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="photos" element={<Photos />} />
        <Route path="photos/:albumId" element={<AlbumDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
