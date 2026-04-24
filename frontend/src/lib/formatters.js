const algorithmLabels = {
  rsa: "RSA",
  playfair: "Playfair Cipher",
  vigenere: "Vigenere Cipher",
  hybrid: "Hybrid Pipeline",
};

export function formatDate(value) {
  if (!value) {
    return "Unknown time";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function shortenHash(hash, length = 12) {
  if (!hash) {
    return "";
  }
  if (hash.length <= length * 2) {
    return hash;
  }
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
}

export function getAlgorithmLabel(value) {
  return algorithmLabels[value] || value;
}

export function getStatusTone(status) {
  if (status === "valid" || status === "healthy") {
    return "success";
  }
  if (status === "tampered" || status === "broken") {
    return "danger";
  }
  if (status === "affected") {
    return "warning";
  }
  return "neutral";
}

export function getVerificationResults(data) {
  return Array.isArray(data?.results) ? data.results : [];
}

export function getChangedBlockIds(data) {
  if (Array.isArray(data?.changed_block_ids)) {
    return data.changed_block_ids;
  }

  return getVerificationResults(data)
    .filter((result) => result.status === "tampered")
    .map((result) => result.id);
}

export function getAffectedBlockIds(data) {
  if (Array.isArray(data?.affected_block_ids)) {
    return data.affected_block_ids;
  }

  return getVerificationResults(data)
    .filter((result) => result.status === "affected")
    .map((result) => result.id);
}

export function getFirstBrokenBlockId(data) {
  if (typeof data?.first_broken_block_id === "number") {
    return data.first_broken_block_id;
  }

  const changedBlockIds = getChangedBlockIds(data);
  if (changedBlockIds.length) {
    return changedBlockIds[0];
  }

  const affectedBlockIds = getAffectedBlockIds(data);
  return affectedBlockIds.length ? affectedBlockIds[0] : null;
}

export function formatBlockIdList(ids = []) {
  if (!ids.length) {
    return "None";
  }

  return ids.map((id) => `#${id}`).join(", ");
}

export function normalizeWarnings(payload) {
  const rawWarnings = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.warnings)
        ? payload.warnings
        : [];

  return rawWarnings.map((item, index) => {
    const changedBlockIds = Array.isArray(item.changed_block_ids)
      ? item.changed_block_ids
      : Array.isArray(item.changedBlocks)
        ? item.changedBlocks
        : [];
    const affectedBlockIds = Array.isArray(item.affected_block_ids)
      ? item.affected_block_ids
      : Array.isArray(item.affectedBlocks)
        ? item.affectedBlocks
        : [];

    return {
      id:
        item.id ||
        `${item.timestamp || item.created_at || item.verified_at || index}-${changedBlockIds.join("-")}-${affectedBlockIds.join("-")}`,
      timestamp: item.timestamp || item.created_at || item.verified_at || null,
      is_valid: Boolean(item.is_valid),
      changed_block_ids: changedBlockIds,
      affected_block_ids: affectedBlockIds,
      first_broken_block_id: item.first_broken_block_id || changedBlockIds[0] || null,
      summary:
        item.summary ||
        (changedBlockIds.length
          ? `Integrity warning recorded for ${formatBlockIdList(changedBlockIds)}.`
          : "Verification warning recorded."),
    };
  });
}
