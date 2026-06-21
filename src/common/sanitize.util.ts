// 평문 콘텐츠(채팅 등)에서 HTML 태그를 제거하는 최소 안전망.
// 출력 인코딩(렌더 시점, 소비자 책임)을 대체하진 않지만, 외부 앱이 raw HTML로
// 렌더해도 스크립트가 실행되지 않도록 저장 단계에서 태그를 걷어낸다.
// '<' 뒤에 영문자가 오는 실제 태그만 매칭 → 'a < b', '3<5' 같은 일반 텍스트는 보존.
const TAG_RE = /<\/?[a-z][\s\S]*?>/gi;

export function stripHtmlTags(input: string): string {
  if (!input) return input;
  let out = input;
  let prev: string;
  // 중첩 우회(예: <scr<script>ipt>) 방지를 위해 변화가 없을 때까지 반복 제거
  do {
    prev = out;
    out = out.replace(TAG_RE, '');
  } while (out !== prev);
  return out;
}
