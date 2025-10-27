import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export interface Client {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  dateJoined: Date;
  lastUpdated: Date;
  notes?: string;
  isBanned?: boolean;
  roles?: string[];
  preferences?: {
    favoriteServices?: string[];
    preferredTimes?: string[];
    allergies?: string[];
    specialRequests?: string;
  };
  totalAppointments?: number;
  lastAppointment?: Date;
}

export interface ClientAppointmentHistory {
  client: Client;
  appointments: any[];
  totalSpent: number;
  favoriteService: string;
}

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/clients`;
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    // Initialize offline data if in browser
    if (isPlatformBrowser(this.platformId)) {
      this.initializeOfflineData();
    }
  }

  // Initialize offline data for testing
  private initializeOfflineData(): void {
    // No hard-coded users - rely on actual data from localStorage
    console.log('📋 Client service initialized - loading clients from localStorage');
  }

  // Get all clients
  getClients(): Observable<Client[]> {
    const OFFLINE_MODE = false; // Disabled to connect to backend database
    
    if (OFFLINE_MODE) {
      // Offline mode: Return clients from localStorage
      return new Observable(observer => {
        setTimeout(() => {
          const localClients = JSON.parse(localStorage.getItem('offline_clients') || '[]');
          console.log('📋 Loaded clients from localStorage:', localClients.length);
          observer.next(localClients);
          observer.complete();
        }, 300);
      });
    }

    // Connect to backend database
    console.log('📋 Loading clients from backend...');
    return this.http.get<Client[]>(this.baseUrl).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Client service error:', error);
        
        // Handle CORS errors
        if (error.status === 0 || error.message.includes('CORS') || error.message.includes('Access-Control-Allow-Origin')) {
          return throwError(() => new Error('CORS Error: Unable to connect to the server. Please check if the backend is configured to allow requests from this domain.'));
        }
        
        // Check if the response is HTML (indicates server error or wrong endpoint)
        if (error.error && typeof error.error === 'string' && error.error.includes('<!DOCTYPE')) {
          console.error('Backend returned HTML instead of JSON. Server may be down or endpoint not found.');
          return throwError(() => new Error('Backend server is not responding correctly. Please check if the server is running.'));
        }
        
        // Handle other HTTP errors
        if (error.status === 404) {
          return throwError(() => new Error('Client API endpoint not found. Please check the backend configuration.'));
        }
        
        if (error.status >= 500) {
          return throwError(() => new Error('Server error occurred. Please try again later.'));
        }
        
        // For other errors, return the original error message
        return throwError(() => new Error(error.message || 'Failed to load clients'));
      })
    );
  }

  // Get client by ID
  getClientById(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.baseUrl}/${id}`);
  }

  // Create new client
  createClient(client: Partial<Client>): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.baseUrl, client);
  }

  // Update client
  updateClient(id: string, client: Partial<Client>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/${id}`, client);
  }

  // Delete client
  deleteClient(id: string): Observable<{ message: string }> {
    const OFFLINE_MODE = true; // Temporary offline mode for testing
    
    if (OFFLINE_MODE) {
      // Offline mode: Delete from localStorage
      return new Observable(observer => {
        setTimeout(() => {
          const localClients = JSON.parse(localStorage.getItem('offline_clients') || '[]');
          const filteredClients = localClients.filter((c: any) => c._id !== id);
          localStorage.setItem('offline_clients', JSON.stringify(filteredClients));
          
          observer.next({ message: 'Client deleted successfully (offline mode)' });
          observer.complete();
        }, 300);
      });
    }

    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  // Get client appointment history
  getClientAppointmentHistory(clientId: string): Observable<ClientAppointmentHistory> {
    return this.http.get<ClientAppointmentHistory>(`${this.baseUrl}/${clientId}/appointments`);
  }

  // Get clients with appointment statistics
  getClientsWithStats(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.baseUrl}/with-stats`);
  }

  // Ban a client
  banClient(clientId: string, cancelAppointments: boolean = true): Observable<{ message: string; isBanned: boolean }> {
    const OFFLINE_MODE = true; // Temporary offline mode for testing
    
    if (OFFLINE_MODE) {
      // Offline mode: Toggle ban status locally
      return new Observable(observer => {
        setTimeout(() => {
          const localClients = JSON.parse(localStorage.getItem('offline_clients') || '[]');
          const client = localClients.find((c: any) => c._id === clientId);
          
          if (client) {
            client.isBanned = !client.isBanned;
            localStorage.setItem('offline_clients', JSON.stringify(localClients));
            
            observer.next({ 
              message: `Client ${client.isBanned ? 'banned' : 'unbanned'} successfully (offline mode)`, 
              isBanned: client.isBanned 
            });
          } else {
            observer.next({ 
              message: 'Client ban status updated (offline mode)', 
              isBanned: true 
            });
          }
          
          observer.complete();
        }, 300);
      });
    }

    return this.http.post<{ message: string; isBanned: boolean }>(
      `${environment.apiUrl}/admin/clients/${clientId}/ban`, 
      { cancelAppointments }
    );
  }

  // Unban a client
  unbanClient(clientId: string): Observable<{ message: string; isBanned: boolean }> {
    const OFFLINE_MODE = true; // Temporary offline mode for testing
    
    if (OFFLINE_MODE) {
      // Offline mode: Toggle ban status locally
      return new Observable(observer => {
        setTimeout(() => {
          const localClients = JSON.parse(localStorage.getItem('offline_clients') || '[]');
          const client = localClients.find((c: any) => c._id === clientId);
          
          if (client) {
            client.isBanned = false;
            localStorage.setItem('offline_clients', JSON.stringify(localClients));
            
            observer.next({ 
              message: 'Client unbanned successfully (offline mode)', 
              isBanned: false 
            });
          } else {
            observer.next({ 
              message: 'Client unbanned (offline mode)', 
              isBanned: false 
            });
          }
          
          observer.complete();
        }, 300);
      });
    }

    return this.http.post<{ message: string; isBanned: boolean }>(
      `${environment.apiUrl}/admin/clients/${clientId}/unban`, 
      {}
    );
  }
}
