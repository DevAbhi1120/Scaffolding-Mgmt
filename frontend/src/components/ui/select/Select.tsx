import react from "react";

const Select = react.forwardRef(({ children, className, ...props }, ref) => {
  return (
    <select ref={ref} className={className} {...props}>
        {children}
    </select>
  );
});

Select.displayName = "Select";

export default Select;
