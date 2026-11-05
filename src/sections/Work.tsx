// src/sections/Work.tsx
import { useEffect, useRef } from 'react'
import '../styles/work.css'
import { projects, type Project } from '../content/projects'

// Work: the project grid (F-23) and each project's full-screen detail (F-22).
// Every detail is a closed <dialog> already in the page, so all text is indexed and keyboard-reachable.

// Work section content.
export function Work() {
  const grid = useRef<HTMLOListElement>(null)

  // Marks each project the first time it comes into view; the entrance itself is in work.css.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-in')
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.2 },
    )
    for (const item of grid.current!.children) observer.observe(item)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <h2>Work</h2>
      <ol ref={grid} className="work-grid">
        {projects.map((project) => (
          <ProjectItem key={project.id} project={project} />
        ))}
      </ol>
    </>
  )
}

// One project: the card that opens the detail, and the detail itself.
function ProjectItem({ project }: { project: Project }) {
  const detail = useRef<HTMLDialogElement>(null)
  const titleId = `${project.id}-title`

  return (
    <li>
      <button
        className="work-card"
        type="button"
        aria-haspopup="dialog"
        onClick={() => detail.current?.showModal()}
      >
        <span className="work-card-title">{project.title}</span>
        {/* Every image is 16:9: these only reserve the space, against layout shift. */}
        <img
          src={project.image}
          alt={project.alt}
          width={1600}
          height={900}
          loading="lazy"
          decoding="async"
        />
      </button>

      <dialog ref={detail} className="work-detail" aria-labelledby={titleId}>
        {/* Already described by the card: here it is only the backdrop. */}
        <img
          className="work-detail-image"
          src={project.image}
          alt=""
          width={1600}
          height={900}
          loading="lazy"
        />
        <form method="dialog">
          <button className="work-detail-close" type="submit">
            Close <span aria-hidden="true">×</span>
          </button>
        </form>
        <div className="work-detail-text">
          <h3 id={titleId}>{project.title}</h3>
          <time className="work-detail-year">{project.year}</time>
          <p>{project.description}</p>
          <dl>
            <dt>Built with</dt>
            <dd>{project.stack.join(' · ')}</dd>
          </dl>
          <ul className="work-detail-links">
            {project.links.map((link) => (
              <li key={link.url}>
                <a className="button" href={link.url} target="_blank" rel="noopener">
                  {link.label} <span aria-hidden="true">↗</span>
                </a>
                {link.password && (
                  <span className="work-password">
                    password <code>{link.password}</code>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </li>
  )
}
