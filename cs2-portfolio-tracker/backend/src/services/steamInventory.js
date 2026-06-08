const CS2_APP_ID = 730;
const INVENTORY_CONTEXT_ID = 2;

/**
 * Fetches a public Steam inventory (no API key required - this is the same
 * public endpoint steamcommunity.com/profiles/<id>/inventory uses) and
 * returns a flat list of items merged with their descriptions, including the
 * "inspect in game" link needed for float lookups.
 *
 * The profile's inventory privacy must be set to public for this to work.
 */
export async function fetchSteamInventory(steamId, { fetchImpl = fetch } = {}) {
  if (!steamId) throw new Error('STEAM_ID is not configured');

  const url = `https://steamcommunity.com/inventory/${steamId}/${CS2_APP_ID}/${INVENTORY_CONTEXT_ID}?l=english&count=2000`;
  const response = await fetchImpl(url, { headers: { Accept: 'application/json' } });

  if (response.status === 403) {
    throw new Error('Steam inventory is private - set it to public to enable syncing');
  }
  if (!response.ok) {
    throw new Error(`Steam inventory request failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data?.assets || !data?.descriptions) return [];

  const descriptionByKey = new Map(
    data.descriptions.map((d) => [`${d.classid}_${d.instanceid ?? '0'}`, d])
  );

  return data.assets.map((asset) => {
    const description = descriptionByKey.get(`${asset.classid}_${asset.instanceid ?? '0'}`);
    const inspectAction = description?.actions?.find((a) => a.link?.includes('+csgo_econ_action_preview'));
    const inspectLink = inspectAction?.link
      ?.replace('%owner_steamid%', steamId)
      ?.replace('%assetid%', asset.assetid);

    return {
      assetId: asset.assetid,
      marketHashName: description?.market_hash_name ?? null,
      name: description?.name ?? null,
      iconUrl: description?.icon_url
        ? `https://community.akamai.steamstatic.com/economy/image/${description.icon_url}`
        : null,
      tradable: description?.tradable === 1,
      marketable: description?.marketable === 1,
      inspectLink: inspectLink ?? null,
    };
  });
}
