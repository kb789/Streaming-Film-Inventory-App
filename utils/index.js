exports.fieldValidator = (fields) => {
  const { name, director, price, availability, category, film_id } = fields;
  if (!name || !director || !price || !availability || !category || !film_id) {
    const emptyFields = [];
    Object.keys(fields).forEach((field) => {
      if (fields[field].length <= 0) {
        emptyFields.push(field);
      }
    });
    return {
      error: "All fields are required",
      emptyFields,
    };
  }
  return null;
};
