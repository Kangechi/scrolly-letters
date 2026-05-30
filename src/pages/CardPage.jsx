import { useParams } from "react-router-dom";
import {cardData} from '../data/cards_data'
import ScrollPage from "../components/ScrollPage"

export default function CardPage() {
    const {id} = useParams()
    const card = cardData.find(c => c.id === id)
     // ADD THIS LINE:
  console.log("id from URL:", id)
  console.log("card found:", card)

    if (!card) return <div>Card not Found 🫤</div>

    return <ScrollPage card={card}/>
}