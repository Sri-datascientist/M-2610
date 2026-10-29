import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ingById, medById } from "@/lib/mock-data";

// Radial map: medicine centre → ingredients → properties.
export function KnowledgeMap({ medicineId = "triphala-churna" }: { medicineId?: string }) {
  const med = medById(medicineId)!;
  const navigate = useNavigate();
  const [hover, setHover] = useState<string | null>(null);
  const cx = 260, cy = 190;
  const ings = med.ingredients.map((x, i, a) => {
    const ang = (-90 + (360 / a.length) * i) * (Math.PI / 180);
    return { ing: ingById(x.ingredientId)!, ratio: x.ratio, x: cx + Math.cos(ang) * 120, y: cy + Math.sin(ang) * 120, ang };
  });
  const props = [
    { k: "Rasa", v: med.rasa.slice(0, 2).join(", ") },
    { k: "Virya", v: med.virya },
    { k: "Vipaka", v: med.vipaka },
    { k: "Karma", v: med.karma[0] },
  ].map((p, i) => {
    const ang = (-45 + 90 * i) * (Math.PI / 180);
    return { ...p, x: cx + Math.cos(ang) * 200, y: cy + Math.sin(ang) * 165 };
  });

  return (
    <svg viewBox="0 0 520 380" className="h-auto w-full" role="img" aria-label={`Knowledge map for ${med.name}`}>
      {props.map((p, i) => (
        <motion.line key={p.k} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--color-border)" strokeWidth={1} strokeDasharray="3 4"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4 + i * 0.08, duration: 0.8 }} />
      ))}
      {ings.map((n, i) => (
        <motion.line key={n.ing.id} x1={cx} y1={cy} x2={n.x} y2={n.y}
          stroke={hover === n.ing.id ? "var(--color-primary)" : "var(--color-primary)"} strokeOpacity={hover && hover !== n.ing.id ? 0.2 : 0.7} strokeWidth={hover === n.ing.id ? 2.5 : 1.5}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: i * 0.12, duration: 0.7 }} />
      ))}
      {props.map((p) => (
        <g key={p.k}>
          <rect x={p.x - 58} y={p.y - 20} width={116} height={40} rx={10} fill="var(--color-card)" stroke="var(--color-border)" />
          <text x={p.x} y={p.y - 4} textAnchor="middle" fontSize="9" fontWeight={700} letterSpacing="1.2" fill="var(--color-muted-foreground)">{p.k.toUpperCase()}</text>
          <text x={p.x} y={p.y + 11} textAnchor="middle" fontSize="11" fontWeight={600} fill="var(--color-foreground)">{p.v}</text>
        </g>
      ))}
      {ings.map((n, i) => (
        <motion.g key={n.ing.id} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.1 }}
          style={{ transformOrigin: `${n.x}px ${n.y}px`, cursor: "pointer" }}
          onMouseEnter={() => setHover(n.ing.id)} onMouseLeave={() => setHover(null)}
          onClick={() => navigate({ to: "/library", search: { q: n.ing.name } })}
          tabIndex={0} role="button" aria-label={`${n.ing.name}, search reference library`}
          onKeyDown={(e) => e.key === "Enter" && navigate({ to: "/library", search: { q: n.ing.name } })}
        >
          <circle cx={n.x} cy={n.y} r={hover === n.ing.id ? 36 : 32} fill="var(--color-primary-soft)" stroke="var(--color-primary)" strokeWidth={1.5} />
          <text x={n.x} y={n.y - 1} textAnchor="middle" fontSize="11" fontWeight={700} fill="var(--color-foreground)">{n.ing.name}</text>
          <text x={n.x} y={n.y + 13} textAnchor="middle" fontSize="9" fill="var(--color-muted-foreground)">{n.ratio}</text>
        </motion.g>
      ))}
      <circle cx={cx} cy={cy} r={48} fill="var(--color-ink)" />
      <circle cx={cx} cy={cy} r={54} fill="none" stroke="var(--color-primary)" strokeOpacity={0.4} />
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="12" fontWeight={800} fill="var(--color-ink-foreground)">{med.name.split(" ")[0]}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="var(--color-primary)">{med.form}</text>
    </svg>
  );
}
