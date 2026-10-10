const AIC_API = "https://api.artic.edu/api/v1";
const MET_API = "https://collectionapi.metmuseum.org/public/collection/v1.1";
const PAGE_SIZE = 12;

function ensureOk(response) {
  if (!response.ok) throw new Error(`Museum service returned ${response.status}`);
  return response.json();
}

export async function searchAic(query, page, signal) {
  const params = new URLSearchParams({
    q: query,
    limit: String(PAGE_SIZE),
    page: String(page + 1),
    fields: "id,title,artist_display,date_display,medium_display,image_id,is_public_domain,artwork_type_title,place_of_origin,api_link",
  });
  const payload = await fetch(`${AIC_API}/artworks/search?${params}`, { signal }).then(ensureOk);
  const iiifBase = payload.config?.iiif_url ?? "https://www.artic.edu/iiif/2";
  return {
    total: payload.pagination?.total ?? 0,
    hasMore: (payload.pagination?.current_page ?? page + 1) < (payload.pagination?.total_pages ?? 0),
    artworks: (payload.data ?? []).map((item) => ({
      id: `aic-${item.id}`,
      museum: "Art Institute of Chicago",
      title: item.title || "Untitled",
      artist: item.artist_display || "Artist unknown",
      date: item.date_display || "Date unknown",
      medium: item.medium_display || "",
      image: item.image_id ? `${iiifBase}/${encodeURIComponent(item.image_id)}/full/843,/0/default.jpg` : "",
      record: item.api_link || `https://www.artic.edu/artworks/${item.id}`,
      publicDomain: Boolean(item.is_public_domain),
      department: item.artwork_type_title || item.place_of_origin || "",
    })),
  };
}

async function mapLimit(items, limit, mapper) {
  const output = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      try { output[index] = await mapper(items[index]); } catch { output[index] = null; }
    }
  }));
  return output.filter(Boolean);
}

export async function searchMet(query, page, signal) {
  const offset = page * PAGE_SIZE * 2;
  const params = new URLSearchParams({ q: query, hasImages: "true", offset: String(offset), limit: String(PAGE_SIZE * 2) });
  const search = await fetch(`${MET_API}/search?${params}`, { signal }).then(ensureOk);
  const ids = search.objectIDs ?? [];
  const objects = await mapLimit(ids, 5, async (id) => {
    const object = await fetch(`${MET_API}/objects/${id}`, { signal }).then(ensureOk);
    if (!object.primaryImage && !object.primaryImageSmall) return null;
    return {
      id: `met-${object.objectID}`,
      museum: "The Metropolitan Museum of Art",
      title: object.title || "Untitled",
      artist: object.artistDisplayName || "Artist unknown",
      date: object.objectDate || "Date unknown",
      medium: object.medium || "",
      image: object.primaryImageSmall || object.primaryImage || "",
      record: object.objectURL || `https://www.metmuseum.org/art/collection/search/${object.objectID}`,
      publicDomain: Boolean(object.isPublicDomain),
      department: object.department || object.culture || "",
    };
  });
  return { total: search.total ?? 0, artworks: objects, hasMore: offset + ids.length < (search.total ?? 0) };
}

export async function searchMuseum(museum, query, page, signal) {
  return museum === "aic" ? searchAic(query, page, signal) : searchMet(query, page, signal);
}
