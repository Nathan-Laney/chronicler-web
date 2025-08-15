// Simple TTL cache for user display names
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const cache = new Map(); // key: `${guildId}:${userId}` -> { name, exp }

function setCachedName(guildId, userId, name) {
  cache.set(`${guildId}:${userId}`, { name, exp: Date.now() + CACHE_TTL_MS });
}

function getCachedName(guildId, userId) {
  const item = cache.get(`${guildId}:${userId}`);
  if (!item) return null;
  if (Date.now() > item.exp) { cache.delete(`${guildId}:${userId}`); return null; }
  return item.name;
}

// Uses the Bot token to fetch a guild member
async function fetchMemberName(guildId, userId) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return userId; // fallback if not configured

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
      headers: { Authorization: `Bot ${token}` }
    });
    if (res.status === 404) return userId; // not found in guild
    if (!res.ok) return userId; // rate limit or other error; fallback

    const m = await res.json();
    // Prefer: server nick -> global display name -> username -> ID
    const name = m.nick || (m.user && (m.user.global_name || m.user.username)) || userId;
    return name;
  } catch {
    return userId;
  }
}

async function getDisplayName(guildId, userId) {
  const cached = getCachedName(guildId, userId);
  if (cached) return cached;

  const name = await fetchMemberName(guildId, userId);
  setCachedName(guildId, userId, name);
  return name;
}

async function mapDisplayNames(guildId, userIds) {
  const uniq = Array.from(new Set(userIds || []));
  const entries = await Promise.all(uniq.map(async (uid) => [uid, await getDisplayName(guildId, uid)]));
  return Object.fromEntries(entries);
}

module.exports = { getDisplayName, mapDisplayNames };
