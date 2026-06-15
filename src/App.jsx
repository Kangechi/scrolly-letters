import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './pages/Home'
import CardPage from './pages/CardPage'
import Create from './pages/Create'

export default function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/card/:id' element={<CardPage/>}/>
      <Route path='/create' element={<Create/>}/>
    </Routes>
    
    
    </BrowserRouter>
  )
}