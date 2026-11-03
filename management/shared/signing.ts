/**
 * Constantele fluxului de semnare electronică, împărțite de client și de server:
 * textul acceptat de semnatar și valabilitatea linkului public.
 */

/** Textul pe care semnatarul îl acceptă explicit înainte de a semna. */
export const ACCEPT_TEXT =
  "Am citit și am luat la cunoștință conținutul documentelor de mai sus și sunt de acord cu acestea, inclusiv cu clauzele speciale enumerate la art. 24 din Contract, pe care le accept în mod expres. Confirm că semnez în nume propriu sau ca reprezentant împuternicit al Beneficiarului.";

/** Articolul din Contract care ține loc de semnătură olografă pentru semnarea electronică. */
export const ESIGN_ARTICLE = "art. 23.11";

/** Câte zile e valabil linkul public de semnare (de la trimitere sau retrimitere). */
export const SIGN_LINK_DAYS = 30;
