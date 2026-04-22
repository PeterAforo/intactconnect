export interface Client {
  id: string; name: string; email: string | null; phone: string | null;
  clientType: string; address: string | null; digitalAddress: string | null;
  city: string | null; region: string | null; landmark: string | null;
  latitude: number | null; longitude: number | null;
  companyName: string | null; taxId: string | null; companyRegNumber: string | null;
  contactPersonName: string | null; contactPersonPhone: string | null; contactPersonEmail: string | null;
  nationalIdType: string | null; nationalIdNumber: string | null;
  notes: string | null; createdAt: string;
  _count: { orders: number; invoices: number };
}

export const REGIONS = ["Greater Accra","Ashanti","Western","Eastern","Central","Northern","Volta","Upper East","Upper West","Bono","Bono East","Ahafo","Savannah","North East","Oti","Western North"];

export const ID_TYPES = [
  { v: "ghana_card", l: "Ghana Card" },
  { v: "voter_id", l: "Voter ID" },
  { v: "passport", l: "Passport" },
  { v: "nhis", l: "NHIS Card" },
  { v: "driver_license", l: "Driver's License" },
];

export const blankForm = () => ({
  clientType: "individual" as "individual" | "company",
  name: "", email: "", phone: "",
  address: "", digitalAddress: "", city: "", region: "", landmark: "",
  latitude: null as number | null, longitude: null as number | null,
  nationalIdType: "", nationalIdNumber: "", nationalIdImage: "",
  companyName: "", companyRegNumber: "", taxId: "",
  companyDocUrl: "", companyTaxDocUrl: "",
  contactPersonName: "", contactPersonEmail: "", contactPersonPhone: "",
  notes: "",
});

export type ClientForm = ReturnType<typeof blankForm>;
