import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import MainPage from "./pages/MainPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import MyPage from "./pages/MyPage";
import RecipeUpload from "./pages/RecipeUpload";
import FavoritePage from "./pages/FavoritePage";
import SearchResult from "./pages/SearchResult.jsx";
import RecipeDetail from "./pages/RecipeDetail";
import CommunityPage from "./pages/Community.jsx";


function App() {
  return (
    <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/favorite" element={<FavoritePage />} />
          <Route path="/search" element={<SearchResult />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/recipe-upload" element={<RecipeUpload />} />
          <Route path="/community" element={<CommunityPage />} /> 
        </Routes>
      
    </BrowserRouter>
  );
}

export default App;
