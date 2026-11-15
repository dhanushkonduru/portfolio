import { ParticleStage } from "@/components/site/ParticleStage";
import { Nav } from "@/components/site/Nav";
import { Hero, Marquee } from "@/components/site/Hero";
import { About } from "@/components/site/About";
import { Work } from "@/components/site/Work";
import { Research } from "@/components/site/Research";
import { Experience, Skills } from "@/components/site/Experience";
import { Contact } from "@/components/site/Contact";
import { Finish } from "@/components/site/Finish";

/**
 * One page. The particle model is fixed behind all of it and changes form as
 * the sections go by; everything in <main> is ordinary document flow on top.
 */
export default function Page() {
  return (
    <>
      <ParticleStage />
      <Finish />
      <Nav />
      <main className="relative z-10">
        <Hero />
        <Marquee />
        <About />
        <Work />
        <Research />
        <Experience />
        <Skills />
        <Contact />
      </main>
    </>
  );
}
