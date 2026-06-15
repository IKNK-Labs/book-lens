import type { ButtonHTMLAttributes, ReactNode } from "react";

type ChipBaseProps = {
  children: ReactNode;
  active?: boolean;
  className?: string;
};

type InteractiveChipProps = ChipBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-pressed" | "children" | "className" | "type"> & {
    interactive: true;
  };

type StaticChipProps = ChipBaseProps & {
  interactive?: false;
};

type ChipProps = InteractiveChipProps | StaticChipProps;

export function Chip(props: ChipProps) {
  const { children, active = false, className = "", interactive = false } = props;
  const chipClassName = `inline-flex items-center rounded-full border px-3 py-2 text-xs font-extrabold sm:text-sm ${
    active
      ? "border-transparent bg-gradient-to-r from-[var(--pink)] to-[var(--violet)] text-white"
      : "border-[var(--line)] bg-[var(--surface-soft)] text-[var(--accent-strong)]"
  } ${className}`;

  if (interactive) {
    const { children: _children, active: _active, className: _className, interactive: _interactive, ...buttonProps } = props;
    void _children;
    void _active;
    void _className;
    void _interactive;

    return (
      <button type="button" aria-pressed={active} className={chipClassName} {...buttonProps}>
        {children}
      </button>
    );
  }

  return <span className={chipClassName}>{children}</span>;
}
