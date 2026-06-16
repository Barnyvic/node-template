const { createHandler } = require('@app-core/server');
const deleteCreatorCard = require('@app/services/creator-cards/delete-creator-card');
const CreatorCardMessages = require('@app/messages/creator-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'delete',
  middlewares: [],
  async handler(rc, helpers) {
    const payload = {
      ...rc.body,
      slug: rc.params.slug,
    };
    const response = await deleteCreatorCard(payload);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.CREATOR_CARD_DELETED_SUCCESSFULLY,
      data: response,
    };
  },
});
