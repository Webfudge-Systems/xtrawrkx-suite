import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";

export default function NewsletterSection() {
  return (
    <Section className="bg-brand-primary !py-[120px] flex items-center justify-center min-h-[240px]">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 w-full">
          <div className="flex-1 min-w-[320px]">
            <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Subscribe to our Newsletter
            </h3>
            <p className="text-white/80 text-lg max-w-xl">
              Subscribe for Updates: Stay informed about the latest investor
              updates, financial results, and announcements by subscribing to
              our newsletter.
            </p>
          </div>
          <form className="flex w-full max-w-xl mt-8 md:mt-0">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-5 rounded-l-2xl outline-none border-none text-white bg-[#ff8fb2] placeholder-white/80 text-lg font-medium"
            />
            <button
              type="submit"
              className="bg-white cursor-pointer text-brand-primary font-bold px-10 py-5 rounded-r-2xl text-lg hover:bg-gray-100 transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </Container>
    </Section>
  );
}
