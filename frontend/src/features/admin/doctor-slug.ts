type DoctorIdentity = { id: string; name: string };

function urlToken(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Readable slug from a doctor's name, without a title such as "Dr." */
export function doctorNameSlug(name: string): string {
  return urlToken(name.replace(/^\s*dr\.?\s+/i, ""));
}

function withId(base: string, id: string): string {
  const idSlug = urlToken(id);
  if (!idSlug || base === idSlug || base.endsWith(`-${idSlug}`)) return base || idSlug || "doctor";
  return base ? `${base}-${idSlug}` : idSlug;
}

/**
 * One stable slug per doctor id. Shared names get the doctor's id as a suffix
 * so two people are never given the same URL.
 */
export function doctorSlugMap(doctors: readonly DoctorIdentity[]): Map<string, string> {
  const bases = doctors.map((doctor) => {
    const nameSlug = doctorNameSlug(doctor.name);
    return { id: doctor.id, base: nameSlug || urlToken(doctor.id) || "doctor" };
  });
  const baseCounts = new Map<string, number>();
  for (const item of bases) {
    baseCounts.set(item.base, (baseCounts.get(item.base) ?? 0) + 1);
  }

  const assigned = new Map<string, string>();
  for (const item of bases) {
    const shared = (baseCounts.get(item.base) ?? 0) > 1;
    assigned.set(item.id, shared ? withId(item.base, item.id) : item.base);
  }

  const bySlug = new Map<string, string[]>();
  for (const [id, slug] of assigned) {
    const ids = bySlug.get(slug) ?? [];
    ids.push(id);
    bySlug.set(slug, ids);
  }
  for (const [slug, ids] of bySlug) {
    if (ids.length < 2) continue;
    for (const id of ids) assigned.set(id, withId(slug, id));
  }

  return assigned;
}

export function findDoctorBySlug<T extends DoctorIdentity>(
  doctors: readonly T[],
  slug: string,
): T | undefined {
  const slugs = doctorSlugMap(doctors);
  const bySlug = doctors.find((doctor) => slugs.get(doctor.id) === slug);
  if (bySlug) return bySlug;
  const clean = slug.toLowerCase();
  return doctors.find((doctor) => doctor.id.toLowerCase() === clean);
}
