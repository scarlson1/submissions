export const dateSanitizer = (value: any) => {
  console.log('sanitizer incoming value: ', value);
  if (!value || value === '') return new Date();
  return new Date(value);
};

export const dateValidator = (value: any) => {
  console.log('validation value: ', value);
  const isValid = value instanceof Date && !isNaN(value.getTime());
  // const valid = isValid(new Date(value)) // // TODO: use date-fns
  console.log('date is valid: ', isValid);

  if (!isValid) return Promise.reject('Invalid date');
  // return Promise.resolve();
  return Promise.resolve(value);
};
