import styles from "./ForgeLoader.module.css";
import { cn } from "@/utils";

interface ForgeLoaderProps {
  className?: string;
}

export function ForgeLoader({ className }: ForgeLoaderProps) {
  return (
    <div className={cn(styles.container, className)}>
      <svg
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svg}
      >
        <g transform="translate(0, 10)">
          <rect
            className={cn(styles.bar, styles.bar1, styles.logoColor)}
            x="35"
            y="80"
            width="18"
            height="25"
          />
          <rect
            className={cn(styles.bar, styles.bar2, styles.logoColor)}
            x="65"
            y="60"
            width="18"
            height="45"
          />
          <rect
            className={cn(styles.bar, styles.bar3, styles.logoColor)}
            x="95"
            y="72"
            width="18"
            height="33"
          />
          <rect
            className={cn(styles.bar, styles.bar4, styles.logoColor)}
            x="125"
            y="50"
            width="18"
            height="55"
          />

          <path
            className={styles.anvil}
            d="
                    M 35 105 
                    L 143 105 
                    L 143 115 
                    Q 115 115 108 135 
                    Q 105 150 133 150
                    L 133 160
                    L 45 160
                    L 45 150
                    Q 73 150 70 135
                    Q 63 115 35 115 
                    Z"
          />

          <polyline
            className={cn(styles.graphLine, styles.logoColor)}
            points="44,55 74,30 104,55 134,30"
          />

          <circle
            className={cn(styles.node, styles.node1, styles.logoColor)}
            cx="44"
            cy="55"
            r="5"
          />
          <circle
            className={cn(styles.node, styles.node2, styles.logoColor)}
            cx="74"
            cy="30"
            r="5"
          />
          <circle
            className={cn(styles.node, styles.node3, styles.logoColor)}
            cx="104"
            cy="55"
            r="5"
          />
          <circle
            className={cn(styles.node, styles.node4, styles.logoColor)}
            cx="134"
            cy="30"
            r="5"
          />
        </g>
      </svg>
    </div>
  );
}
