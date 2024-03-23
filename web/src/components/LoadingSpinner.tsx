import { FC } from "react";
import Image from "next/image";
import logo512 from "../assets/logo512.png";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

const LoadingSpinner: FC = ({ size, className }: LoadingSpinnerProps) => (
  <Image
    placeholder="blur"
    className={`animate-spin ${className}`}
    src={logo512}
    width={size || 100}
    height={size || 100}
    alt="loading..."
  />
);

export default LoadingSpinner;
