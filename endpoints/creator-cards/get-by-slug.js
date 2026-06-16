const { createHandler } = require('@app-core/server');
const getCreatorCardBySlug = require('@app/services/creator-cards/get-creator-card-by-slug');
const CreatorCardMessages = require('@app/messages/creator-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'get',
  middlewares: [],
  async handler(rc, helpers) {
    const payload = {
      slug: rc.params.slug,
      access_code: rc.query.access_code,
    };
    const response = await getCreatorCardBySlug(payload);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.CREATOR_CARD_RETRIEVED_SUCCESSFULLY,
      data: response,
    };
  },
});
