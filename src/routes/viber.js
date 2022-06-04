export default async function (server, opts, next) {
  const params = {
    type: 'object',
    required: ['hook'],
    properties: {
      hook: {
        type: 'string',
        format: 'uuid'
      }
    }
  }

  const schema = {
    // body,
    // querystring,
    params
    // headers
  }

  server.post('/viber/:hook', { schema }, async (request, reply) => {
    const {
      headers,
      body,
      params: { hook },
      method,
      url
    } = request

    let bot = await server.hooks.checkHooks(hook)

    if (!bot) {
      reply.code(404).send({
        statusCode: 404,
        errorCode: 'Not Found',
        message: `Route ${method}:${url} not found`
      })
    }

    const signature = headers['x-viber-content-signature']

    await server.amqp.sendToQueue({
      pattern: 'fromViber',
      data: { bot_id: bot.id, bot_hook: hook, signature, bot_data: body }
    })

    return {
      message: 'Success',
      statusCode: 200
    }
  })

  next()
}
