import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import NavbarMobile from './components/Navbar/NavbarMobile';
import Home from './pages/Home';
import RecommendedPage from './pages/RecommendedPage';
import WishlistPage from './pages/WishlistPage';
import ProfilePage from './pages/ProfilePage';
import ActorsPage from './pages/ActorsPage';
import MovieDetail from './components/MovieDetail/MovieDetail';
import { WishlistProvider } from './context/WishlistContext';
import { ViewedMoviesProvider } from './context/ViewedMoviesContext';
import { ContentLanguageProvider } from './context/ContentLanguageContext';
import { LoadingProvider } from './context/LoadingContext';
import './App.css';

function App() {
  return (
    <WishlistProvider>
      <ViewedMoviesProvider>
      <Router>
        <ContentLanguageProvider>
        <LoadingProvider>
        <div className="App">
          <Navbar />
          <main className="App-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/category/:categoryId" element={<RecommendedPage />} />
              <Route path="/similar-movies/:movieId" element={<RecommendedPage />} />
              <Route path="/movie/:id" element={<MovieDetail />} />
              <Route path="/recommended" element={<RecommendedPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/actor/:id" element={<ActorsPage />} />
            </Routes>
          </main>
          <NavbarMobile />
        </div>
        </LoadingProvider>
        </ContentLanguageProvider>
      </Router>
      </ViewedMoviesProvider>
    </WishlistProvider>
  );
}

export default App;
