"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAuthSession } from "aws-amplify/auth";

type ExamItem = {
  exam_id?: string;
  id?: string;
  year?: string | number;
  term?: string;
  subject?: string;
  faculty?: string;
  title?: string;

  // 旧HTMLが参照していた有無判定（truthyなら「あり」扱い）
  answer?: any;
  answer_sheet?: any;

  // 既定の印刷方式
  print_default_style?: string;
};

type StudentInfo = { name: string; grade: string };

function normalizeItems<T>(data: any): T[] {
  return (data?.items || data?.Items || data?.data?.items || []) as T[];
}

async function getAccessToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() || null;
  } catch {
    return null;
  }
}

function labelOf(exam: ExamItem) {
  const year = exam.year ?? "-";
  const term = exam.term ?? "";
  const subject = exam.subject ?? "";
  const faculty = exam.faculty ?? "";
  const title = exam.title ?? "";
  const base = `${year}年 ${term} ${subject} ${faculty}`.trim();
  return title ? `${base} ${title}`.trim() : base;
}

const STYLE_OPTIONS = [
  { label: "（指定なし）", value: "" },
  { label: "B4冊子", value: "B4冊子" },
  { label: "B4/2ページ刷り", value: "B4/2ページ刷り" },
  { label: "B5", value: "B5" },
  { label: "A4", value: "A4" },
] as const;

type RowState = {
  examId: string;
  mainCopies: number;
  mainStyle: string;

  includeAnswer: boolean;
  answerCopies: number;
  answerStyle: string;

  includeSheet: boolean;
  sheetCopies: number;
  sheetStyle: string;
};

export default function ReservationCheckPage() {
  const router = useRouter();

  const [studentName, setStudentName] = useState("");
  const [studentGrade, setStudentGrade] = useState("");

  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [rows, setRows] = useState<RowState[]>([]);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ---- sessionStorage から復元（reservation page が保存している想定）
  useEffect(() => {
    try {
      const ids = JSON.parse(sessionStorage.getItem("selected_exam_ids") || "[]") as string[];
      const info = JSON.parse(sessionStorage.getItem("student_info") || "null") as StudentInfo | null;

      if (!ids?.length || !info) {
        alert("選択情報が見つかりません。予約ページに戻ります。");
        router.push("/student/reservation");
        return;
      }

      setSelectedExamIds(ids);
      setStudentName(info.name || "");
      setStudentGrade(info.grade || "");
    } catch {
      alert("選択情報の復元に失敗しました。予約ページに戻ります。");
      router.push("/student/reservation");
    }
  }, [router]);

  // ---- 選択IDの詳細を取得
  useEffect(() => {
    (async () => {
      if (!selectedExamIds.length) return;

      setLoading(true);
      setErrorMsg(null);

      const token = await getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("/api/proxy/exams", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ exam_ids: selectedExamIds }),
        });

        const text = await res.text();
        if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

        const data = JSON.parse(text);
        const items = normalizeItems<ExamItem>(data);

        setExams(items);

        // 旧check.htmlの初期値に寄せる：部数=1 / 方式=print_default_style or ""
        const initRows: RowState[] = items.map((ex, idx) => {
          const examId = (ex.exam_id || ex.id || selectedExamIds[idx] || `row-${idx}`) as string;
          const defStyle = ex.print_default_style || "";
          const hasAnswer = !!ex.answer;
          const hasSheet = !!ex.answer_sheet;

          return {
            examId,
            mainCopies: 1,
            mainStyle: defStyle,

            includeAnswer: hasAnswer,
            answerCopies: hasAnswer ? 1 : 0,
            answerStyle: defStyle,

            includeSheet: hasSheet,
            sheetCopies: hasSheet ? 1 : 0,
            sheetStyle: defStyle,
          };
        });

        setRows(initRows);
      } catch (e: any) {
        setErrorMsg(`過去問情報の取得に失敗しました: ${e?.message || String(e)}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [router, selectedExamIds]);

  const selectedCountText = useMemo(() => {
    const n = selectedExamIds.length;
    return n ? `選択数：${n}件` : "";
  }, [selectedExamIds]);

  const updateRow = (examId: string, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((r) => (r.examId === examId ? { ...r, ...patch } : r)));
  };

  const onSubmit = async () => {
    setErrorMsg(null);

    const name = studentName.trim();
    const grade = studentGrade.trim();

    if (!name || !grade) {
      alert("氏名と学年を入力してください。");
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    // jobs payload（旧check.htmlと互換）:contentReference[oaicite:5]{index=5}
    const jobs = rows.map((r) => ({
      exam_id: r.examId,
      copies: r.mainCopies,
      style: r.mainStyle,

      include_answer: r.includeAnswer,
      answer_copies: r.includeAnswer ? r.answerCopies : 0,
      answer_style: r.includeAnswer ? r.answerStyle : "",

      include_answer_sheet: r.includeSheet,
      answer_sheet_copies: r.includeSheet ? r.sheetCopies : 0,
      answer_sheet_style: r.includeSheet ? r.sheetStyle : "",
    }));

    setSending(true);
    try {
      const res = await fetch("/api/proxy/print-jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_name: name,
          student_grade: grade,
          jobs,
        }),
      });

      const raw = await res.text();
      if (!res.ok) throw new Error(raw || `HTTP ${res.status}`);

      // 成功：セッション掃除 → doneへ
      sessionStorage.removeItem("selected_exam_ids");
      sessionStorage.removeItem("student_info");

      router.push(`/student/reservation/done?count=${encodeURIComponent(String(jobs.length))}`);
    } catch (e: any) {
      setErrorMsg(`予約送信に失敗しました: ${e?.message || String(e)}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="text-center text-sm font-semibold text-gray-700">送信内容の確認</div>

      {/* 予約者情報 */}
      <div className="mt-8 rounded-xl ring-1 ring-gray-200 bg-white px-4 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm font-bold text-gray-800">氏名</div>
          <input
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="h-11 w-full max-w-xs rounded-md px-3 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-300"
            placeholder="例：古川 太郎"
          />
          <div className="text-sm font-bold text-gray-800">学年</div>
          <input
            value={studentGrade}
            onChange={(e) => setStudentGrade(e.target.value)}
            className="h-11 w-full max-w-[160px] rounded-md px-3 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-300"
            placeholder="例：高3"
          />
          <div className="text-sm font-semibold text-gray-600">{selectedCountText}</div>
        </div>

        <div className="mt-2 text-xs font-semibold text-gray-500">
          ※ ここで氏名・学年を修正してOK。送信時はこの値が使われます。
        </div>
      </div>

      {/* エラー */}
      {errorMsg && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
          {errorMsg}
        </div>
      )}

      {/* テーブル */}
      <div className="mt-4 rounded-xl ring-1 ring-gray-200 bg-white px-4 py-4">
        <div className="text-sm font-bold text-gray-900">内容の確認</div>
        <div className="mt-2 text-xs font-semibold text-gray-600">
          ※ 解答・解答用紙が存在しない過去問は「なし」と表示され、部数/方式は入力できません。
        </div>

        {loading ? (
          <div className="mt-4 rounded-md bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-700">
            読み込み中...
          </div>
        ) : exams.length === 0 ? (
          <div className="mt-4 rounded-md bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-700">
            対象の過去問がありません。
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-3 py-3 text-left">過去問</th>
                  <th className="px-3 py-3 text-center">本体（部数）</th>
                  <th className="px-3 py-3 text-center">本体（印刷方式）</th>
                  <th className="px-3 py-3 text-center">解答</th>
                  <th className="px-3 py-3 text-center">解答（部数）</th>
                  <th className="px-3 py-3 text-center">解答（印刷方式）</th>
                  <th className="px-3 py-3 text-center">解答用紙</th>
                  <th className="px-3 py-3 text-center">用紙（部数）</th>
                  <th className="px-3 py-3 text-center">用紙（印刷方式）</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {exams.map((ex, idx) => {
                  const examId = (ex.exam_id || ex.id || `row-${idx}`) as string;
                  const row = rows.find((r) => r.examId === examId);
                  if (!row) return null;

                  const hasAnswer = !!ex.answer;
                  const hasSheet = !!ex.answer_sheet;

                  return (
                    <tr key={examId} className="hover:bg-gray-50">
                      <td className="px-3 py-3 font-semibold text-gray-900">
                        {labelOf(ex)}
                      </td>

                      {/* main copies */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={row.mainCopies}
                          onChange={(e) => updateRow(examId, { mainCopies: Math.max(1, Number(e.target.value || 1)) })}
                          className="h-9 w-20 rounded-md px-2 text-center ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-300"
                        />
                      </td>

                      {/* main style */}
                      <td className="px-3 py-3 text-center">
                        <select
                          value={row.mainStyle}
                          onChange={(e) => updateRow(examId, { mainStyle: e.target.value })}
                          className="h-9 rounded-md px-2 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-300"
                        >
                          {STYLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* answer exists */}
                      <td className="px-3 py-3 text-center">{hasAnswer ? "あり" : "なし"}</td>

                      {/* answer copies */}
                      <td className="px-3 py-3 text-center">
                        {hasAnswer ? (
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={row.answerCopies}
                            onChange={(e) =>
                              updateRow(examId, { answerCopies: Math.max(1, Number(e.target.value || 1)) })
                            }
                            className="h-9 w-20 rounded-md px-2 text-center ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-300"
                          />
                        ) : (
                          <span className="text-gray-400 font-semibold">-</span>
                        )}
                      </td>

                      {/* answer style */}
                      <td className="px-3 py-3 text-center">
                        {hasAnswer ? (
                          <select
                            value={row.answerStyle}
                            onChange={(e) => updateRow(examId, { answerStyle: e.target.value })}
                            className="h-9 rounded-md px-2 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-300"
                          >
                            {STYLE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-gray-400 font-semibold">-</span>
                        )}
                      </td>

                      {/* sheet exists */}
                      <td className="px-3 py-3 text-center">{hasSheet ? "あり" : "なし"}</td>

                      {/* sheet copies */}
                      <td className="px-3 py-3 text-center">
                        {hasSheet ? (
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={row.sheetCopies}
                            onChange={(e) =>
                              updateRow(examId, { sheetCopies: Math.max(1, Number(e.target.value || 1)) })
                            }
                            className="h-9 w-20 rounded-md px-2 text-center ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-300"
                          />
                        ) : (
                          <span className="text-gray-400 font-semibold">-</span>
                        )}
                      </td>

                      {/* sheet style */}
                      <td className="px-3 py-3 text-center">
                        {hasSheet ? (
                          <select
                            value={row.sheetStyle}
                            onChange={(e) => updateRow(examId, { sheetStyle: e.target.value })}
                            className="h-9 rounded-md px-2 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-300"
                          >
                            {STYLE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-gray-400 font-semibold">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 操作 */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-11 rounded-md bg-white px-5 text-sm font-bold text-gray-800 ring-1 ring-gray-200 hover:bg-gray-50"
        >
          戻る
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || sending || exams.length === 0}
          className="h-11 rounded-md bg-sky-800 px-6 text-sm font-bold text-white hover:bg-sky-900 disabled:opacity-60"
        >
          {sending ? "送信中..." : "この内容で送信"}
        </button>
      </div>

      <div className="mt-8 rounded-md bg-yellow-100 px-4 py-4 text-center text-sm font-semibold text-gray-800">
        {/* ここは後で固定枠AdSenseに差し替えればOK */}
      </div>
    </div>
  );
}
