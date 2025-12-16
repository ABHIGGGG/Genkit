import { ProjectForm } from "@/modules/home/ui/components/project-form";
import { ProjectsList } from "@/modules/home/ui/components/projects-list";
import Image from "next/image";

export default function Page() {
  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full">
      <section className="space-y-6 py-[16vh] 2xl:py-48">
        <div className="flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            AI-powered site & app builder
          </div>
          <Image
            src="/logo.svg"
            alt="Genkit"
            width={50}
            height={50}
            className="hidden md:block rounded-full border bg-card"
          />
        </div>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-center">
          Launch polished websites with <span className="text-primary">Genkit</span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground text-center max-w-2xl mx-auto">
          Describe what you want, and Genkit designs, builds, and wires up the code for you—
          ready to ship in minutes.
        </p>
        <div className="max-w-3xl mx-auto w-full">
          <ProjectForm />
        </div>
      </section>
      <ProjectsList />
    </div>
  );
}
