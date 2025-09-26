// 환경변수(클라이언트): 공개 가능한 anon 키 사용
// 배포 전 아래 두 값을 실제 프로젝트 값으로 교체
const SUPABASE_URL = window.SUPABASE_URL || (import.meta?.env?.VITE_SUPABASE_URL) || "https://glculvahppprsyzfctya.supabase.co";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || (import.meta?.env?.VITE_SUPABASE_ANON_KEY) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsY3VsdmFocHBwcnN5emZjdHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxODAxMTAsImV4cCI6MjA3Mzc1NjExMH0.KEZD6PblJWEy0YXOHD5zujzrpjbW3S98f5VgNWVHVzE";

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const btn = document.getElementById('btn');
const kwEl = document.getElementById('kw');
const spinner = document.getElementById('spinner');
const resultEl = document.getElementById('result');
const listEl = document.getElementById('list');

function showSpinner(v) {
  spinner.classList.toggle('hidden', !v);
}

function renderList(items) {
  if (!items || !items.length) { listEl.innerHTML = ""; return; }
  const html = items.slice(0, 10).map(r => `<li>${r.민원분야} <small>(빈도 ${r.cnt})</small></li>`).join("");
  listEl.innerHTML = `<ol>${html}</ol>`;
}

btn.addEventListener('click', async () => {
  const kw = (kwEl.value || "").trim();
  resultEl.textContent = "";
  renderList([]);
  if (!kw) { alert("키워드를 입력하세요."); return; }

  showSpinner(true);
  try {
    // 전략 A: 서버 집계 사용 (PostgREST 그룹바이)
    // 테이블 이름: dasan_cases (스키마 동일)
    // select=민원분야,count:민원분야 -> group=민원분야
    const { data, error } = await _supabase
      .from('dasan_cases')
      .select('민원분야, count:민원분야', { head: false })
      .ilike('질문내용', `%${kw}%`)
      .group('민원분야')
      .order('count', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      resultEl.textContent = `추천 분야: 결과 없음`;
      showSpinner(false);
      return;
    }

    // 상위 1개 추천
    const top = data[0];
    resultEl.textContent = `추천 분야: ${top.민원분야}`;
    renderList(data.map(d => ({ 민원분야: d.민원분야, cnt: d.count })));

  } catch (e) {
    console.error(e);
    resultEl.textContent = "오류가 발생했습니다. 콘솔을 확인하세요.";
  } finally {
    showSpinner(false);
  }
});

// Enter key
kwEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });
