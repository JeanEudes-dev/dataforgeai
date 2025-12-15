import { forwardRef, type HTMLAttributes } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "elevated" | "flat" | "pressed";
  hoverable?: boolean;
  clickable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles = {
  elevated: "border border-gray-200 dark:border-gray-800 bg-surface shadow-sm",
  flat: "border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50",
  pressed:
    "border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 shadow-inner",
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
      "rounded-xl",
      "transition-all duration-200",
      variantStyles[variant],
      paddingStyles[padding],
      hoverable &&
        variant === "elevated" &&
        "hover:shadow-md hover:-translate-y-0.5",
      clickable && "cursor-pointer",
      className
    );

    if (hoverable || clickable) {
      return (
        <motion.div
          ref={ref}
          className={baseClassName}
          whileHover={{ scale: 1.005 }}
          whileTap={clickable ? { scale: 0.99 } : undefined}
          transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
          {...(props as HTMLMotionProps<"div">)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={baseClassName} {...props}>
        {children}
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
