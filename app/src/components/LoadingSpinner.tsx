import { FC } from "react";
import Image from "next/image";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

const LoadingSpinner: FC = ({ size, className }: LoadingSpinnerProps) => (
  <div className={`flex flex-col ${className}`}>
    <Image
      className="animate-spin"
      src="/loader.png"
      width={size || 200}
      height={size || 200}
      alt="loading..."
    />

    <p className="prose text-center">Loading...</p>
  </div>
);

export default LoadingSpinner;
