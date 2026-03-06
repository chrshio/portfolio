import Link from "next/link";
import { projects } from "@/lib/prototypes-config";

export default function PrototypesIndexPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold text-[#101010]">
        Prototypes
      </h1>
      <div className="space-y-10">
        {projects.map((project) => (
          <section key={project.id}>
            <h2 className="mb-4 text-lg font-medium text-[#101010]">
              {project.name}
            </h2>
            <ul className="space-y-2">
              {project.prototypes.map((p) => (
                <li key={p.id}>
                  {p.ready ? (
                    <Link
                      href={p.path}
                      className="text-[#005ad9] underline"
                    >
                      {p.name}
                    </Link>
                  ) : (
                    <span className="text-black/40">{p.name} — Coming soon</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
