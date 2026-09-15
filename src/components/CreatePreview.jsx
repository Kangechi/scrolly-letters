import AmbientBackground from "./AmbientBackground"
import CardDecor from "./CardDecor"
import { SCENE_MAP } from "./ScrollPage"
import { resolveArrival } from "../lib/styles"
import { resolveShape, decorClasses, brandStyleOf } from "../lib/design"

/* `brandStyle` (events): inline CSS vars from the org's hex colours. When it's
   present we drop the `theme-x` class — the two are alternative sources for the
   same --accent/--bg vars, and a class would fight the inline style. Cards pass
   `theme` and no brandStyle, so their behaviour is unchanged.

   Create Studio additions — all optional, so /create and /manage are untouched:
     style, overrides  → the same resolveArrival() ScrollPage uses
     design            → shapes, backdrop, stickers (resolveShape/decorClasses)
     colors            → your own {accent, accent_2, bg}, via brandStyleOf
     replayKey         → bump it to remount every scene, restarting every effect
     onSelectScene,
     selectedIndex     → click a scene to pick it in the studio
   The preview and the live card resolve everything through the same
   functions. They must never disagree — a preview that lies is worse than
   no preview. */
export default function CreatePreview({
    sections, theme, emoji, brandStyle,
    style = null, overrides = null, design = null, colors = null, replayKey = 0,
    onSelectScene, selectedIndex = null,
}) {
    const colorStyle = brandStyle ?? brandStyleOf(colors)
    const decor = decorClasses(style, design)
    const selectable = typeof onSelectScene === 'function'

    return (
        <div
            className={`card-wrapper ${colorStyle ? '' : `theme-${theme}`}${decor.className ? ` ${decor.className}` : ''} preview-frame`}
            style={colorStyle}
        >
            <AmbientBackground emoji={emoji}/>
            <CardDecor style={style} design={design} />
            {sections.map((section, i) => {
                const Component = SCENE_MAP[section.type]
                if (!Component) return null

                const arrival = resolveArrival(section.type, style, overrides)
                const shape = resolveShape(section.type, design)
                const classes = [
                    'scene scene--visible',
                    arrival && 'scene--styled',
                    selectable && 'scene--selectable',
                    selectedIndex === i && 'scene--selected',
                ].filter(Boolean).join(' ')

                return (
                    <div
                        className={classes}
                        key={`${i}-${replayKey}`}
                        {...(selectable && {
                            role: 'button',
                            tabIndex: 0,
                            'aria-label': `Choose how the ${section.type} scene looks`,
                            onClick: () => onSelectScene(i),
                            onKeyDown: (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    onSelectScene(i)
                                }
                            },
                        })}
                    >
                        <Component data={section} emoji={emoji} isPreview={true} arrival={arrival} shape={shape} play={true}/>
                    </div>
                )
            })}
        </div>
    )
}
