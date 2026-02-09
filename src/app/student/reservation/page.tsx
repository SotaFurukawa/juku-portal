"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAuthSession } from "aws-amplify/auth";

type ExamMeta = {
  kind?: string;
  category?: string;
  org_name?: string;
  area?: string;
  kind_order?: number;
  category_order?: number;
  area_order?: number;
  org_order?: number;
};

type ExamItem = {
  exam_id?: string;
  id?: string;
  title?: string;
  year?: string | number;

  kind?: string;
  category?: string;
  org_name?: string;
  area?: string;

  // ★④の表（年度×学部×科目）に必要
  faculty?: string; // 学部
  term?: string; // 日程(前期/中期/後期など)
  subject?: string; // 科目（横軸）
  subject_order?: number; // 科目並び順（あれば）
};

function normalizeItems<T>(data: any): T[] {
  return (data?.items || data?.Items || data?.data?.items || []) as T[];
}

async function getAccessToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.accessToken?.toString();
    return token || null;
  } catch {
    return null;
  }
}

export default function ReservationPage() {
  const router = useRouter();

  // ===== student info (legacy互換) =====
  const [studentName, setStudentName] = useState("");
  const [studentGrade, setStudentGrade] = useState("");

  // ===== meta / selections =====
  const [meta, setMeta] = useState<ExamMeta[]>([]);
  const [selectedKind, setSelectedKind] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  // ===== exams =====
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);

  // ★④：学部・日程で絞り込み（任意）
  const [selectedFacTermKey, setSelectedFacTermKey] = useState<string>("ALL");

  // ===== ui state =====
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingExams, setLoadingExams] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 予約者情報の復元（旧student/index.html互換）
  useEffect(() => {
    try {
      const lastName = localStorage.getItem("sg_last_student_name") || "";
      const lastGrade = localStorage.getItem("sg_last_student_grade") || "";
      setStudentName(lastName);
      setStudentGrade(lastGrade);
    } catch {
      // noop
    }
  }, []);

  // meta取得
  useEffect(() => {
    (async () => {
      setLoadingMeta(true);
      setErrorMsg(null);

      const token = await getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("/api/proxy/exams/meta", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const text = await res.text();
        if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

        const data = JSON.parse(text);
        const items = normalizeItems<ExamMeta>(data);

        setMeta(items);

        // 初期値は未選択
        setSelectedKind(null);
        setSelectedCategory(null);
        setSelectedArea(null);
        setSelectedOrg(null);

        setExams([]);
        setSelectedExamIds([]);
        setSelectedFacTermKey("ALL");
      } catch (e: any) {
        setErrorMsg(`過去問マスタの取得に失敗しました: ${e?.message || String(e)}`);
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, [router]);

  // ===== derived lists =====
  const kinds = useMemo(() => {
    const map = new Map<string, number>();
    meta.forEach((m) => {
      const k = (m.kind || "その他").trim();
      if (!map.has(k)) map.set(k, Number.isFinite(m.kind_order as any) ? (m.kind_order as any) : 9999);
    });
    return [...map.entries()]
      .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0], "ja"))
      .map(([k]) => k);
  }, [meta]);

  const categories = useMemo(() => {
    if (!selectedKind) return [];
    const map = new Map<string, number>();
    meta
      .filter((m) => (m.kind || "その他").trim() === selectedKind)
      .forEach((m) => {
        const c = (m.category || "その他").trim();
        if (!map.has(c)) map.set(c, Number.isFinite(m.category_order as any) ? (m.category_order as any) : 9999);
      });
    return [...map.entries()]
      .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0], "ja"))
      .map(([c]) => c);
  }, [meta, selectedKind]);

  const areaOrgGroups = useMemo(() => {
    if (!selectedKind || !selectedCategory) return [];

    type OrgRow = { area: string; org: string; area_order: number; org_order: number };
    const keyMap = new Map<string, OrgRow>();

    meta
      .filter((m) => (m.kind || "その他").trim() === selectedKind)
      .filter((m) => (m.category || "その他").trim() === selectedCategory)
      .forEach((m) => {
        const area = (m.area || "").trim();
        const org = (m.org_name || "その他").trim();

        const area_order = Number.isFinite(m.area_order as any) ? (m.area_order as any) : 9999;
        const org_order = Number.isFinite(m.org_order as any) ? (m.org_order as any) : 9999;

        const key = `${area}||${org}`;
        if (!keyMap.has(key)) keyMap.set(key, { area, org, area_order, org_order });
      });

    const rows = [...keyMap.values()].sort(
      (a, b) =>
        a.area_order - b.area_order ||
        a.area.localeCompare(b.area, "ja") ||
        a.org_order - b.org_order ||
        a.org.localeCompare(b.org, "ja")
    );

    const grouped = new Map<string, OrgRow[]>();
    rows.forEach((r) => {
      const k = r.area || "エリア未設定";
      if (!grouped.has(k)) grouped.set(k, []);
      grouped.get(k)!.push(r);
    });

    return [...grouped.entries()].map(([area, orgs]) => ({ area, orgs }));
  }, [meta, selectedKind, selectedCategory]);

  // kind/categoryが変わったら下位状態をリセット
  useEffect(() => {
    setSelectedCategory(null);
    setSelectedArea(null);
    setSelectedOrg(null);
    setExams([]);
    setSelectedExamIds([]);
    setSelectedFacTermKey("ALL");
  }, [selectedKind]);

  useEffect(() => {
    setSelectedArea(null);
    setSelectedOrg(null);
    setExams([]);
    setSelectedExamIds([]);
    setSelectedFacTermKey("ALL");
  }, [selectedCategory]);

  // org選択で exams を取得
  useEffect(() => {
    if (!selectedKind || !selectedCategory || !selectedOrg) return;

    (async () => {
      setLoadingExams(true);
      setErrorMsg(null);

      const token = await getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const qs = new URLSearchParams({
          kind: selectedKind,
          category: selectedCategory,
          org_name: selectedOrg,
        });
        if (selectedArea) qs.set("area", selectedArea);

        const res = await fetch(`/api/proxy/exams?${qs.toString()}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const text = await res.text();
        if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

        const data = JSON.parse(text);
        const items = normalizeItems<ExamItem>(data);

        setExams(items);
        setSelectedExamIds([]);
        setSelectedFacTermKey("ALL");
      } catch (e: any) {
        setErrorMsg(`過去問一覧の取得に失敗しました: ${e?.message || String(e)}`);
      } finally {
        setLoadingExams(false);
      }
    })();
  }, [router, selectedKind, selectedCategory, selectedOrg, selectedArea]);

  const toggleExam = (id: string) => {
    setSelectedExamIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const saveStudentInputs = () => {
    try {
      localStorage.setItem("sg_last_student_name", studentName);
      localStorage.setItem("sg_last_student_grade", studentGrade);
    } catch {
      // noop
    }
  };

  const goNext = () => {
    if (!selectedExamIds.length) {
      alert("少なくとも1つ、印刷したい過去問を選択してください。");
      return;
    }

    if (!studentName.trim() || !studentGrade.trim()) {
      const ok = confirm("お名前・学年が未入力です。このまま進みますか？");
      if (!ok) return;
    }

    saveStudentInputs();

    sessionStorage.setItem("selected_exam_ids", JSON.stringify(selectedExamIds));
    sessionStorage.setItem("student_info", JSON.stringify({ name: studentName.trim(), grade: studentGrade.trim() }));

    router.push("/student/reservation/check");
  };

  // =========================
  // ★④：年度×学部×科目 の表を作るための派生データ
  // =========================
  const enabledExams = useMemo(() => {
    // 旧HTMLの enabled=false 相当が来る可能性があるならここで弾けます（今回は存在しない前提）
    return exams;
  }, [exams]);

  const subjects = useMemo(() => {
    const map = new Map<string, number>();
    enabledExams.forEach((e) => {
      const s = (e.subject || "その他").trim();
      const so = Number.isFinite(e.subject_order as any) ? (e.subject_order as any) : 9999;
      if (!map.has(s) || so < (map.get(s) ?? 9999)) map.set(s, so);
    });
    return [...map.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0], "ja")).map(([s]) => s);
  }, [enabledExams]);

  const years = useMemo(() => {
    const set = new Set<number>();
    enabledExams.forEach((e) => {
      const y = Number(e.year);
      if (Number.isFinite(y) && y) set.add(y);
    });
    return [...set].sort((a, b) => b - a);
  }, [enabledExams]);

  const facTerms = useMemo(() => {
    // key = fac||term
    const map = new Map<string, { fac: string; term: string; label: string }>();
    enabledExams.forEach((e) => {
      const fac = (e.faculty || "").trim();
      const term = (e.term || "").trim();
      const key = `${fac}||${term}`;
      const label = term ? `${fac}・${term}` : fac;
      if (!map.has(key)) map.set(key, { fac, term, label });
    });

    const termOrderMap: Record<string, number> = { 前期: 1, 中期: 2, 後期: 3 };

    return [...map.values()].sort((a, b) => {
      const facCmp = a.fac.localeCompare(b.fac, "ja");
      if (facCmp !== 0) return facCmp;

      const tA = termOrderMap[a.term] ?? 999;
      const tB = termOrderMap[b.term] ?? 999;
      if (tA !== tB) return tA - tB;

      return a.term.localeCompare(b.term, "ja");
    });
  }, [enabledExams]);

  const filteredFacTerms = useMemo(() => {
    if (selectedFacTermKey === "ALL") return facTerms;
    const [fac, term] = selectedFacTermKey.split("||");
    return facTerms.filter((ft) => ft.fac === (fac ?? "") && ft.term === (term ?? ""));
  }, [facTerms, selectedFacTermKey]);

  // facTermKey が無効になったら ALL に戻す
  useEffect(() => {
    if (selectedFacTermKey === "ALL") return;
    const ok = facTerms.some((ft) => `${ft.fac}||${ft.term}` === selectedFacTermKey);
    if (!ok) setSelectedFacTermKey("ALL");
  }, [facTerms, selectedFacTermKey]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="text-center text-sm font-semibold text-gray-700">印刷予約</div>

      <SectionTitle title="予約者情報" />
      <div className="mt-3 rounded-xl ring-1 ring-gray-200 bg-white px-4 py-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="お名前">
            <input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="h-11 w-full rounded-md px-3 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-300"
              placeholder="例：古川 太郎"
            />
          </Field>
          <Field label="学年">
            <input
              value={studentGrade}
              onChange={(e) => setStudentGrade(e.target.value)}
              className="h-11 w-full rounded-md px-3 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-300"
              placeholder="例：高3"
            />
          </Field>
        </div>
      </div>

      <SectionTitle title="過去問を選ぶ" />

      {/* Meta Loading / Error */}
      <div className="mt-3">
        {loadingMeta && (
          <div className="rounded-xl bg-gray-50 px-4 py-4 text-sm font-semibold text-gray-700">読み込み中...</div>
        )}
        {errorMsg && (
          <div className="rounded-xl bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">{errorMsg}</div>
        )}
      </div>

      {/* Step: Kind */}
      {!loadingMeta && !errorMsg && (
        <div className="mt-4 rounded-xl ring-1 ring-gray-200 bg-white px-4 py-4">
          <div className="text-sm font-bold text-gray-900">1) 種別（kind）</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {kinds.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSelectedKind(k)}
                className={[
                  "rounded-md px-3 py-2 text-sm font-bold ring-1",
                  selectedKind === k
                    ? "bg-sky-800 text-white ring-sky-800"
                    : "bg-white text-gray-800 ring-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Category */}
      {!loadingMeta && !errorMsg && (
        <div className="mt-4 rounded-xl ring-1 ring-gray-200 bg-white px-4 py-4">
          <div className="text-sm font-bold text-gray-900">2) カテゴリ（category）</div>
          {!selectedKind ? (
            <div className="mt-2 text-sm font-semibold text-gray-600">先に「種別」を選んでください。</div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCategory(c)}
                  className={[
                    "rounded-md px-3 py-2 text-sm font-bold ring-1",
                    selectedCategory === c
                      ? "bg-sky-800 text-white ring-sky-800"
                      : "bg-white text-gray-800 ring-gray-200 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step: Org */}
      {!loadingMeta && !errorMsg && (
        <div className="mt-4 rounded-xl ring-1 ring-gray-200 bg-white px-4 py-4">
          <div className="text-sm font-bold text-gray-900">3) 学校/団体（org）</div>
          {!selectedKind || !selectedCategory ? (
            <div className="mt-2 text-sm font-semibold text-gray-600">「種別」と「カテゴリ」を選んでください。</div>
          ) : (
            <div className="mt-4 space-y-6">
              {areaOrgGroups.map((g) => (
                <div key={g.area}>
                  <div className="text-sm font-bold text-gray-800">{g.area}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {g.orgs.map((o) => {
                      const active = selectedOrg === o.org && (selectedArea || "") === (o.area || "");
                      return (
                        <button
                          key={`${o.area}||${o.org}`}
                          type="button"
                          onClick={() => {
                            setSelectedArea(o.area || null);
                            setSelectedOrg(o.org);
                          }}
                          className={[
                            "rounded-md px-3 py-2 text-sm font-bold ring-1",
                            active
                              ? "bg-sky-800 text-white ring-sky-800"
                              : "bg-white text-gray-800 ring-gray-200 hover:bg-gray-50",
                          ].join(" ")}
                        >
                          {o.org}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 h-px w-full bg-gray-100" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===========================
          ★ Step: Exams（④だけ作り直し）
          =========================== */}
      {!loadingMeta && !errorMsg && (
        <div className="mt-4 rounded-xl ring-1 ring-gray-200 bg-white px-4 py-4">
          <div className="text-sm font-bold text-gray-900">4) 過去問を選択（年度 × 学部 × 科目）</div>

          {!selectedOrg ? (
            <div className="mt-2 text-sm font-semibold text-gray-600">
              「学校/団体」を選ぶと表が表示されます。
            </div>
          ) : loadingExams ? (
            <div className="mt-3 rounded-md bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-700">
              一覧を読み込み中...
            </div>
          ) : enabledExams.length === 0 ? (
            <div className="mt-3 rounded-md bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-700">
              該当する過去問がありません。
            </div>
          ) : (
            <>
              <div className="mt-3 text-sm font-semibold text-gray-700">
                印刷したい過去問のマスにチェックを入れてください。
              </div>

              {/* 学部・日程で絞り込み（任意） */}
              {facTerms.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-700">
                  <span>学部・日程で絞り込み（任意）：</span>
                  <select
                    className="h-10 rounded-md px-3 ring-1 ring-gray-200 bg-white"
                    value={selectedFacTermKey}
                    onChange={(e) => setSelectedFacTermKey(e.target.value || "ALL")}
                  >
                    <option value="ALL">すべて表示</option>
                    {facTerms.map((ft) => {
                      const key = `${ft.fac}||${ft.term}`;
                      return (
                        <option key={key} value={key}>
                          {ft.label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* 表 */}
{/* 表（ヘッダー固定 + 表内スクロール） */}
<div className="mt-3 rounded-lg ring-1 ring-gray-200 overflow-hidden bg-white">
  {/* 横スクロールは外側、縦スクロールは内側 */}
  <div className="overflow-x-auto">
    <div className="max-h-[520px] overflow-y-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            <th className="sticky top-0 z-20 bg-gray-50 px-3 py-3 text-left whitespace-nowrap">
              年度
            </th>
            <th className="sticky top-0 z-20 bg-gray-50 px-3 py-3 text-left whitespace-nowrap">
              学部
            </th>
            {subjects.map((s) => (
              <th
                key={s}
                className="sticky top-0 z-20 bg-gray-50 px-3 py-3 text-left whitespace-nowrap"
              >
                {s}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y">
          {years.flatMap((y) =>
            filteredFacTerms.map((ft) => {
              const rowExams = enabledExams.filter(
                (e) =>
                  Number(e.year) === y &&
                  (e.faculty || "").trim() === ft.fac &&
                  (e.term || "").trim() === ft.term
              );
              if (rowExams.length === 0) return null;

              return (
                <tr key={`${y}||${ft.fac}||${ft.term}`} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-semibold text-gray-900 whitespace-nowrap">
                    {y}
                  </td>
                  <td className="px-3 py-3 font-semibold text-gray-900 whitespace-nowrap">
                    {ft.label}
                  </td>

                  {subjects.map((subj) => {
                    const hit = rowExams.find((e) => (e.subject || "その他").trim() === subj);
                    if (!hit) {
                      return (
                        <td key={subj} className="px-3 py-3 text-gray-400">
                          -
                        </td>
                      );
                    }

                    const id = (hit.exam_id || hit.id) as string;
                    const checked = selectedExamIds.includes(id);

                    return (
                      <td key={subj} className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleExam(id)}
                          className="h-4 w-4 accent-sky-800"
                          aria-label={`${y} ${ft.label} ${subj}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
</div>


              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-gray-700">選択中：{selectedExamIds.length} 件</div>
                <button
                  type="button"
                  onClick={goNext}
                  className="h-11 rounded-md bg-sky-800 px-6 text-sm font-bold text-white hover:bg-sky-900"
                >
                  確認へ
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mt-10">
      <div className="text-sm font-bold text-gray-900">{title}</div>
      <div className="mt-2 h-px w-full bg-gray-200" />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-bold text-gray-800">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
