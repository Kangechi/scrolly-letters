import { Link } from 'react-router-dom'

/* Catch-all for unmatched URLs. Before this existed, a wrong path matched no
   <Route> and React Router rendered NOTHING — a blank white page with no error
   in the console. That is how the dead `/event/manage/...` link presented:
   not as "404", but as "the page doesn't do anything". */
export default function NotFound() {
  return (
    <div className="shop-page">
      <span className="shop-page-emoji">🧭</span>
      <h1 className="shop-page-title">Page not found</h1>
      <p className="shop-page-sub">That link doesn’t lead anywhere on Scrolly Letters.</p>
      <Link to="/" className="cta-button">Back home →</Link>
    </div>
  )
}
