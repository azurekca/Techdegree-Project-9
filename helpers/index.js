/** Helper functions */

function handleSequelizeValidationErrors(error) {
  const errorMsg = [];
  error.errors.map((err) => errorMsg.push(err.message));
  return errorMsg;
}

module.exports = { handleSequelizeValidationErrors }