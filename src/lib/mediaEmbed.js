const IMAGE_EXT_RE = /\.(avif|bmp|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i;
const VIDEO_EXT_RE = /\.(mp4|webm|ogg|mov|m4v)(?:[?#].*)?$/i;

export function getMediaKind(href = '') {
  if (IMAGE_EXT_RE.test(href)) return 'image';
  if (VIDEO_EXT_RE.test(href)) return 'video';
  return null;
}

export function toAbsoluteHref(href = '') {
  try {
    return new URL(href, window.location.href).toString();
  } catch (_) {
    return href;
  }
}

export function buildMediaDocument(href, kind) {
  const escaped = href.replace(/"/g, '&quot;');
  const mediaTag =
    kind === 'video'
      ? `<video src="${escaped}" autoplay muted loop playsinline controls></video>`
      : `<img src="${escaped}" alt="" />`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #000;
      }
      body {
        display: grid;
        place-items: center;
      }
      img, video {
        width: 100vw;
        height: 100vh;
        object-fit: cover;
        display: block;
      }
    </style>
  </head>
  <body>${mediaTag}</body>
</html>`;
}

export function buildEmbedSrc(href = '') {
  if (!href) return href;
  const kind = getMediaKind(href);
  if (!kind) return href;

  const absoluteHref = toAbsoluteHref(href);
  const html = buildMediaDocument(absoluteHref, kind);
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}
