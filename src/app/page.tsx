import { Boot } from "@/components/Boot";
import { Nav } from "@/components/Nav";
import { Pointer } from "@/components/Cursor";
import { SystemLayer } from "@/system/SystemLayer";
import { Hero } from "@/sections/Hero";
import { About } from "@/sections/About";
import { Stack } from "@/sections/Stack";
import { Work } from "@/sections/Work";
import { Research } from "@/sections/Research";
import { Journey } from "@/sections/Journey";
import { Contact, Footer } from "@/sections/Contact";

export default function Page() {
  return (
    <>
      {/* One field, fixed behind the whole page. Sections decide how much of
          it comes through; that is the pacing system. */}
      <Boot />
      <SystemLayer />
      <Pointer />
      <Nav />

      <main className="relative z-10">
        <Hero />
        <About />
        <Stack />
        <Work />
        <Research />
        <Journey />
        <Contact />
      </main>

      <Footer />
    </>
  );
}
