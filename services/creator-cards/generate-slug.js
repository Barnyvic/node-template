const CreatorCard = require('@app/repository/creator-card');
const { randomBytes } = require('@app-core/randomness');

function normalizeToSlugBase(input = '') {
  const lowerInput = `${input}`.toLowerCase();
  let normalized = '';
  let pendingHyphen = false;

  for (let index = 0; index < lowerInput.length; index += 1) {
    const char = lowerInput[index];

    if (char.trim() === '') {
      if (normalized.length > 0) {
        pendingHyphen = true;
      }
    } else {
      const isLowercaseAlpha = char >= 'a' && char <= 'z';
      const isNumber = char >= '0' && char <= '9';
      const isAllowedSymbol = char === '-' || char === '_';

      if (isLowercaseAlpha || isNumber || isAllowedSymbol) {
        if (pendingHyphen && char !== '-') {
          normalized += '-';
        }
        pendingHyphen = false;
        normalized += char;
      }
    }
  }

  return normalized;
}

async function slugExists(slug) {
  const existingCard = await CreatorCard.findOne({ query: { slug } });
  return Boolean(existingCard);
}

async function resolveUniqueSlug(slugBase, slug) {
  if (!(await slugExists(slug))) {
    return slug;
  }

  return resolveUniqueSlug(slugBase, `${slugBase}-${randomBytes(6)}`);
}

async function generateSlug(title) {
  const slugBase = normalizeToSlugBase(title) || 'card';
  let slug = slugBase;

  if (slug.length < 5 || (await slugExists(slug))) {
    slug = `${slugBase}-${randomBytes(6)}`;
  }

  return resolveUniqueSlug(slugBase, slug);
}

module.exports = {
  generateSlug,
  normalizeToSlugBase,
};
