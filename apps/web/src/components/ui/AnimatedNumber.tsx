"use client";

import React, { useEffect, useRef, useState } from "react";

export interface AnimatedNumberProps {
  value: number;
  startValue?: number;
  durationMs?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  formatFn?: (val: number) => string;
  className?: string;
  triggerOnScroll?: boolean;
}

/**
 * Increase.com & Apple-Design inspired scroll-triggered number counter.
 * Smoothly counts from low to high using an exponential out curve (cubic/quartic damping)
 * when scrolled into the viewport or when the underlying value updates.
 */
export function AnimatedNumber({
  value,
  startValue = 0,
  durationMs = 550,
  decimals = 0,
  prefix = "",
  suffix = "",
  formatFn,
  className = "",
  triggerOnScroll = true,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [hasEnteredView, setHasEnteredView] = useState<boolean>(!triggerOnScroll);
  const elementRef = useRef<HTMLSpanElement | null>(null);
  const previousTargetRef = useRef<number>(startValue);

  useEffect(() => {
    if (!triggerOnScroll) {
      setHasEnteredView(true);
      return;
    }
    const el = elementRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setHasEnteredView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHasEnteredView(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -10px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [triggerOnScroll]);

  useEffect(() => {
    if (!hasEnteredView) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplayValue(value);
      previousTargetRef.current = value;
      return;
    }

    const fromValue =
      previousTargetRef.current === 0 && startValue === 0 && value > 0
        ? Number((value * 0.75).toFixed(decimals))
        : previousTargetRef.current;
    const toValue = value;
    if (Math.abs(toValue - fromValue) < 0.0001) {
      setDisplayValue(toValue);
      previousTargetRef.current = toValue;
      return;
    }

    let animationFrameId = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      if (progress >= 0.94) {
        setDisplayValue(toValue);
        previousTargetRef.current = toValue;
        return;
      }
      // Apple spring-like quartic ease-out without jarring overshoot on tabular numbers
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = fromValue + (toValue - fromValue) * eased;
      setDisplayValue(current);
      animationFrameId = window.requestAnimationFrame(step);
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value, startValue, decimals, durationMs, hasEnteredView]);

  const formatted = formatFn
    ? formatFn(displayValue)
    : `${prefix}${displayValue.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`;

  return (
    <span ref={elementRef} className={`tabular-nums ${className}`}>
      {formatted}
    </span>
  );
}

export interface AnimatedProgressBarProps {
  percent: number;
  colorClass?: string;
  heightClass?: string;
  className?: string;
  delayMs?: number;
}

/**
 * Scroll-triggered fluid progress bar with spring easing.
 */
export function AnimatedProgressBar({
  percent,
  colorClass = "bg-status-success-bar",
  heightClass = "h-2",
  className = "",
  delayMs = 0,
}: AnimatedProgressBarProps) {
  const [visible, setVisible] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div
      ref={barRef}
      className={`w-full ${heightClass} bg-subtle rounded-full overflow-hidden border border-hairline ${className}`}
    >
      <div
        className={`${heightClass} ${colorClass} rounded-full transition-all duration-1000 ease-out`}
        style={{
          width: visible ? `${clamped}%` : "0%",
          transitionDelay: `${delayMs}ms`,
        }}
      />
    </div>
  );
}

/**
 * Increase.com-inspired animated ascending treasury bar graphic.
 * Shows live settlement velocity rising from low to high on scroll.
 */
export function IncreasePulseBars({
  bars = [34, 50, 42, 64, 58, 78, 90, 100],
  activeColor = "bg-status-success-bar",
}: {
  bars?: number[] | number;
  activeColor?: string;
}) {
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const defaultHeights = [30, 42, 36, 52, 48, 66, 62, 78, 88, 100];
  const barArray = Array.isArray(bars)
    ? bars
    : defaultHeights.slice(defaultHeights.length - Math.max(4, Math.min(10, bars)));

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="inline-flex items-end gap-0.5 h-6 px-1.5 py-1 rounded-md bg-subtle/80 border border-hairline shrink-0"
    >
      {barArray.map((heightPct, idx) => {
        const isPeak = idx >= barArray.length - 2;
        const isMid = idx >= Math.floor(barArray.length / 2);
        const pxHeight = visible ? Math.max(4, Math.round(heightPct * 0.16)) : 4;
        const barOpacity = isPeak ? 1 : isMid ? 0.72 : 0.45;
        return (
          <span
            key={idx}
            className={`inline-block w-1 rounded-t-xs transition-all duration-500 ease-out ${activeColor}`}
            style={{
              height: `${pxHeight}px`,
              opacity: barOpacity,
              transitionDelay: `${idx * 35}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
