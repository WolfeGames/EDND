import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CharacterSheetPage } from './pages/CharacterSheetPage'
import { CharacterCreatorPage } from './pages/CharacterCreatorPage'
import { HomePage } from './pages/HomePage'
import { RandomGeneratorPage } from './pages/RandomGeneratorPage'
import { SavedCharactersPage } from './pages/SavedCharactersPage'
import './App.css'

function CreateCharacterRoute() {
  const loc = useLocation()
  return <CharacterCreatorPage key={`${loc.pathname}${loc.search}`} />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sheet" element={<CharacterSheetPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreateCharacterRoute />} />
          <Route path="/characters" element={<SavedCharactersPage />} />
          <Route path="/random" element={<RandomGeneratorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
