import { Experience } from '@/components/Experience';
import { Services } from '@/components/sections/Services';
import { BeforeAfter } from '@/components/sections/BeforeAfter';
import { Structure } from '@/components/sections/Structure';
import { Differentials } from '@/components/sections/Differentials';
import { Booking } from '@/components/sections/Booking';
import { Testimonials } from '@/components/sections/Testimonials';
import { Location } from '@/components/sections/Location';
import { FinalCta } from '@/components/sections/FinalCta';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <>
      <div className="grain" aria-hidden />
      <main>
        <Experience />
        <div className="relative z-10 bg-ink">
          <Services />
          <BeforeAfter />
          <Structure />
          <Differentials />
          <Booking />
          <Testimonials />
          <Location />
          <FinalCta />
        </div>
      </main>
      <Footer />
    </>
  );
}
