import type { Counselor } from "@/types";
import { FALLBACK_COUNSELORS } from "@/lib/constants/counselors";

type ListResponse = {
  counselors?: Counselor[];
};

type DetailResponse = {
  counselor?: Counselor;
};

async function requestJSON<T>(input: RequestInfo, init?: RequestInit) {
  try {
    const response = await fetch(input, {
      cache: "no-store",
      next: { revalidate: 0 },
      ...init,
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error("Counselor request failed", error);
    return null;
  }
}

export async function loadCounselors(): Promise<Counselor[]> {
  const data = await requestJSON<ListResponse>("/api/counselors");
  return data?.counselors ?? FALLBACK_COUNSELORS;
}

export async function loadCounselorById(id: string): Promise<Counselor | null> {
  const data = await requestJSON<DetailResponse>(`/api/counselors/${id}`);
  if (data?.counselor) {
    return data.counselor;
  }
  return FALLBACK_COUNSELORS.find((counselor) => counselor.id === id) ?? null;
}
