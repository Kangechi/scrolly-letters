import AmbientBackground from "./AmbientBackground"
import { SCENE_MAP } from "./ScrollPage"

/* `brandStyle` (events): inline CSS vars from the org's hex colours. When it's
   present we drop the `theme-x` class — the two are alternative sources for the
   same --accent/--bg vars, and a class would fight the inline style. Cards pass
   `theme` and no brandStyle, so their behaviour is unchanged. */
export default function CreatePreview({sections, theme, emoji, brandStyle}) {
    return (
        <div
            className={`card-wrapper ${brandStyle ? '' : `theme-${theme}`} preview-frame`}
            style={brandStyle}
        >
            <AmbientBackground emoji={emoji}/>
            {sections.map((section, i) => {
                const Component = SCENE_MAP[section.type]
                if (!Component) return null

                return (
                    <div className="scene scene--visible" key={i}>
                        <Component data={section} emoji={emoji} isPreview={true}/>
                    </div>
                )

            })
            }


        </div>
    )
}