import { forwardRef, type HTMLAttributes } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "elevated" | "flat" | "pressed" | "premium";
  hoverable?: boolean;
  clickable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles = {
  elevated: "glass-card shadow-xl text-white border-white/10",
  flat: "glass border-none text-white",
  pressed: "bg-black/40 shadow-inner border border-white/5 text-white",
  premium: "glass-card relative overflow-hidden border-white/10 shadow-2xl",
};

const paddingStyles = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "elevated",
      hoverable = false,
      clickable = false,
      padding = "md",
      children,
      ...props
    },
    ref
  ) => {
    const baseClassName = cn(
      "rounded-2xl",
      "transition-all duration-300",
      variantStyles[variant],
      paddingStyles[padding],
      hoverable &&
        variant === "elevated" &&
        "hover:shadow-2xl hover:-translate-y-1 hover:border-white/20 hover:bg-white/5",
      clickable && "cursor-pointer",
      className
    );

    const content = (
      <>
        {variant === "premium" && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
        )}
        <div className="relative z-10">{children}</div>
      </>
    );

    if (hoverable || clickable) {
      return (
        <motion.div
          ref={ref}
          className={baseClassName}
          whileHover={{ scale: 1.01 }}
          whileTap={clickable ? { scale: 0.98 } : undefined}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          {...(props as HTMLMotionProps<"div">)}
        >
          {content}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={baseClassName} {...props}>
        {content}
      </div>
    );
  }
);

Card.displayName = "Card";

// Card sub-components
type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("pb-4 mb-4", className)} {...props} />
  )
);

CardHeader.displayName = "CardHeader";

type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-base font-semibold text-primary m-2 rounded-2xl",
        className
      )}
      {...props}
    />
  )
);

CardTitle.displayName = "CardTitle";

type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-secondary mt-1", className)}
    {...props}
  />
));

CardDescription.displayName = "CardDescription";

type CardContentProps = HTMLAttributes<HTMLDivElement>;

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props} />
  )
);

CardContent.displayName = "CardContent";

type CardFooterProps = HTMLAttributes<HTMLDivElement>;

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "pt-4 mt-4 border-t border-subtle flex items-center gap-3",
        className
      )}
      {...props}
    />
  )
);

CardFooter.displayName = "CardFooter";

export default Card;
