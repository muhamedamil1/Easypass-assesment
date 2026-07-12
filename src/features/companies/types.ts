export type CompanyRole = "admin" | "viewer";

export type CompanyListItem = {
  id: string;
  name: string;
  role: CompanyRole;
};

export type CompanyDetail = {
  id: string;
  name: string;
  role: CompanyRole;
};
