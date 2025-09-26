const SUPABASE_URL = "https://glculvahppprsyzfctya.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsY3VsdmFocHBwcnN5emZjdHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxODAxMTAsImV4cCI6MjA3Mzc1NjExMH0.KEZD6PblJWEy0YXOHD5zujzrpjbW3S98f5VgNWVHVzE";

const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM ---
const btn = document.getElementById("btn");
const kwEl = document.getElementById("kw");
const spinner = document.getElementById("spinner");
const resultEl = document.getElementById("result");
const listEl = document.getElementById("list");

function showSpinner(on) {
  spinner.classList.toggle("hidden", !on);
}
function renderList(pairs) {
  if (!pairs?.length) { listEl.innerHTML = ""; return; }
  const html = pairs.slice(0, 10).map(([k, v]) => `<li>${k} <small>(빈도 ${v})</small></li>`).join("");
  listEl.innerHTML = `<ol>${html}</ol>`;
}

async function runSearch() {
  const kw = (kwEl.value || "").trim();
  resultEl.textContent = "";
  renderList([]);
  if (!kw) { alert("키워드를 입력하세요."); return; }

  showSpinner(true);
  try {
    // 서버 집계 .group() 없음 → 클라이언트에서 그룹핑
    const { data, error } = await supa
      .from("dasan_cases")
      .select("민원분야, 질문내용")     // 필요한 컬럼만
      .ilike("질문내용", `%${kw}%`);   // 대소문자 무시 부분일치

    if (error) throw error;
    if (!data || data.length === 0) {
      resultEl.textContent = "추천 분야: 결과 없음";
      return;
    }

    // 그룹핑 및 정렬
    const counts = data.reduce((acc, r) => {
      const k = r["민원분야"];
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const [topField] = sorted[0];

    resultEl.textContent = `추천 분야: ${topField}`;
    renderList(sorted);
  } catch (e) {
    console.error(e);
    resultEl.textContent = "오류가 발생했습니다. 콘솔을 확인하세요.";
  } finally {
    showSpinner(false);
  }
}

btn.addEventListener("click", runSearch);
kwEl.addEventListener("keydown", (e) => { if (e.key === "Enter") runSearch(); });
