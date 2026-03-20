import axios, { type AxiosInstance } from 'axios';
import { error } from 'firebase-functions/logger';

interface OptionalPropertyParams {
  propertyType?: string; // enum: Single Family, Condo, Townhouse, Manufactured, Multi-Family, Apartment, Land
  radius?: number;
  squareFootage?: string;
  lotSize?: string;
  yearBuilt?: string;
  saleDateRange?: string;
  limit?: number;
  offset?: number;
  includeTotalCount?: boolean;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface AddressParams extends OptionalPropertyParams {
  address: string; // The full address of the property, in the format Street, City, State, Zip
}

interface CoordParams extends OptionalPropertyParams {
  latitude?: number;
  longitude?: number;
}

type PropertyParams = AddressParams | CoordParams;

interface PropertyDetails {
  id: string;
  formattedAddress: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  stateFips: string;
  zipCode: string;
  county: string;
  countyFips: string;
  latitude: number;
  longitude: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  lotSize: number;
  yearBuilt: number;
  assessorID: string;
  legalDescription: string;
  subdivision: string;
  zoning: string;
  lastSaleDate: string; //  date-time
  lastSalePrice: number;
  hoa: {
    fee: number;
  };
  features: {
    architectureType: string;
    cooling: boolean;
    coolingType: string;
    exteriorType: string;
    fireplace: boolean;
    fireplaceType: string;
    floorCount: number;
    foundationType: string;
    garage: boolean;
    garageSpaces: number;
    garageType: string;
    heating: boolean;
    heatingType: string;
    pool: boolean;
    poolType: string;
    roofType: string;
    roomCount: number;
    unitCount: number;
    viewType: string;
  };
  taxAssessments: Record<
    string | number,
    {
      year: number;
      value: number;
      land: number;
      improvements: number;
    }
  >;
  propertyTaxes: Record<
    string | number,
    {
      year: number;
      total: number;
    }
  >;
  history: Record<
    string,
    {
      event: string;
      date: string; // date-time
      price: number;
    }
  >;
  owner: {
    names: string[];
    type: string;
    mailingAddress: {
      id: string;
      formattedAddress: string;
      addressLine1: string;
      addressLine2: string;
      city: string;
      state: string;
      stateFips: string;
      zipCode: string;
    };
  };
  ownerOccupied: boolean;
}

export class RentCast {
  private instance: AxiosInstance;

  constructor(apiKey: string) {
    // this.baseUrl = baseUrl;
    this.instance = axios.create({
      baseURL: 'https://api.rentcast.io/v1/',
      headers: {
        'X-Api-Key': apiKey,
        Accept: 'application/json',
      },
      timeout: 10000,
    });
    this.initializeInterceptors();
  }

  private initializeInterceptors() {
    //     // Add request interceptor for tokens (e.g., Auth header)
    //     this.instance.interceptors.request.use((config) => {
    //       const token = localStorage.getItem('token');
    //       if (token) config.headers.Authorization = `Bearer ${token}`;
    //       return config;
    //     });
    this.instance.interceptors.response.use(
      (res) => res,
      async (err) => {
        error('Rentcast api error: ', err);
        return Promise.reject(err);
      },
    );
  }

  // https://developers.rentcast.io/reference/property-records
  public async getProperty(args: PropertyParams) {
    const { data } = await this.instance.get<PropertyDetails[]>('/properties', {
      params: args,
    });

    if (!data || !data.length) throw new Error('not found');
    return data[0];
  }
}
