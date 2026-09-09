import { Nav } from "@/components/Nav";
import { Pointer } from "@/components/Cursor";
import { Registration } from "@/components/Registration";
import { Readout } from "@/components/Readout";
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
      {/* No field and no boot gate. SystemLayer is behaviour only now:
          the stage driver and the inertial scroll. */}
      <SystemLayer />
      <Pointer />
      <Registration />
      <Readout />
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
