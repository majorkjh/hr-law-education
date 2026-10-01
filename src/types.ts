export interface CeremonyRow {
  id: string;
  time: string;
  content: string;
  remarks: string;
}

export interface DocumentData {
  title: string;
  purpose: string;
  overview: {
    eventName: string;
    dateTime: string;
    location: string;
    target: string;
    awardeeCount: string;
    attendeeCount: string;
    host: string;
    extra: string;
  };
  details: string;
  ceremonyRows: CeremonyRow[];
  futurePlans: string;
}
