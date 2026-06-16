function serializeCreatorCard(card, options = {}) {
  const { includeAccessCode = false, deleted } = options;
  const serializedCard = {
    id: card._id,
    title: card.title,
    description: card.description || null,
    slug: card.slug,
    creator_reference: card.creator_reference,
    links: card.links || [],
    service_rates: card.service_rates || null,
    status: card.status,
    access_type: card.access_type || 'public',
    created: card.created,
    updated: card.updated,
    deleted: typeof deleted === 'number' ? deleted : card.deleted || null,
  };

  if (includeAccessCode) {
    serializedCard.access_code = serializedCard.access_type === 'private' ? card.access_code : null;
  }

  return serializedCard;
}

module.exports = serializeCreatorCard;
