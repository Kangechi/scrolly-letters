import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './pages/Home'
import CardPage from './pages/CardPage'

export default function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/card/:id' element={<CardPage/>}/>
    </Routes>
    
    
    </BrowserRouter>
  )
}