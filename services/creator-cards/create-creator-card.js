const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const CreatorCard = require('@app/repository/creator-card');
const CreatorCardMessages = require('@app/messages/creator-card');
const { generateSlug } = require('./generate-slug');
const serializeCreatorCard = require('./serialize-creator-card');

const createCreatorCardSpec = `root {
  title string<trim|minLength:3|maxLength:100>
  description? string<trim|maxLength:500>
  slug? string<trim|minLength:5|maxLength:50>
  creator_reference string<length:20>
  links[]? {
    title string<trim|minLength:1|maxLength:100>
    url string<trim|maxLength:200>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<trim|minLength:3|maxLength:100>
      description string<trim|maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<length:6>
}`;

const parsedCreateCreatorCardSpec = validator.parse(createCreatorCardSpec);

function isAlphaNumeric(value) {
  let isValid = true;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const isLowerAlpha = char >= 'a' && char <= 'z';
    const isUpperAlpha = char >= 'A' && char <= 'Z';
    const isNumber = char >= '0' && char <= '9';

    if (!isLowerAlpha && !isUpperAlpha && !isNumber) {
      isValid = false;
      break;
    }
  }

  return isValid;
}

function hasValidSlugCharacters(slug) {
  let isValid = true;

  for (let index = 0; index < slug.length; index += 1) {
    const char = slug[index];
    const isLowerAlpha = char >= 'a' && char <= 'z';
    const isUpperAlpha = char >= 'A' && char <= 'Z';
    const isNumber = char >= '0' && char <= '9';
    const isAllowedSymbol = char === '-' || char === '_';

    if (!isLowerAlpha && !isUpperAlpha && !isNumber && !isAllowedSymbol) {
      isValid = false;
      break;
    }
  }

  return isValid;
}

function hasValidUrlPrefix(url) {
  return url.startsWith('http://') || url.startsWith('https://');
}

function validateLinksAndRates(data) {
  if (data.links?.length) {
    data.links.forEach((link) => {
      if (!hasValidUrlPrefix(link.url)) {
        throwAppError(CreatorCardMessages.INVALID_LINK_URL, ERROR_CODE.INVLDDATA);
      }
    });
  }

  if (data.service_rates) {
    if (!data.service_rates.rates?.length) {
      throwAppError(CreatorCardMessages.EMPTY_SERVICE_RATES, ERROR_CODE.INVLDDATA);
    }

    data.service_rates.rates.forEach((rate) => {
      if (!Number.isInteger(rate.amount) || rate.amount < 1) {
        throwAppError(CreatorCardMessages.INVALID_RATE_AMOUNT, ERROR_CODE.INVLDDATA);
      }
    });
  }
}

async function createCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedCreateCreatorCardSpec);
  data.access_type = data.access_type || 'public';
  data.links = data.links || [];

  if (data.access_type === 'private' && !data.access_code) {
    throwAppError(CreatorCardMessages.ACCESS_CODE_REQUIRED, 'AC01');
  }

  if (data.access_type === 'public' && data.access_code) {
    throwAppError(CreatorCardMessages.ACCESS_CODE_ON_PUBLIC, 'AC05');
  }

  if (data.access_code && !isAlphaNumeric(data.access_code)) {
    throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE_FORMAT, ERROR_CODE.INVLDDATA);
  }

  if (data.slug && !hasValidSlugCharacters(data.slug)) {
    throwAppError(CreatorCardMessages.INVALID_SLUG_FORMAT, ERROR_CODE.INVLDDATA);
  }

  validateLinksAndRates(data);

  if (data.slug) {
    const existingCard = await CreatorCard.findOne({ query: { slug: data.slug } });
    if (existingCard) {
      throwAppError(CreatorCardMessages.SLUG_ALREADY_TAKEN, 'SL02');
    }
  } else {
    data.slug = await generateSlug(data.title);
  }

  if (data.access_type === 'public') {
    data.access_code = null;
  }

  const createdCard = await CreatorCard.create(data, options);
  const response = serializeCreatorCard(createdCard, { includeAccessCode: true });

  return response;
}

module.exports = createCreatorCard;
