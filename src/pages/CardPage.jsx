import { useParams } from "react-router-dom";
import {cards_data} from '../data/cards_data'
import ScrollPage from "../components/ScrollPage"

export default function CardPage() {
    const {id} = useParams()
    const card = cards_data.find(c => c.id === id)

    if (!card) return <div>Card not Found 🫤</div>

    return <ScrollPage card={card}/>
}