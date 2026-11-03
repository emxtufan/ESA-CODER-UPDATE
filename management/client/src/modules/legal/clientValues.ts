/** Datele clientului din fișă, mapate pe câmpurile contractului (`cl*`). */
import type { Values } from "./contract/engine";

export type ClientRecord = Record<string, unknown> & { id: string; companyName: string };

const str = (value: unknown): string => (typeof value === "string" ? value : "");

export function clientValues(client: ClientRecord): Values {
  const address = [client.address, client.city, client.postalCode]
    .map((part) => str(part).trim())
    .filter(Boolean)
    .join(", ");
  return {
    clNume: str(client.legalName) || str(client.companyName),
    clSediu: address,
    clRc: str(client.regCom),
    clCui: str(client.cui),
    clIban: str(client.iban),
    clBanca: str(client.bank),
    clEmail: str(client.primaryEmail) || str(client.billingEmail),
    clTel: str(client.phone),
    clRep: str(client.contactPerson),
    clFunctie: str(client.position),
  };
}
