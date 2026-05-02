import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Learn from './pages/Learn'
import Practice from './pages/Practice'
import Multiplayer from './pages/Multiplayer'
import Profile from './pages/Profile'
import Login from './pages/Login'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/multiplayer" element={<Multiplayer />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}
