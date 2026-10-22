import { useRef } from "react";

// Returns handlers that tilt an element toward the pointer in 3D.
// Writes CSS variables (--rx, --ry, --gx, --gy) that theme.css reads.
export default function useTilt(maxDeg = 8) {
  const ref = useRef(null);

  const onPointerMove = (event) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    el.style.setProperty("--ry", `${(x - 0.5) * maxDeg * 2}deg`);
    el.style.setProperty("--rx", `${-(y - 0.5) * maxDeg * 2}deg`);
    el.style.setProperty("--gx", `${x * 100}%`);
    el.style.setProperty("--gy", `${y * 100}%`);
  };

  const onPointerLeave = () => {
    const el = ref.current;
    if (!el) return;

    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return { ref, onPointerMove, onPointerLeave };
}
