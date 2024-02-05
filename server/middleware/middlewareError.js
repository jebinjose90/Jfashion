const handleErrors = (err, req, res, next) => {
  console.error(err.stack);

  let statusCode = 500;
  let errorMessage = 'Internal Server Error';

  if (err instanceof BadRequestError) {
    statusCode = 400; // Bad Request
    errorMessage = 'Bad Request';
  } else if (err instanceof UnauthorizedError) {
    statusCode = 401; // Unauthorized
    errorMessage = 'Unauthorized';
  } else if (err instanceof PaymentRequiredError) {
    statusCode = 402; // Payment Required
    errorMessage = 'Payment Required';
  } else if (err instanceof ForbiddenError) {
    statusCode = 403; // Forbidden
    errorMessage = 'Forbidden';
  } else if (err instanceof NotFoundError) {
    statusCode = 404; // Not Found
    errorMessage = 'Not Found';
  } else if (err instanceof MethodNotAllowedError) {
    statusCode = 405; // Method Not Allowed
    errorMessage = 'Method Not Allowed';
  } else if (err instanceof NotAcceptableError) {
    statusCode = 406; // Not Acceptable
    errorMessage = 'Not Acceptable';
  } else if (err instanceof ProxyAuthenticationRequiredError) {
    statusCode = 407; // Proxy Authentication Required
    errorMessage = 'Proxy Authentication Required';
  } else if (err instanceof RequestTimeoutError) {
    statusCode = 408; // Request Timeout
    errorMessage = 'Request Timeout';
  } else if (err instanceof ConflictError) {
    statusCode = 409; // Conflict
    errorMessage = 'Conflict';
  } else if (err instanceof GoneError) {
    statusCode = 410; // Gone
    errorMessage = 'Gone';
  } else if (err instanceof LengthRequiredError) {
    statusCode = 411; // Length Required
    errorMessage = 'Length Required';
  } else if (err instanceof PreconditionFailedError) {
    statusCode = 412; // Precondition Failed
    errorMessage = 'Precondition Failed';
  } else if (err instanceof PayloadTooLargeError) {
    statusCode = 413; // Payload Too Large
    errorMessage = 'Payload Too Large';
  } else if (err instanceof URITooLongError) {
    statusCode = 414; // URI Too Long
    errorMessage = 'URI Too Long';
  } else if (err instanceof UnsupportedMediaTypeError) {
    statusCode = 415; // Unsupported Media Type
    errorMessage = 'Unsupported Media Type';
  } else if (err instanceof RangeNotSatisfiableError) {
    statusCode = 416; // Range Not Satisfiable
    errorMessage = 'Range Not Satisfiable';
  } else if (err instanceof ExpectationFailedError) {
    statusCode = 417; // Expectation Failed
    errorMessage = 'Expectation Failed';
  } else if (err instanceof ImATeapotError) {
    statusCode = 418; // I'm a teapot
    errorMessage = 'I\'m a teapot';
  } else if (err instanceof MisdirectedRequestError) {
    statusCode = 421; // Misdirected Request
    errorMessage = 'Misdirected Request';
  } else if (err instanceof UnprocessableEntityError) {
    statusCode = 422; // Unprocessable Entity
    errorMessage = 'Unprocessable Entity';
  } else if (err instanceof LockedError) {
    statusCode = 423; // Locked
    errorMessage = 'Locked';
  } else if (err instanceof FailedDependencyError) {
    statusCode = 424; // Failed Dependency
    errorMessage = 'Failed Dependency';
  } else if (err instanceof TooEarlyError) {
    statusCode = 425; // Too Early
    errorMessage = 'Too Early';
  } else if (err instanceof UpgradeRequiredError) {
    statusCode = 426; // Upgrade Required
    errorMessage = 'Upgrade Required';
  } else if (err instanceof PreconditionRequiredError) {
    statusCode = 428; // Precondition Required
    errorMessage = 'Precondition Required';
  } else if (err instanceof TooManyRequestsError) {
    statusCode = 429; // Too Many Requests
    errorMessage = 'Too Many Requests';
  } else if (err instanceof RequestHeaderFieldsTooLargeError) {
    statusCode = 431; // Request Header Fields Too Large
    errorMessage = 'Request Header Fields Too Large';
  } else if (err instanceof UnavailableForLegalReasonsError) {
    statusCode = 451; // Unavailable For Legal Reasons
    errorMessage = 'Unavailable For Legal Reasons';
  } else if (err instanceof InternalServerError) {
    statusCode = 500; // Internal Server Error
    errorMessage = 'Internal Server Error';
  } else if (err instanceof NotImplementedError) {
    statusCode = 501; // Not Implemented
    errorMessage = 'Not Implemented';
  } else if (err instanceof BadGatewayError) {
    statusCode = 502; // Bad Gateway
    errorMessage = 'Bad Gateway';
  } else if (err instanceof ServiceUnavailableError) {
    statusCode = 503; // Service Unavailable
    errorMessage = 'Service Unavailable';
  } else if (err instanceof GatewayTimeoutError) {
    statusCode = 504; // Gateway Timeout
    errorMessage = 'Gateway Timeout';
  } else if (err instanceof HTTPVersionNotSupportedError) {
    statusCode = 505; // HTTP Version Not Supported
    errorMessage = 'HTTP Version Not Supported';
  } else if (err instanceof VariantAlsoNegotiatesError) {
    statusCode = 506; // Variant Also Negotiates
    errorMessage = 'Variant Also Negotiates';
  } else if (err instanceof InsufficientStorageError) {
    statusCode = 507; // Insufficient Storage
    errorMessage = 'Insufficient Storage';
  } else if (err instanceof LoopDetectedError) {
    statusCode = 508; // Loop Detected
    errorMessage = 'Loop Detected';
  } else if (err instanceof NotExtendedError) {
    statusCode = 510; // Not Extended
    errorMessage = 'Not Extended';
  } else if (err instanceof NetworkAuthenticationRequiredError) {
    statusCode = 511; // Network Authentication Required
    errorMessage = 'Network Authentication Required';
  }

  res.status(statusCode).render('error', { message: errorMessage });
};


module.exports = handleErrors;