const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const processPaymentInstruction = require('../../services/payment-instruction/process-payment-instruction');

module.exports = createHandler({
  path: '/payment-instructions',
  method: 'post',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info(
      {
        requestContext: rc,
        response: rs,
        instruction: rc.body?.instruction,
      },
      'payment-instruction-request-completed'
    );
  },
  async handler(rc, helpers) {
    const payload = rc.body;

    const response = await processPaymentInstruction(payload);

    const httpStatus =
      response.status === 'failed'
        ? helpers.http_statuses.HTTP_400_BAD_REQUEST
        : helpers.http_statuses.HTTP_200_OK;

    return {
      status: httpStatus,
      data: response,
    };
  },
});
