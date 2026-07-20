import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './pages/Home'
import CardPage from './pages/CardPage'
import Create from './pages/Create'
import CreateEvent from './pages/Create_event'
import Customize from './pages/Customize'
import BubbleNav from './components/BubbleNav'

export default function App() {
  return (
    <BrowserRouter>
    <BubbleNav/>
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/card/:id' element={<CardPage/>}/>
      <Route path='/create' element={<Create/>}/>
      <Route path='/event' element={<CreateEvent/>}/>
      <Route path='/customize' element={<Customize/>}/>
    </Routes>


    </BrowserRouter>
  )
}
