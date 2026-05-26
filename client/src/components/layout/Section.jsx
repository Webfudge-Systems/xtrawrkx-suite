import cx from "clsx";

const Section = ({ children, className }) => {
  return (
    <section className={cx("overflow-hidden py-10 sm:py-14", className)}>
      {children}
    </section>
  );
};

export default Section;
