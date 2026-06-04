import cx from "clsx";

const Container = ({ children, className }) => {
  return (
    <div className={cx("container mx-auto w-[90%] max-w-6xl", className)}>
      {children}
    </div>
  );
};

export default Container;
