export default async function onError(error, req, res, next) {
  /**
   * We could send errors to our logs provider f.x Sentry etc
   *
   * Another approach is throw errors as a class.
   * This means we could match the instance of that class and handle the error accordingly.
   * f.x User not authenticated = ForbiddenClass etc..
   */
  console.log(error)
  res.status(500).end()
}
