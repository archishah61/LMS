export const base64ToFile = (
  base64Data,
  filename = `AI_Generated_${Date.now()}`,
  defaultMimeType = 'application/octet-stream'
) => {
  let mimeType = defaultMimeType;
  let base64String = base64Data;

  // If base64Data contains data URI scheme, extract mime type and data
  const matches = base64Data.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.*)$/);
  if (matches) {
    mimeType = matches[1];
    base64String = matches[2];
  }

  const byteString = atob(base64String);
  const byteArray = new Uint8Array(byteString.length);

  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }

  // Add appropriate extension if missing
  const extensionMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'video/mp4': 'mp4',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'text/plain': 'txt',
    'application/json': 'json',
  };

  const ext = extensionMap[mimeType];
  const finalFilename = filename.includes('.') || !ext ? filename : `${filename}.${ext}`;

  return new File([byteArray], finalFilename, {
    type: mimeType,
    lastModified: Date.now(),
  });
};
