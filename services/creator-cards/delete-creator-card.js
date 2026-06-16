const validator = require('@app-core/validator');
const { throwAppError } = require('@app-core/errors');
const CreatorCard = require('@app/repository/creator-card');
const CreatorCardMessages = require('@app/messages/creator-card');
const serializeCreatorCard = require('./serialize-creator-card');

const deleteCreatorCardSpec = `root {
  slug string<trim|minLength:5|maxLength:50>
  creator_reference string<length:20>
}`;

const parsedDeleteCreatorCardSpec = validator.parse(deleteCreatorCardSpec);

async function deleteCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedDeleteCreatorCardSpec);
  const card = await CreatorCard.findOne({ query: { slug: data.slug }, options });

  if (!card) {
    throwAppError(CreatorCardMessages.CARD_NOT_FOUND, 'NF01');
  }

  const deletedTimestamp = Date.now();
  await CreatorCard.deleteOne({ query: { slug: data.slug }, options });
  const response = serializeCreatorCard(card, {
    includeAccessCode: true,
    deleted: deletedTimestamp,
  });

  return response;
}

module.exports = deleteCreatorCard;
