export async function loadJson(path) { const response = await fetch(path); if (!response.ok) throw new Error(`${path} (${response.status})`); return response.json(); }
export function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
