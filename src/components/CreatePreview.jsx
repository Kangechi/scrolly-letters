import AmbientBackground from "./AmbientBackground"
import { SCENE_MAP } from "./ScrollPage"

export default function CreatePreview({sections, theme, emoji}) {
    return (
        <div className={`card-wrapper theme-${theme} preview-frame`}>
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