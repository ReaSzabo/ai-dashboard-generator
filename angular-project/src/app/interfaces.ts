// '/api/generate-chart' endpoint request interface
export interface GenerateChartRequestBody {
  query: string;
}

// Data structure interfaces
export interface RegistrationData {
  date: string;
  facebook: number;
  gmail: number;
  email: number;
}

export interface LoginData {
  date: string;
  facebook: number;
  gmail: number;
  email: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

// '/api/generate-chart' endpoint response interface
export interface GenerateChartResponse {
  dataType: 'registrations' | 'logins';
  type: 'all' | 'facebook' | 'gmail' | 'email';
  chartType: 'line' | 'bar' | 'pie';
  aggregationType: 'breakdown' | 'total';
  registrations?: RegistrationData[];
  logins?: LoginData[];
  dateRange?: DateRange;
}

// Error interface
export interface ApiError {
  message: string;
  status?: number;
  error?: string;
  timestamp?: string;
}

// HTTP Error response from Angular HttpClient
export interface HttpErrorResponse {
  error: ApiError | string;
  message: string;
  status: number;
  statusText: string;
  url?: string;
}