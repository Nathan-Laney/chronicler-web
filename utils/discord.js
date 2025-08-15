// utils/discord.js
const USER_CACHE_TTL_MS = 60 * 60 * 1000;     // 1h
const CH_CACHE_TTL_MS   = 6 * 60 * 60 * 1000; // 6h
const userCache = new Map(); // key: `${guildId}:${userId}` -> { name, exp }
const chanCache = new Map(); // key: channelId -> { name, exp }

function setTTL(map, key, val, ttl) { map.set(key, { val, exp: Date.now() + ttl }); }
function getTTL(map, key) {
  const item = map.get(key);
  if (!item) return null;
  if (Date.now() > item.exp) { map.delete(key); return null; }
  return item.val;
}

// --- USER display names (you already had something like this) ---
async function fetchMemberName(guildId, userId) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return userId;
  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
    headers: { Authorization: `Bot ${token}` }
  });
  if (!res.ok) return userId;
  const m = await res.json();
  return m.nick || (m.user && (m.user.global_name || m.user.username)) || userId;
}

async function getDisplayName(guildId, userId) {
  const key = `${guildId}:${userId}`;
  const cached = getTTL(userCache, key);
  if (cached) return cached;
  const name = await fetchMemberName(guildId, userId);
  setTTL(userCache, key, name, USER_CACHE_TTL_MS);
  return name;
}

async function mapDisplayNames(guildId, userIds) {
  const uniq = Array.from(new Set(userIds || []));
  const entries = await Promise.all(uniq.map(async (uid) => [uid, await getDisplayName(guildId, uid)]));
  return Object.fromEntries(entries);
}

// --- CHANNEL names + mention replacement ---
const CHANNEL_MENTION = /<#(\d{5,})>/g;

async function fetchChannelName(channelId) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return { name: channelId, ok: false };
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
    headers: { Authorization: `Bot ${token}` }
  });
  if (!res.ok) return { name: channelId, ok: false };
  const ch = await res.json();
  return { name: ch.name ? `#${ch.name}` : channelId, ok: true };
}

async function getChannelName(channelId) {
  const cached = getTTL(chanCache, channelId);
  if (cached) return cached;
  const { name } = await fetchChannelName(channelId);
  setTTL(chanCache, channelId, name, CH_CACHE_TTL_MS);
  return name;
}

/**
 * Resolve all <#channelId> mentions in text.
 * Returns:
 *  - display: string (mentions replaced with "#channel-name")
 *  - channels: array of { id, name, url }
 */
async function resolveChannelMentions(guildId, text) {
  if (!text) return { display: text, channels: [] };

  const ids = [];
  text.replace(CHANNEL_MENTION, (_, id) => { ids.push(id); return _; });
  const uniq = Array.from(new Set(ids));
  const names = await Promise.all(uniq.map(getChannelName));

  // Map id -> '#name'
  const map = Object.fromEntries(uniq.map((id, i) => [id, names[i]]));

  let display = text;
  for (const [id, name] of Object.entries(map)) {
    display = display.replaceAll(`<#${id}>`, name);
  }

  const channels = uniq.map(id => ({
    id,
    name: map[id],
    url: `https://discord.com/channels/${guildId}/${id}`
  }));

  return { display, channels };
}

module.exports = {
  getDisplayName,
  mapDisplayNames,
  resolveChannelMentions
};
