// src/sections/Work.tsx
import { useEffect, useRef, useState } from 'react'
import '../styles/work.css'
import { projects, type Project } from '../content/projects'

// Work: the project grid (F-23), each project's full-screen detail (F-22) and the HTML of the carousel.
// Every detail is a closed <dialog> already in the page, so all text is indexed and keyboard-reachable.

// Opens a project's detail. Focus goes to the dialog itself, not to Close, so a mouse click leaves
// no ring on the button; Tab reaches Close next.
export function showDetail(id: string) {
  const dialog = document.getElementById(`${id}-detail`) as HTMLDialogElement | null
  if (!dialog) return
  dialog.showModal()
  dialog.focus()
  // The frame's tint (work.css), once per project; with the carousel the image is already cached.
  if (!dialog.style.getPropertyValue('--tint')) {
    const image = dialog.querySelector<HTMLImageElement>('.work-detail-image')
    if (image) meanColor(image.src).then((color) => dialog.style.setProperty('--tint', color))
  }
}

// The image's mean colour, like the glass's coarsest mipmap: drawn at 32 × 18 and averaged in
// linear light, as the GPU averages its mipmaps.
async function meanColor(src: string) {
  const image = new Image()
  image.src = src
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 18
  const context = canvas.getContext('2d', { willReadFrequently: true })!
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  const sum = [0, 0, 0]
  for (let i = 0; i < pixels.length; i += 4) {
    for (let channel = 0; channel < 3; channel++) sum[channel] += (pixels[i + channel] / 255) ** 2.2
  }
  const count = pixels.length / 4
  const [r, g, b] = sum.map((total) => Math.round((total / count) ** (1 / 2.2) * 255))
  return `rgb(${r} ${g} ${b})`
}

// Work section content.
export function Work() {
  const grid = useRef<HTMLOListElement>(null)
  const [paused, setPaused] = useState(false)

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
      {/* Carousel only (shown with data-stage="3d"): the pause (N-05), read by WorkScene every frame. */}
      <button
        className="work-pause"
        type="button"
        aria-pressed={paused}
        onClick={() => setPaused(!paused)}
      >
        {paused ? 'Play' : 'Pause'} rotation
      </button>
    </>
  )
}

// One project: the card that opens the detail, and the detail itself.
function ProjectItem({ project }: { project: Project }) {
  const titleId = `${project.id}-title`

  return (
    <li>
      <button
        className="work-card"
        type="button"
        aria-haspopup="dialog"
        // With the carousel, WorkScene first flies into the card, then opens the dialog.
        onClick={() =>
          document.documentElement.dataset.stage === '3d'
            ? window.dispatchEvent(new CustomEvent('work:open', { detail: project.id }))
            : showDetail(project.id)
        }
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

      <dialog
        id={`${project.id}-detail`}
        tabIndex={-1}
        className="work-detail"
        aria-labelledby={titleId}
      >
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
