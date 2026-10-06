import Link from "next/link";
import Logo from "@/components/Logo";

const PREVIEW = [
  { label: "Inicio", date: "1 Ene", color: "#0077A3", group: "Planificación" },
  { label: "Diseño", date: "15 Feb", color: "#00B5A6", group: "Diseño" },
  { label: "Construcción", date: "10 Abr", color: "#FF8A65", group: "Construcción" },
  { label: "Pruebas", date: "15 Jul", color: "#C1447E", group: "Pruebas" },
  { label: "Entrega", date: "30 Ago", color: "#7C5CBF", group: "Cierre" },
];

const BENEFITS = [
  { icon: "●", title: "Hitos por grupos", text: "Organiza y visualiza fácilmente con colores." },
  { icon: "X", title: "Excel integrado", text: "Importa y exporta tus datos." },
  { icon: "✓", title: "Guardado automático", text: "Tu trabajo siempre seguro." },
  { icon: "⇩", title: "PowerPoint, PNG y SVG", text: "Listo para presentar y compartir." },
  { icon: "↗", title: "Comparte con permisos", text: "Acceso para ver o editar." },
  { icon: "▦", title: "“Hoy” y días entre hitos", text: "Mantén el control del tiempo." },
];

const STEPS = [
  { title: "Agrega tus hitos", text: "Ingresa fechas, títulos y grupos." },
  { title: "Personaliza el estilo", text: "Ajusta colores, fuente y vista." },
  { title: "Comparte o exporta", text: "Descarga o colabora con tu equipo." },
];

export default function Landing() {
  return (
    <>
      <nav className="nav">
        <div className="container nav-inner">
          <Logo />
          <div className="nav-links">
            <a href="#funciones">Funciones</a>
            <a href="#como">Cómo funciona</a>
          </div>
          <div className="nav-actions">
            <Link href="/login">Iniciar sesión</Link>
            <Link className="btn btn-coral" href="/register">
              Crear mi línea de tiempo
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="container hero-box">
            <div>
              <div className="eyebrow">Líneas de tiempo para proyectos</div>
              <h1>
                Tus proyectos,
                <br />
                <span>hito a hito</span>
              </h1>
              <p>
                Crea, edita y comparte líneas de tiempo profesionales en minutos. Diseñada para ingenieros, jefes de
                proyecto y equipos técnicos en Latinoamérica.
              </p>
              <Link className="btn btn-coral" href="/register">
                Crear mi línea de tiempo →
              </Link>
            </div>

            <div className="preview card" aria-label="Vista previa de una línea de tiempo">
              <div className="preview-head">
                <strong>Construcción Planta Solar</strong>
                <span className="small muted">Vista previa</span>
              </div>
              <div className="legend">
                {PREVIEW.map((p) => (
                  <span key={p.group}>
                    <i className="dot" style={{ background: p.color }} />
                    {p.group}
                  </span>
                ))}
              </div>
              <div className="timeline">
                <div className="today">
                  <span>Hoy</span>
                </div>
                <div className="milestones">
                  {PREVIEW.map((p) => (
                    <div key={p.label} className="mile" style={{ "--c": p.color } as React.CSSProperties}>
                      {p.label}
                      <br />
                      <span className="muted">{p.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="funciones">
          <div className="container benefits">
            {BENEFITS.map((b) => (
              <div key={b.title} className="benefit">
                <div className="ico">{b.icon}</div>
                <div>
                  <strong>{b.title}</strong>
                  <span className="muted small">{b.text}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="como" className="steps">
          <div className="container">
            <h2>Cómo funciona</h2>
            <div className="steps-row">
              {STEPS.map((s, i) => (
                <div key={s.title} className="step">
                  <div className="step-n">{i + 1}</div>
                  <div>
                    <strong>{s.title}</strong>
                    <div className="muted small">{s.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <Logo />
          <div className="small">© {new Date().getFullYear()} RutaPRO · Proyectos claros, decisiones mejores.</div>
        </div>
      </footer>
    </>
  );
}
