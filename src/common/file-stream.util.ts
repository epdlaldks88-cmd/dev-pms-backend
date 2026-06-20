import { Response } from 'express';
import * as fs from 'fs';

/**
 * 업로드 파일을 인증된 응답으로 스트리밍한다.
 * - image/svg+xml은 인라인 렌더링 시 저장형 XSS 위험이 있어 강제 다운로드 처리
 * - 그 외 이미지·PDF만 인라인(미리보기) 허용, 나머지는 다운로드
 */
export function streamFileToResponse(
  res: Response,
  filePath: string,
  mimetype: string,
  originalName: string,
) {
  const inlineOk =
    (mimetype.startsWith('image/') && mimetype !== 'image/svg+xml') ||
    mimetype === 'application/pdf';
  const encoded = encodeURIComponent(originalName);

  res.setHeader('Content-Type', mimetype || 'application/octet-stream');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader(
    'Content-Disposition',
    `${inlineOk ? 'inline' : 'attachment'}; filename*=UTF-8''${encoded}`,
  );

  fs.createReadStream(filePath).pipe(res);
}
