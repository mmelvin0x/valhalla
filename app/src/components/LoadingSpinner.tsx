import { FC } from "react";
import Image from "next/image";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

const LoadingSpinner: FC = ({ size, className }: LoadingSpinnerProps) => (
  <div className={`flex flex-col mx-auto ${className}`}>
    <Image
      className="animate-spin"
      src="/hero.png"
      width={size || 100}
      height={size || 100}
      alt="loading..."
    />
  </div>
);

export default LoadingSpinner;
