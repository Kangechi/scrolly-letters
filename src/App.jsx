import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './pages/Home'
import CardPage from './pages/CardPage'
import Create from './pages/Create'
import CreateEvent from './pages/Create_event'
import Customize from './pages/Customize'
import Occasions from './pages/Occasions'
import ManageEvent from './pages/ManageEvent'
import TicketCheckout from './pages/TicketCheckout'
import NotFound from './pages/NotFound'
import BubbleNav from './components/BubbleNav'
import PageMeta from './components/PageMeta'

export default function App() {
  return (
    <BrowserRouter>
    <PageMeta/>
    <BubbleNav/>
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/card/:id' element={<CardPage/>}/>
      {/* The ticket gate. Nested under the card's own id so the invite and
          its checkout share one link a host can hand out. */}
      <Route path='/card/:id/ticket' element={<TicketCheckout/>}/>
      <Route path='/create' element={<Create/>}/>
      <Route path='/event' element={<CreateEvent/>}/>
      <Route path='/customize' element={<Customize/>}/>
      <Route path='/occasions' element={<Occasions/>}/>
      {/* Host's page, reached by the SECRET manage_id (not the invite id). */}
      <Route path='/manage/:manageId' element={<ManageEvent/>}/>
      {/* Catch-all. Without this an unmatched URL renders a BLANK page —
          which is exactly how the dead /event/manage/... link failed. */}
      <Route path='*' element={<NotFound/>}/>
    </Routes>


    </BrowserRouter>
  )
}
