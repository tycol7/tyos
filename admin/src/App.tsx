import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AlbumDetail from './routes/AlbumDetail';
import Home from './routes/Home';
import Login from './routes/Login';
import NotFound from './routes/NotFound';
import PageDetail from './routes/PageDetail';
import PageEdit from './routes/PageEdit';
import Pages from './routes/Pages';
import Photos from './routes/Photos';
import PostDetail from './routes/PostDetail';
import PostEdit from './routes/PostEdit';
import PostNew from './routes/PostNew';
import Posts from './routes/Posts';

function App() {
  return (
    <Routes>
      {/* Public route - Login page */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes - Require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="photos" element={<Photos />} />
          <Route path="photos/:albumId" element={<AlbumDetail />} />
          <Route path="pages" element={<Pages />} />
          <Route path="pages/:pageId/edit" element={<PageEdit />} />
          <Route path="pages/:pageId" element={<PageDetail />} />
          <Route path="posts" element={<Posts />} />
          <Route path="posts/new" element={<PostNew />} />
          <Route path="posts/:postId/edit" element={<PostEdit />} />
          <Route path="posts/:postId" element={<PostDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
