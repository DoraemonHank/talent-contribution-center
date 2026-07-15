"use client";

import { useCallback, useMemo, useState } from "react";
import { org, people } from "./data";

type Person = (typeof people)[number];
type View = "overview" | "groups" | "managers";
type Decision = { c?: number; action?: string; note?: string };
type Quadrant = keyof typeof quadrantMeta;

const groupMeta = {
  ALL: { name: "全公司", leader: "CEO Office" },
  PVG: { name: "產品價值大隊", leader: "Henry" },
  UVG: { name: "用戶價值大隊", leader: "Lev" },
  BEO: { name: "經營賦能與營運大隊", leader: "Stanley" },
  其他: { name: "其他／CEO Office", leader: "CEO Office" },
} as const;

const quadrantMeta = {
  核心關鍵: { en: "CORE TALENT", note: "高貢獻 × 高關鍵性", color: "violet" },
  穩定戰力: { en: "ANCHOR", note: "高貢獻 × 聚焦現職", color: "blue" },
  成長加速: { en: "ACCELERATE", note: "成長中 × 高關鍵性", color: "cyan" },
  角色聚焦: { en: "FOCUS", note: "成長中 × 聚焦現職", color: "slate" },
} as const;

const levelText: Record<number, string> = {
  1: "指導下完成工作", 2: "獨立完成例行工作", 3: "處理非例行狀況", 4: "負責完整工作範圍",
  5: "定義問題並影響他人", 6: "完整思考軌跡與跨隊影響", 7: "影響跨部門決策", 8: "影響公司級議題",
};

const axisGuides = [
  {
    code: "01",
    name: "思考品質",
    en: "Thinking Quality",
    definition: "判斷同仁是否能從理解任務、拆解問題，進一步做到定義問題、評估取捨，並在資訊不完整時提出清楚且可執行的判斷。",
    observe: "看他是否能說明問題背景、真正原因、判斷依據、選項取捨與預期結果，而不只回報做了哪些事。",
    examples: [
      "C1｜在明確指示與逐步確認下執行；遇到變化時需要主管協助判斷。",
      "C2｜依既有規則完成例行工作；遇到例外時仍需要主管給方向。",
      "C3｜遇到非例行問題，能先整理資訊、提出可能原因並主動回報。",
      "C4｜能獨立處理完整工作範圍，評估方案並說明為何這樣決定。",
      "C5｜能重新定義模糊問題、提出取捨原則，讓其他人據此做出更好的決策。",
      "C6｜面對跨團隊複雜議題，能呈現完整思考軌跡，整合多方資訊並預判連鎖影響。",
      "C7｜能建立跨部門共同使用的問題框架，影響重要資源配置與決策。",
      "C8｜能定義公司級核心問題，連結長期策略、風險與整體經營取捨。",
    ],
  },
  {
    code: "02",
    name: "影響他人",
    en: "Influence",
    definition: "判斷同仁是否能讓資訊、共識與行動跨越個人職務邊界，推動他人或跨部門共同完成結果。",
    observe: "看他是否能主動對齊期待、處理歧見、取得承諾、推進卡點，並讓合作對象真正採取行動。",
    examples: [
      "C1｜能接收指令並回應基本資訊；需要主管協助安排與他人的協作。",
      "C2｜能清楚回報自己的進度與需求，完成基本協作。",
      "C3｜發現卡點會主動溝通，能在非例行狀況下協調相關同仁。",
      "C4｜能主導一段完整協作流程，對齊多方需求並持續推進至完成。",
      "C5｜沒有正式職權也能影響不同角色，建立共同判斷與合作方式。",
      "C6｜能處理跨團隊衝突與複雜利害關係，使共識轉化為持續行動。",
      "C7｜能影響跨部門主管的資源配置、優先順序與重要決策。",
      "C8｜能凝聚公司級共識，改變高階決策者與整體組織的行動方向。",
    ],
  },
  {
    code: "03",
    name: "組織貢獻",
    en: "Institutionalization",
    definition: "判斷成果是否超越個人一次性完成，進一步沉澱為可重複使用的流程、制度、工具、資料或組織能力。",
    observe: "看成果是否被他人採用、能否降低重工與風險、是否留下可追蹤的標準，以及離開本人後仍能持續運作。",
    examples: [
      "C1｜能依指示完成紀錄與交付；需要他人協助確認是否符合既有規範。",
      "C2｜能依既有 SOP 穩定完成工作並維持正確性。",
      "C3｜能發現流程問題並提出修正，降低自己或同仁的重複錯誤。",
      "C4｜建立可被團隊採用的 SOP、模板、控制點或自動化流程。",
      "C5｜把跨角色的零散做法整合成組織機制，並能持續追蹤採用與成效。",
      "C6｜建立可跨團隊複製的標準、平台或治理方式，降低長期依賴與營運風險。",
      "C7｜建立影響跨部門運作的公司級制度，並以數據持續調整成效。",
      "C8｜定義公司整體的運作原則與治理架構，使制度成為長期競爭能力。",
    ],
  },
  {
    code: "04",
    name: "人才賦能",
    en: "Multiplier",
    definition: "判斷同仁是否能透過教學、回饋、授權與方法傳承，讓其他人的能力提升，而不是所有成果都依賴自己完成。",
    observe: "看被協助者之後能否獨立完成、是否有清楚的教學與回饋紀錄，以及團隊整體能力是否因此提升。",
    examples: [
      "C1｜能接受指導並分享基礎資訊；尚需要主管協助完成知識傳遞。",
      "C2｜願意分享資訊並協助同仁完成單一任務。",
      "C3｜能示範做法、回答問題，協助同仁處理非例行情況。",
      "C4｜能有系統地帶領同仁完成一段工作，並給予具體回饋。",
      "C5｜能設計培養方式、授權與檢核節點，使他人可以獨立承接責任。",
      "C6｜能建立團隊人才梯隊與接班安排，讓多位成員持續提升並承擔更大範圍。",
      "C7｜建立跨團隊共用的人才標準、培養方法或接班機制。",
      "C8｜建立公司級領導與人才發展體系，持續擴大整體組織能力。",
    ],
  },
] as const;

function initials(name: string) {
  const en = name.match(/[A-Za-z]+/g)?.at(-1);
  return (en?.slice(0, 2) || name.slice(0, 1)).toUpperCase();
}

function CBadge({ value, ghost = false }: { value: number | null; ghost?: boolean }) {
  if (!value) return null;
  return <span className={`c-badge c${value} ${ghost ? "ghost" : ""}`}>C{value}</span>;
}

function MiniAxis({ guide, value }: { guide: (typeof axisGuides)[number]; value: number }) {
  return (
    <details className="mini-axis">
      <summary>
        <span>{guide.name}</span><strong>C{value}</strong>
        <i><b style={{ width: `${value * 12.5}%` }} /></i>
        <em>點擊查看判定說明</em>
      </summary>
      <div className="mini-axis-guide">
        <p><b>目前判定</b><span>C{value}｜{levelText[value]}</span></p>
        <p><b>判斷內容</b><span>{guide.definition}</span></p>
        <p><b>觀察重點</b><span>{guide.observe}</span></p>
        <div><b>C1～C8 完整標準</b><ul>{guide.examples.map((example) => <li key={example}>{example}</li>)}</ul></div>
      </div>
    </details>
  );
}

function AxisRadar({ values }: { values: number[] }) {
  const center = 90;
  const radius = 56;
  const point = (value: number, index: number) => {
    const angle = (-90 + index * 90) * Math.PI / 180;
    const distance = radius * (value / 8);
    return `${center + Math.cos(angle) * distance},${center + Math.sin(angle) * distance}`;
  };
  const grid = (level: number) => values.map((_, index) => point(level, index)).join(" ");
  const shape = values.map(point).join(" ");

  return <figure className="axis-radar-card" aria-label="四軸能力雷達圖">
    <svg viewBox="0 0 180 180" role="img">
      {[2, 4, 6, 8].map((level) => <polygon key={level} points={grid(level)} className="radar-grid" />)}
      {[0, 1, 2, 3].map((index) => <line key={index} x1={center} y1={center} x2={point(8, index).split(",")[0]} y2={point(8, index).split(",")[1]} className="radar-axis" />)}
      <polygon points={shape} className="radar-shape" />
      {values.map((value, index) => {
        const [cx, cy] = point(value, index).split(",");
        return <circle key={index} cx={cx} cy={cy} r="3.5" className="radar-point" />;
      })}
    </svg>
    <figcaption>{axisGuides.map((guide, index) => <span key={guide.code}><i>{guide.code}</i><b>{guide.name}</b><strong>C{values[index]}</strong></span>)}</figcaption>
  </figure>;
}

function managerInputC(person: Person): number | null {
  if (person.managerC) return person.managerC;
  const values = [...person.managerNote.matchAll(/C([1-8])/gi)].map((match) => Number(match[1])).sort((a, b) => b - a);
  if (!values.length) return null;
  return values.length > 1 ? values[1] : values[0];
}

function systemSuggestedC(person: Person) {
  const managerC = managerInputC(person);
  if (!managerC) return person.suggestedC;
  return Math.max(1, Math.min(8, Math.round((managerC + person.suggestedC) / 2)));
}

function recommendedQuadrant(person: Person): Quadrant {
  const highFutureValue = person.quadrant === "核心關鍵" || person.quadrant === "成長加速";
  const highContribution = systemSuggestedC(person) >= 5;
  if (highFutureValue) return highContribution ? "核心關鍵" : "成長加速";
  return highContribution ? "穩定戰力" : "角色聚焦";
}

function readableSegments(value: string) {
  return value
    // Keep internal SMB infrastructure out of the rendered page while preserving source data.
    .replace(
      /\\\\(?:\d{1,3}\.){3}\d{1,3}\\.*?(?=\s+(?:[a-z]\.|[1-9][.、．])|$)/gi,
      "【內部共享資料夾路徑已隱藏】",
    )
    .replace(/\r\n?/g, "\n")
    .replace(/\s*[—─]{6,}\s*/g, "\n")
    .replace(/([。！？!?])\s*/g, "$1\n")
    .replace(/\s+(?=(?:\d+[.、．]|[a-z][.、．])\s*)/gi, "\n")
    .replace(/\s+(?=(?:子軸[一二三四]|任務|行動|結果|背景|處理|結論|支持理由|期望支持|正向證據|結構化行為描述|待優化卡點|發展與引導建議|具體價值貢獻|協作特質觀察)[：:])/g, "\n")
    .split(/\n+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function VerbatimBullets({ value, empty = "" }: { value: string; empty?: string }) {
  const source = value || empty;
  const segments = readableSegments(source);
  const sourceWasTruncated = /…\s*$/.test(source);
  return <div className="verbatim-bullets">{segments.map((segment, index) => <p key={`${index}-${segment.slice(0, 18)}`}>{segment}</p>)}{sourceWasTruncated && <div className="source-truncation"><b>來源內容待補</b><span>此欄位在匯入網站前已以「…」結尾；畫面已完整顯示目前載入的文字，但缺少的原文需由原始盤點資料補回。</span></div>}</div>;
}

function QuadrantMatrix({
  members,
  selectedQuadrant,
  getQuadrant,
  onSelect,
  onPerson,
  onMove,
}: {
  members: readonly Person[];
  selectedQuadrant: string;
  getQuadrant: (person: Person) => Quadrant;
  onSelect: (quadrant: string) => void;
  onPerson: (person: Person) => void;
  onMove: (personId: number, quadrant: Quadrant) => void;
}) {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const cells = ["成長加速", "核心關鍵", "角色聚焦", "穩定戰力"] as const;
  return (
    <div className="matrix-wrap">
      <div className="matrix-y-label"><span>未來關鍵性</span><b>高</b><i>低</i></div>
      <div className="matrix-chart" aria-label="關鍵人才四象限圖">
        {cells.map((q) => {
          const peopleInCell = members.filter((person) => getQuadrant(person) === q);
          return (
            <section
              key={q}
              className={`matrix-cell ${quadrantMeta[q].color} ${q === "核心關鍵" ? "core-cell" : ""} ${selectedQuadrant === q ? "selected" : ""} ${draggedId ? "drop-ready" : ""}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const personId = Number(event.dataTransfer.getData("text/person-id"));
                if (personId) onMove(personId, q);
                setDraggedId(null);
              }}
            >
              <button className="matrix-cell-head" onClick={() => onSelect(selectedQuadrant === q ? "ALL" : q)}>
                <span>{quadrantMeta[q].en}</span>
                <strong>{q}</strong>
                <small>{quadrantMeta[q].note}</small>
                <b>{peopleInCell.length}</b>
              </button>
              <div className="matrix-people">
                {peopleInCell.map((person) => (
                  <button
                    key={person.id}
                    draggable
                    className={`${q === "核心關鍵" ? "core-person" : ""} ${draggedId === person.id ? "dragging" : ""}`}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/person-id", String(person.id));
                      event.dataTransfer.effectAllowed = "move";
                      setDraggedId(person.id);
                    }}
                    onDragEnd={() => setDraggedId(null)}
                    onClick={() => onPerson(person)}
                    title={`拖拉 ${person.name} 到其他象限，或點擊查看完整刊版`}
                  >
                    <i>{initials(person.name)}</i><span>{person.name}</span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <div className="matrix-x-label"><i>低</i><span>目前貢獻</span><b>高</b></div>
      <p className="matrix-hint">拖拉人員姓名到其他象限即可覆核定位；手機版可在個人刊版中調整。</p>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [group, setGroup] = useState<keyof typeof groupMeta>("ALL");
  const [query, setQuery] = useState("");
  const [quadrant, setQuadrant] = useState<string>("ALL");
  const [cFilter, setCFilter] = useState("ALL");
  const [sort, setSort] = useState("priority");
  const [selected, setSelected] = useState<Person | null>(null);
  const [showMethod, setShowMethod] = useState(false);
  const [quadrantOverrides, setQuadrantOverrides] = useState<Record<number, Quadrant>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("witsper-talent-quadrants") || "{}"); } catch { return {}; }
  });
  const [decisions, setDecisions] = useState<Record<number, Decision>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("witsper-talent-decisions") || "{}"); } catch { return {}; }
  });

  function saveDecision(id: number, patch: Decision) {
    setDecisions((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      localStorage.setItem("witsper-talent-decisions", JSON.stringify(next));
      return next;
    });
  }

  const quadrantOf = useCallback((person: Person): Quadrant => quadrantOverrides[person.id] ?? recommendedQuadrant(person), [quadrantOverrides]);

  function saveQuadrant(personId: number, nextQuadrant: Quadrant) {
    setQuadrantOverrides((previous) => {
      const next = { ...previous, [personId]: nextQuadrant };
      localStorage.setItem("witsper-talent-quadrants", JSON.stringify(next));
      return next;
    });
  }

  const scoped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = people.filter((p) => {
      const byView = view !== "managers" || p.isManager;
      const byGroup = group === "ALL" || p.group === group;
      const byQ = quadrant === "ALL" || quadrantOf(p) === quadrant;
      const effectiveC = systemSuggestedC(p);
      const byC = cFilter === "ALL" || effectiveC === Number(cFilter);
      const bySearch = !q || `${p.name} ${p.team} ${p.manager} ${p.strengths}`.toLowerCase().includes(q);
      return byView && byGroup && byQ && byC && bySearch;
    });
    return [...rows].sort((a, b) => {
      if (sort === "c-desc") return systemSuggestedC(b) - systemSuggestedC(a);
      if (sort === "name") return a.name.localeCompare(b.name, "zh-Hant");
      const rank = { 核心關鍵: 0, 成長加速: 1, 穩定戰力: 2, 角色聚焦: 3 } as Record<string, number>;
      return rank[quadrantOf(a)] - rank[quadrantOf(b)] || systemSuggestedC(b) - systemSuggestedC(a);
    });
  }, [view, group, query, quadrant, cFilter, sort, quadrantOf]);

  const basePeople = useMemo(() => people.filter(p => (group === "ALL" || p.group === group) && (view !== "managers" || p.isManager)), [group, view]);
  const avgC = basePeople.length ? (basePeople.reduce((s, p) => s + systemSuggestedC(p), 0) / basePeople.length).toFixed(1) : "—";
  const coreCount = basePeople.filter(p => quadrantOf(p) === "核心關鍵").length;
  const pendingCount = basePeople.filter(p => !managerInputC(p)).length;
  const highCount = basePeople.filter(p => systemSuggestedC(p) >= 5).length;
  const midCount = basePeople.filter(p => systemSuggestedC(p) >= 3 && systemSuggestedC(p) <= 4).length;
  const growthCount = basePeople.filter(p => systemSuggestedC(p) <= 2).length;
  const managerCount = basePeople.filter(p => p.isManager).length;

  function exportCSV() {
    const header = ["姓名","大隊","小隊","主管","主管C值","建議C值","決策C值","四象限","決策方向","決策備註"];
    const rows = scoped.map(p => [p.name,p.group,p.team,p.manager,managerInputC(p) ? `C${managerInputC(p)}` : "未填",`C${systemSuggestedC(p)}`,`C${decisions[p.id]?.c ?? systemSuggestedC(p)}`,quadrantOf(p),decisions[p.id]?.action || "未決",decisions[p.id]?.note || ""]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "人才貢獻校準決策.csv"; a.click(); URL.revokeObjectURL(a.href);
  }

  return (
    <main className="app-shell dashboard-shell">
      <header className="command-header">
        <div className="command-header-main">
          <div className="brand"><span className="brand-mark">W</span><div><strong>WitsPer 智選家</strong><small>人才貢獻對焦 · 決策儀表板</small></div></div>
          <nav className="primary-tabs" aria-label="主要導覽">
            <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}>總體</button>
            <button className={view === "groups" ? "active" : ""} onClick={() => setView("groups")}>三大隊</button>
            <button className={view === "managers" ? "active" : ""} onClick={() => setView("managers")}>主管職</button>
          </nav>
          <div className="top-actions"><button className="icon-btn" aria-label="方法說明" onClick={() => setShowMethod(true)}>?</button><button className="export-btn" onClick={exportCSV}>匯出決策表 <span>↗</span></button></div>
        </div>
        <div className="scope-strip">
          <div className="group-tabs" aria-label="大隊篩選">
            {(Object.keys(groupMeta) as (keyof typeof groupMeta)[]).filter(x => x !== "其他").map(code => (
              <button key={code} className={group === code ? "active" : ""} onClick={() => setGroup(code)}>
                <i className={`dot ${code.toLowerCase()}`} /><span>{code === "ALL" ? "全公司" : code}</span><small>{code === "ALL" ? people.length : people.filter(p => p.group === code).length}</small>
              </button>
            ))}
          </div>
          <div className="header-status"><span>2026 H1</span><b>{basePeople.length} 位</b><i>{pendingCount ? `${pendingCount} 位待補主管判定` : "主管判定已齊備"}</i></div>
        </div>
      </header>

      <section className="workspace">
        <div className="content">
          <section className="context-row">
            <div><span className="eyebrow">CURRENT DECISION SCOPE</span><h2>{groupMeta[group].name}</h2><p>Leader · {groupMeta[group].leader}　／　{view === "managers" ? "主管職視角" : view === "groups" ? "大隊結構視角" : "全體人才視角"}</p></div>
            <div className="period"><span>盤點期間</span><strong>2026.01.01 — 06.23</strong><i>資料已載入 · {people.length} 份</i></div>
          </section>

          <div className="source-banner"><b>已載入</b><p>人才盤點資料已匯入；系統綜合同仁自填內容與主管評價產出建議 C 值。四象限可人工拖拉覆核，所有決策只儲存在目前瀏覽器。</p></div>

          <section className="kpi-grid">
            <article className="kpi featured"><div><span>盤點範圍</span><strong>{basePeople.length}</strong><small>PEOPLE IN SCOPE</small></div><div className="ring" style={{ "--p": `${Math.min(100, basePeople.length / people.length * 100)}%` } as React.CSSProperties}><b>{Math.round(basePeople.length / people.length * 100)}%</b></div></article>
            <article className="kpi metric-cyan"><span>平均建議 C 值</span><strong>{avgC}</strong><small>主管評價 × 同仁內容</small></article>
            <article className="kpi metric-green"><span>高貢獻 C5–C8</span><strong>{highCount}</strong><small>核心關鍵 {coreCount} 位</small></article>
            <article className="kpi metric-blue"><span>中階 C3–C4</span><strong>{midCount}</strong><small>穩定貢獻 · 發展下一級</small></article>
            <article className="kpi metric-amber"><span>成長中 C1–C2</span><strong>{growthCount}</strong><small>明確期待 · 縮短學習曲線</small></article>
            <article className={`kpi ${pendingCount ? "warning" : ""}`}><span>帶人主管／待補</span><strong>{managerCount}<em>／{pendingCount}</em></strong><small>主管職人數／待補主管判定</small><button onClick={() => { setView("managers"); setCFilter("ALL"); setQuadrant("ALL"); }}>查看主管 →</button></article>
          </section>

          {view !== "managers" && <Organization group={group} onGroup={setGroup} />}

          <section className="quadrant-section">
            <div className="section-head"><div><span className="eyebrow">TALENT MATRIX</span><h3>關鍵人才四象限</h3></div><div className="axis-legend"><span><i className="x"/>目前貢獻</span><span><i className="y"/>未來關鍵性</span></div></div>
            <QuadrantMatrix members={basePeople} selectedQuadrant={quadrant} getQuadrant={quadrantOf} onSelect={setQuadrant} onPerson={setSelected} onMove={saveQuadrant} />
          </section>

          <section className="talent-section">
            <div className="section-head talent-title"><div><span className="eyebrow">DECISION QUEUE</span><h3>{view === "managers" ? "主管職校準名單" : "人才決策清單"}</h3></div><span className="result-count">{scoped.length} 位符合條件</span></div>
            <div className="filterbar">
              <label className="search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜尋姓名、隊別、能力…" /></label>
              <select value={cFilter} onChange={e => setCFilter(e.target.value)} aria-label="C值篩選"><option value="ALL">所有 C 值</option>{[1,2,3,4,5,6,7,8].map(x => <option key={x} value={x}>C{x}</option>)}</select>
              <select value={quadrant} onChange={e => setQuadrant(e.target.value)} aria-label="象限篩選"><option value="ALL">所有象限</option>{Object.keys(quadrantMeta).map(x => <option key={x}>{x}</option>)}</select>
              <select value={sort} onChange={e => setSort(e.target.value)} aria-label="排序"><option value="priority">決策優先度</option><option value="c-desc">C 值由高至低</option><option value="name">姓名</option></select>
              <button className="clear" onClick={() => { setQuery(""); setCFilter("ALL"); setQuadrant("ALL"); }}>重設</button>
            </div>

            <div className="talent-table" role="table" aria-label="人才決策清單">
              <div className="tr th" role="row"><span>人才／職務</span><span>主管評價</span><span>系統建議</span><span>關鍵人才定位</span><span>老闆決策</span><span /></div>
              {scoped.map(p => {
                const d = decisions[p.id] || {}; const effectiveC = systemSuggestedC(p); const personQuadrant = quadrantOf(p); const managerC = managerInputC(p);
                return <button className="tr" role="row" key={p.id} onClick={() => setSelected(p)}>
                  <span className="person-cell"><i className={`person-avatar ${p.group.toLowerCase()}`}>{initials(p.name)}</i><b>{p.name}<small>{p.group} · {p.team}　主管 {p.manager}</small></b>{p.isManager && <em>主管</em>}</span>
                  <span className="c-cell">{managerC && <><CBadge value={managerC}/><small>{p.managerC ? "主管已填" : "主管文字判讀"}</small></>}</span>
                  <span className="c-cell"><CBadge value={effectiveC}/><small>綜合主管與自評內容</small></span>
                  <span className="quad-cell"><i className={`quad-dot ${quadrantMeta[personQuadrant].color}`}/><b>{personQuadrant}<small>{quadrantMeta[personQuadrant].note}</small></b></span>
                  <span className="decision-cell">{d.action ? <b className="decided">{d.action}</b> : <i>待決策</i>}</span>
                  <span className="arrow">→</span>
                </button>;
              })}
              {!scoped.length && <div className="empty">沒有符合目前篩選條件的人才。</div>}
            </div>
          </section>
        </div>
      </section>

      {selected && <PersonDrawer person={selected} decision={decisions[selected.id] || {}} quadrant={quadrantOf(selected)} onQuadrantChange={(next) => saveQuadrant(selected.id, next)} onSave={(patch) => saveDecision(selected.id, patch)} onClose={() => setSelected(null)} />}
      {showMethod && <MethodModal onClose={() => setShowMethod(false)} />}
    </main>
  );
}

function Organization({ group, onGroup }: { group: keyof typeof groupMeta; onGroup: (g: keyof typeof groupMeta) => void }) {
  const groups = group === "ALL" ? (["PVG","UVG","BEO"] as const) : (group in org ? [group as keyof typeof org] : []);
  return <section className="org-section"><div className="section-head"><div><span className="eyebrow">ORGANIZATION VIEW</span><h3>三大隊與主管配置</h3></div><p>部門名稱旁顯示組織圖主管</p></div><div className="org-grid">
    {groups.map(code => <button key={code} className="org-card" onClick={() => onGroup(code)}><div className="org-top"><span>{code}</span><b>{org[code].name}</b><i>大隊長 · {org[code].leader}</i></div><div className="teams">{org[code].teams.map(t => <span key={t.code}><b>{t.code}</b><small>{t.leader}</small></span>)}</div></button>)}
  </div></section>;
}

function PersonDrawer({ person: p, decision, quadrant, onQuadrantChange, onSave, onClose }: { person: Person; decision: Decision; quadrant: Quadrant; onQuadrantChange: (quadrant: Quadrant) => void; onSave: (d: Decision) => void; onClose: () => void }) {
  const managerC = managerInputC(p);
  const systemC = systemSuggestedC(p);
  const effectiveC = decision.c ?? systemC;
  const resourceFields = p.resources.map((resource, index) => {
    const label = resource.startsWith("決策／資源：")
      ? "延伸整理：決策／資源（取自希望得到的支持）"
      : resource.startsWith("發展任務：")
        ? "延伸整理：發展任務（取自未來希望承接）"
        : resource.startsWith("建議：")
          ? "系統發展建議（依四軸判定產生）"
          : `其他延伸內容 ${String(index + 1).padStart(2, "0")}`;
    return [label, resource] as const;
  });
  const originalFields = [
    ["主管文字說明（原文）", p.managerNote],
    ["原始內容判定理由（保留原文）", p.reason],
    ["原始校準狀態", p.calibration],
    ["主要成果", p.results],
    ["數據／文件佐證", p.evidence],
    ["代表案例", p.case],
    ["阻礙與風險", p.blocker],
    ["希望得到的支持", p.support],
    ["能力／強項", p.strengths],
    ["未來希望承接", p.next],
    ...resourceFields,
  ] as const;
  return <div className="overlay detail-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}><aside className="drawer" aria-modal="true" role="dialog" aria-label={`${p.name} 完整人才刊版`}>
    <button className="close" onClick={onClose} aria-label="關閉">×</button>
    <div className="drawer-hero"><div className="drawer-person"><i className={`person-avatar xl ${p.group.toLowerCase()}`}>{initials(p.name)}</i><div><span>{p.group} · {p.team}　／　主管 {p.manager}</span><h2>{p.name}</h2><p>{p.isManager ? "主管職 · " : ""}{p.strengths || "能力資料待補"}</p></div></div><div className="drawer-score"><span>系統建議 C 值</span><strong>C{systemC}</strong><small>{levelText[systemC]}</small></div></div>
    <div className="drawer-body">
      <section className="callout system-judgement"><div><span>COMBINED JUDGEMENT</span><h3>系統綜合建議</h3><p className="judgement-intro">系統同時參考主管 C 值／文字評價與同仁自填內容，再產出建議 C 值；若主管資料皆未提供，才先以同仁內容判定並標示待補。</p></div><div className="system-score-flow"><article><span>主管評價</span><strong>{managerC ? `C${managerC}` : "待補"}</strong><small>{p.managerC ? "主管已填" : managerC ? "由主管文字判讀" : "尚無資料"}</small></article><b>＋</b><article><span>同仁內容判定</span><strong>C{p.suggestedC}</strong><small>依自填成果與四軸</small></article><b>→</b><article className="system-result"><span>系統建議</span><strong>C{systemC}</strong><small>綜合兩項輸入</small></article></div><div className="judgement-sources"><section><h4>主管評價依據</h4><VerbatimBullets value={p.managerNote || ""} empty="主管尚未提供文字評價。" /></section><section><h4>同仁自填內容依據</h4><VerbatimBullets value={p.results || ""} empty="同仁尚未提供成果內容。" /></section></div></section>
      <section><div className="drawer-section-title"><span>01</span><div><h3>同仁內容四軸判定</h3><p>此區為系統綜合判斷的其中一項輸入；點擊每個子軸即可查看判斷內容、觀察重點與 C1～C8 完整標準</p></div></div><div className="axis-method-summary"><b>系統怎麼判定？</b><p>系統讀取同仁填寫的主要成果、佐證、代表案例、阻礙、希望支持與未來承接內容，將四個子軸分開比對 C1～C8 行為標準；不因單一亮點直接拉高全部子軸。完成四軸評分後，取第二高值作為「同仁內容判定」，再與主管 C 值及主管文字評價合併產出系統建議。</p></div><div className="axis-overview"><AxisRadar values={[p.axes.thinking, p.axes.influence, p.axes.institution, p.axes.multiplier]} /><div className="axis-grid"><MiniAxis guide={axisGuides[0]} value={p.axes.thinking}/><MiniAxis guide={axisGuides[1]} value={p.axes.influence}/><MiniAxis guide={axisGuides[2]} value={p.axes.institution}/><MiniAxis guide={axisGuides[3]} value={p.axes.multiplier}/></div></div><details className="axis-evidence"><summary>查看本次四軸判定依據</summary><VerbatimBullets value={p.reason || ""} empty="目前沒有可顯示的判定依據。" /></details></section>
      <section className="talent-position-section">
        <div className="drawer-section-title"><span>02</span><div><h3>關鍵人才定位</h3><p>先依系統建議判定目前貢獻，再由人工拖拉或選單覆核</p></div></div>
        <div className={`position-card ${quadrantMeta[quadrant].color}`}>
          <div className="position-summary"><span>{quadrantMeta[quadrant].en}</span><h3>{quadrant}</h3><p>{quadrantMeta[quadrant].note}</p></div>
          <b>{quadrant === "核心關鍵" ? "優先留任與擴大責任" : quadrant === "成長加速" ? "給任務、資源與明確里程碑" : quadrant === "穩定戰力" ? "深化專業並降低單點依賴" : "先釐清角色與基本期待"}</b>
        </div>
        <label className="quadrant-adjust">人工覆核定位<select value={quadrant} onChange={(event) => onQuadrantChange(event.target.value as Quadrant)}>{(Object.keys(quadrantMeta) as Quadrant[]).map((name) => <option key={name} value={name}>{name}｜{quadrantMeta[name].note}</option>)}</select></label>
      </section>
      <section className="original-content"><div className="drawer-section-title"><span>03</span><div><h3>全部原始內容</h3><p>每個欄位逐項顯示；保留全部已載入文字，內部共享路徑會在畫面上安全遮蔽</p></div></div><div className="resource-source-note"><b>延伸欄位來源說明</b><p>「決策／資源」取自同仁填寫的「希望得到的支持」；「發展任務」取自「未來希望承接」；「系統發展建議」由四軸判定產生。三者皆已明確標示，不再使用無法辨識來源的「資源／發展內容 01／02／03」。</p></div><div className="original-table-head" aria-hidden="true"><span>欄位與來源</span><span>安全顯示內容</span></div><ul className="original-list">{originalFields.map(([label, value]) => <li key={label}><h4>{label}</h4><VerbatimBullets value={value || ""} /></li>)}</ul></section>
      <section className="decision-panel"><div className="drawer-section-title"><span>04</span><div><h3>老闆決策</h3><p>內容會保存在目前裝置，可匯出決策表</p></div></div><div className="decision-form"><label>最終 C 值<select value={effectiveC} onChange={e => onSave({ c: Number(e.target.value) })}>{[1,2,3,4,5,6,7,8].map(x => <option key={x} value={x}>C{x} · {levelText[x]}</option>)}</select></label><label>人才動作<select value={decision.action || ""} onChange={e => onSave({ action: e.target.value })}><option value="">待決策</option><option>優先升級／加薪</option><option>留任與擴大責任</option><option>加速培養</option><option>維持現職深化</option><option>角色重新對焦</option><option>補充佐證後再議</option></select></label><label className="full">決策備註<textarea value={decision.note || ""} onChange={e => onSave({ note: e.target.value })} placeholder="記錄判斷脈絡、需要補的證據或下一步…" /></label></div><button className="save" onClick={onClose}>完成並返回名單</button></section>
    </div>
  </aside></div>;
}

function MethodModal({ onClose }: { onClose: () => void }) {
  return <div className="overlay centered" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="method-modal axis-guide-modal"><button className="close" onClick={onClose} aria-label="關閉">×</button><span className="eyebrow">FOUR CAPABILITY AXES</span><h2>四大子軸判斷邏輯</h2><p>四個子軸必須分開判斷，不因單一亮點直接給整體高 C 值。請點開各子軸，依「定義、觀察重點與 C1～C8 完整分級」判斷同仁自填內容的等級；完成後取四軸次高值，再與主管 C 值及文字評價一起產出系統建議。</p><div className="axis-guide-list">{axisGuides.map((axis, index) => <details key={axis.name} open={index === 0}><summary><b>{axis.code}</b><span><strong>{axis.name}</strong><small>{axis.en}｜C1～C8</small></span><i>＋</i></summary><div className="axis-guide-content"><section><h3>判斷內容</h3><p>{axis.definition}</p></section><section><h3>觀察重點</h3><p>{axis.observe}</p></section><section><h3>C1～C8 完整分級</h3><ul>{axis.examples.map(example => <li key={example}>{example}</li>)}</ul></section></div></details>)}</div><div className="method-rule"><strong>最後判定規則</strong><span>同仁內容四軸獨立給值 → 取第二高值作為內容判定 → 合併主管 C 值／文字評價 → 產出系統建議 → 依系統建議定位四象限 → 校準會議或人工拖拉覆核</span></div><button className="save" onClick={onClose}>完成查找，回到決策中心</button></section></div>;
}
