import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CharacterSheetPage } from './pages/CharacterSheetPage'
import { CharacterCreatorPage } from './pages/CharacterCreatorPage'
import { HomePage } from './pages/HomePage'
import { RandomGeneratorPage } from './pages/RandomGeneratorPage'
import { SavedCharactersPage } from './pages/SavedCharactersPage'
import { BestiaryEntryPage } from './pages/bestiary/BestiaryEntryPage'
import { BestiaryIndexPage } from './pages/bestiary/BestiaryIndexPage'
import { RulesEcstasyPage } from './pages/rules/RulesEcstasyPage'
import { RulesHubPage } from './pages/rules/RulesHubPage'
import { RulesLayout } from './pages/rules/RulesLayout'
import { RulesSexInPlayPage } from './pages/rules/RulesSexInPlayPage'
import { RulesSpellsPage } from './pages/rules/RulesSpellsPage'
import { QuickEncounterTester } from './components/QuickEncounterTester'
import './App.css'

function CreateCharacterRoute() {
  const loc = useLocation()
  const params = new URLSearchParams(loc.search)
  const id = params.get('id')
  const bust = params.get('_')
  // Remount when editing a save or explicitly starting a new sheet.
  const key = id ? `edit-${id}` : bust ? `new-${bust}` : `create-${loc.key}`
  return <CharacterCreatorPage key={key} />
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
          <Route path="/bestiary" element={<BestiaryIndexPage />} />
          <Route path="/bestiary/:id" element={<BestiaryEntryPage />} />
          <Route path="/pleasure-test" element={<QuickEncounterTester />} />
          <Route path="/rules" element={<RulesLayout />}>
            <Route index element={<RulesHubPage />} />
            <Route path="ecstasy" element={<RulesEcstasyPage />} />
            <Route path="spells" element={<RulesSpellsPage />} />
            <Route path="play" element={<RulesSexInPlayPage />} />
            <Route path="*" element={<Navigate to="/rules" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
