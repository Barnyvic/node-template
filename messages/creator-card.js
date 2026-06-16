const CreatorCardMessages = {
  SLUG_ALREADY_TAKEN: 'Slug is already taken',
  ACCESS_CODE_REQUIRED: 'access_code is required when access_type is private',
  ACCESS_CODE_ON_PUBLIC: 'access_code can only be set on private cards',
  CARD_NOT_FOUND: 'Creator card not found',
  DRAFT_NOT_FOUND: 'Creator card not found',
  PRIVATE_ACCESS_REQUIRED: 'This card is private. An access code is required',
  INVALID_ACCESS_CODE: 'Invalid access code',
  CREATOR_CARD_CREATED_SUCCESSFULLY: 'Creator Card Created Successfully.',
  CREATOR_CARD_RETRIEVED_SUCCESSFULLY: 'Creator Card Retrieved Successfully.',
  CREATOR_CARD_DELETED_SUCCESSFULLY: 'Creator Card Deleted Successfully.',
  INVALID_ACCESS_CODE_FORMAT: 'access_code must be exactly 6 alphanumeric characters',
  INVALID_SLUG_FORMAT: 'slug can only contain letters, numbers, hyphens, and underscores',
  INVALID_LINK_URL:
    'links[].url must start with http:// or https:// and be no more than 200 characters',
  INVALID_RATE_AMOUNT: 'service_rates.rates[].amount must be a positive integer',
  EMPTY_SERVICE_RATES:
    'service_rates.rates must contain at least one rate when service_rates is present',
};

module.exports = CreatorCardMessages;
