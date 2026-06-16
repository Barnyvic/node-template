const validator = require('@app-core/validator');
const { throwAppError } = require('@app-core/errors');
const CreatorCard = require('@app/repository/creator-card');
const CreatorCardMessages = require('@app/messages/creator-card');
const serializeCreatorCard = require('./serialize-creator-card');

const getCreatorCardBySlugSpec = `root {
  slug string<trim|minLength:5|maxLength:50>
  access_code? string<length:6>
}`;

const parsedGetCreatorCardBySlugSpec = validator.parse(getCreatorCardBySlugSpec);

async function getCreatorCardBySlug(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedGetCreatorCardBySlugSpec);
  const card = await CreatorCard.findOne({ query: { slug: data.slug }, options });

  if (!card) {
    throwAppError(CreatorCardMessages.CARD_NOT_FOUND, 'NF01');
  }

  if (card.status === 'draft') {
    throwAppError(CreatorCardMessages.DRAFT_NOT_FOUND, 'NF02');
  }

  if (card.access_type === 'private' && !data.access_code) {
    throwAppError(CreatorCardMessages.PRIVATE_ACCESS_REQUIRED, 'AC03');
  }

  if (card.access_type === 'private' && data.access_code !== card.access_code) {
    throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE, 'AC04');
  }

  const response = serializeCreatorCard(card, { includeAccessCode: false });

  return response;
}

module.exports = getCreatorCardBySlug;
