class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequest extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

class Unauthorized extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class Forbidden extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

class NotFound extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 500);
  }
}

/**
 * Global error handling middleware.
 * Catches both operational errors (our AppError)
 * and unexpected ones.
 */
const errorHandler = (err, req, res, next) => {
  if (err.isOperational && err.statusCode) {
    return res
      .status(err.statusCode)
      .json({ error: err.message });
  }

  console.error('Unexpected Error:', err);
  return res
    .status(500)
    .json({ error: 'Something went wrong' });
};

module.exports = {
  AppError,
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
  InternalServerError,
  errorHandler,
};