import { FC } from "react";
import Image from "next/image";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

const LoadingSpinner: FC = ({ size, className }: LoadingSpinnerProps) => (
  <Image
    className={`animate-spin ${className}`}
    src="/hero.png"
    width={size || 100}
    height={size || 100}
    alt="loading..."
  />
);

export default LoadingSpinner;
