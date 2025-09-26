# 다산콜센터 민원 분야 추천 웹앱

## 개요
- 키워드(예: `주차`)를 입력하면 Supabase DB에서 `질문내용` LIKE 검색
- `민원분야`별 빈도를 집계해 최빈값을 **추천 분야**로 표시
- 로딩 인디케이터(스피너) 포함

## 배포 방법(정적 호스팅 예: Netlify, Vercel, GitHub Pages)
1. 이 폴더를 레포로 푸시
2. 환경변수(SUPABASE URL, anon key)를 클라이언트에 주입
   - 간단히라면 `script.js` 상단의 상수를 프로젝트 값으로 교체
   - 또는 HTML에 다음 스니펫 추가:
     ```html
     <script>
       window.SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
       window.SUPABASE_ANON_KEY = "YOUR-ANON-KEY";
     </script>
     ```
3. 배포 후 접속 URL을 제출

## Supabase 테이블 생성
1. Supabase 대시보드 > SQL Editor > 다음 DDL 실행
```sql
create table if not exists public.dasan_cases (
  id bigserial primary key,
  "질문내용" text not null,
  "민원분야" text not null
);
-- (옵션) 검색 성능
create index if not exists dasan_cases_q_idx on public.dasan_cases using gin (to_tsvector('simple', "질문내용"));
create index if not exists dasan_cases_cat_idx on public.dasan_cases("민원분야");
```

## 엑셀 업로드(두 가지 방법)
### 방법 A. CSV로 내보내 Table Editor로 Import
1. `다산콜센터_민원상담_내역.xlsx`를 열어 `질문내용`, `민원분야` 두 컬럼만 남기고 CSV로 저장
2. Supabase > Table Editor > `dasan_cases` 선택 > `Import data`
3. CSV 업로드 시 첫 행을 헤더로 인식하도록 선택하고, 컬럼 매핑 확인
4. 업로드 완료

### 방법 B. 파이썬 스크립트로 업서트
- 로컬 또는 Colab에서 아래 스크립트 실행
```python
!pip install supabase==2.* pandas openpyxl
import pandas as pd
from supabase import create_client, Client

SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "YOUR-SERVICE-ROLE-KEY"  # 서버 전용. 클라이언트에 노출 금지

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

df = pd.read_excel("다산콜센터_민원상담_내역.xlsx")
# 컬럼 자동 탐색
col_q = next((c for c in df.columns if ("질문" in c and "내용" in c)), df.columns[0])
col_y = next((c for c in df.columns if ("민원" in c and ("분야" in c or "유형" in c or "카테고리" in c))), df.columns[1])

tmp = df[[col_q, col_y]].rename(columns={col_q:"질문내용", col_y:"민원분야"})
tmp = tmp.dropna().query('질문내용 != "" and 민원분야 != ""')

# 대량 업로드(배치)
rows = tmp.to_dict(orient="records")
batch = 1000
for i in range(0, len(rows), batch):
    chunk = rows[i:i+batch]
    supabase.table("dasan_cases").upsert(chunk).execute()
print("done")
```

## 권한(정책, RLS)
- 기본 RLS(On) 상태에서 다음 정책을 추가해 **익명 읽기** 허용
```sql
alter table public.dasan_cases enable row level security;

create policy "anon can read dasan_cases"
on public.dasan_cases
for select
to anon
using (true);
```
- 쓰기(upsert)는 서버에서만 수행(서비스 키)

## 질의 방식
프론트엔드에서는 PostgREST의 집계/그룹바이를 사용:
```js
const { data, error } = await supabase
  .from('dasan_cases')
  .select('민원분야, count:민원분야', { head: false })
  .ilike('질문내용', `%${kw}%`)
  .group('민원분야')
  .order('count', { ascending: false });
```

## 로컬 미리보기
- 단순 정적 서버로 열기
```bash
python -m http.server 5500
# http://localhost:5500 접속
```

## 제출물 안내
- 공개 URL: 배포 후 URL을 `submission_url.txt`에 기록
- 소스코드: 이 폴더를 ZIP으로 압축해 제출
