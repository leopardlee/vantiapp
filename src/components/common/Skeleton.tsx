import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "animate-pulse bg-slate-800/40 rounded-lg relative overflow-hidden",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.03] before:to-transparent",
        className
      )} 
    />
  );
}

export function SkeletonCircle({ size = "w-10 h-10" }: { size?: string }) {
  return <Skeleton className={cn("rounded-full", size)} />;
}

export function SkeletonText({ className }: { className?: string }) {
  return <Skeleton className={cn("h-3 w-full", className)} />;
}
