import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { AccountsPage } from './pages/AccountsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { TagsPage } from './pages/TagsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { initializeSettings } from './stores/settingsStore';
import { ensureDefaultCategories } from './stores/categoriesStore';
import './App.css';

function App() {
  useEffect(() => {
    initializeSettings();
    ensureDefaultCategories();
  }, []);

  return (
    <BrowserRouter>
      <div style={{ display: 'flex' }}>
        <Navbar />
        <main style={{ marginLeft: '80px', width: 'calc(100% - 80px)' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
