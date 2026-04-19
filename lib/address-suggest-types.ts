export type AddressSuggestionItem = {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

export type AddressSuggestResponse = {
  suggestions: AddressSuggestionItem[];
};
