/**
 * Constantele fluxului de semnare electronică, împărțite de client și de server:
 * textul acceptat de semnatar și valabilitatea linkului public.
 */

/** Textul pe care semnatarul îl acceptă explicit înainte de a semna. */
export const ACCEPT_TEXT =
  "Am citit și am luat la cunoștință conținutul documentelor de mai sus și sunt de acord cu acestea. Confirm că semnez în nume propriu sau ca reprezentant împuternicit al Beneficiarului.";

/** Câte zile e valabil linkul public de semnare (de la trimitere sau retrimitere). */
export const SIGN_LINK_DAYS = 30;
