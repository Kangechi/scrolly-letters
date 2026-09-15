import ArrivalLines from '../arrivals/ArrivalLines'

/* The closing as a SIGNATURE — right-aligned, handwritten, like the sign-off
   at the foot of the anniversary letter. It writes itself in with the Ink
   arrival unless the sender picked a different one for this scene. */

export default function Signature({ pre, line, arrival, play }) {
  return (
    <div className="shape-sign">
      {pre && <span className="shape-sign-pre">{pre},</span>}
      <ArrivalLines
        fx={arrival ?? 'inkReveal'}
        play={play}
        lines={[line || '']}
        lineClassName="shape-sign-line"
      />
    </div>
  )
}
