export const SUBMIT_CONTACT_FORM_MUTATION = `
  mutation SubmitContactForm($input: ContactFormInput!) {
    submitContactForm(input: $input)
  }
`;
