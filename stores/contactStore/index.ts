import { create } from 'zustand';

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

interface ContactStore {
  isSubmitting: boolean;
  submitContactForm: (data: ContactFormData) => Promise<boolean>;
}

// Helper function for GraphQL API calls (no auth needed for contact form)
const makeGraphQLCall = async (query: string, variables: Record<string, unknown> = {}) => {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
};

const SUBMIT_CONTACT_FORM_MUTATION = `
  mutation SubmitContactForm($input: ContactFormInput!) {
    submitContactForm(input: $input)
  }
`;

export const useContactStore = create<ContactStore>((set) => ({
  isSubmitting: false,

  submitContactForm: async (data: ContactFormData): Promise<boolean> => {
    set({ isSubmitting: true });
    try {
      const result = await makeGraphQLCall(
        SUBMIT_CONTACT_FORM_MUTATION,
        { input: data }
      );
      return result.submitContactForm;
    } catch (error) {
      console.error('Failed to submit contact form:', error);
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },
}));
