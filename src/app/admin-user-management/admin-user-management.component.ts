import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-admin-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-user-management">
      <h2>⚠️ Admin User Management</h2>
      <p class="warning">This tool will delete ALL users and create a new admin user.</p>
      
      <div class="form-section">
        <h3>Create Admin User</h3>
        <div class="form-group">
          <label>Email:</label>
          <input type="email" [(ngModel)]="adminEmail" placeholder="admin@example.com" />
        </div>
        <div class="form-group">
          <label>Name:</label>
          <input type="text" [(ngModel)]="adminName" placeholder="Admin" />
        </div>
        <div class="form-group">
          <label>Password:</label>
          <input type="password" [(ngModel)]="adminPassword" placeholder="Enter password" />
        </div>
        <div class="form-group">
          <label>Phone:</label>
          <input type="text" [(ngModel)]="adminPhone" placeholder="0830000000" />
        </div>
        
        <button 
          class="danger-btn" 
          (click)="deleteAllAndCreateAdmin()" 
          [disabled]="loading || !adminEmail || !adminPassword">
          {{ loading ? 'Processing...' : 'Delete All Users & Create Admin' }}
        </button>
      </div>

      <div *ngIf="message" class="message" [class.success]="success" [class.error]="!success">
        {{ message }}
      </div>

      <div *ngIf="allUsers.length > 0" class="users-list">
        <h3>Current Users ({{ allUsers.length }})</h3>
        <div *ngFor="let user of allUsers" class="user-item">
          <span>{{ user.name }} ({{ user.email }}) - {{ user.role || 'user' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-user-management {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    
    .warning {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      border-radius: 4px;
      color: #856404;
      margin-bottom: 20px;
    }
    
    .form-section {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .form-group input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .danger-btn {
      background-color: #dc3545;
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      width: 100%;
    }
    
    .danger-btn:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }
    
    .message {
      padding: 15px;
      border-radius: 4px;
      margin-top: 20px;
    }
    
    .message.success {
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }
    
    .message.error {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }
    
    .users-list {
      margin-top: 20px;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    
    .user-item {
      padding: 8px;
      border-bottom: 1px solid #ddd;
    }
    
    .user-item:last-child {
      border-bottom: none;
    }
  `]
})
export class AdminUserManagementComponent {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  adminEmail = 'admin@example.com';
  adminName = 'Admin';
  adminPassword = '';
  adminPhone = '0830000000';
  
  loading = false;
  message = '';
  success = false;
  allUsers: any[] = [];

  ngOnInit() {
    this.loadAllUsers();
  }

  loadAllUsers() {
    this.http.get<any[]>(`${environment.apiUrl}/users`).subscribe({
      next: (users) => {
        this.allUsers = users;
      },
      error: (err) => {
        console.error('Error loading users:', err);
      }
    });
  }

  deleteAllAndCreateAdmin() {
    if (!confirm('⚠️ WARNING: This will DELETE ALL users and create a new admin user. Are you absolutely sure?')) {
      return;
    }

    this.loading = true;
    this.message = '';
    this.success = false;

    // Step 1: Get all users
    this.http.get<any[]>(`${environment.apiUrl}/users`).subscribe({
      next: (users) => {
        console.log('Found users to delete:', users.length);
        
        // Step 2: Delete all users
        const deletePromises = users.map(user => {
          const userId = user._id || user.id;
          return this.http.delete(`${environment.apiUrl}/users/${userId}`).toPromise();
        });

        Promise.all(deletePromises).then(() => {
          console.log('All users deleted');
          
          // Step 3: Create admin user
          const adminUser = {
            email: this.adminEmail,
            name: this.adminName,
            password: this.adminPassword,
            phone: this.adminPhone,
            role: 'admin'
          };

          this.http.post(`${environment.authApiUrl}/register`, adminUser).subscribe({
            next: (response) => {
              this.loading = false;
              this.success = true;
              this.message = `✅ Success! All users deleted and admin user "${this.adminEmail}" created. You can now log in with this account.`;
              this.allUsers = [];
              
              // Clear the password field
              this.adminPassword = '';
            },
            error: (err: HttpErrorResponse) => {
              this.loading = false;
              this.success = false;
              this.message = `❌ Error creating admin user: ${err.error?.message || err.message || 'Unknown error'}`;
              console.error('Error creating admin:', err);
            }
          });
        }).catch((error) => {
          this.loading = false;
          this.success = false;
          this.message = `❌ Error deleting users: ${error.message || 'Unknown error'}`;
          console.error('Error deleting users:', error);
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.success = false;
        this.message = `❌ Error loading users: ${err.error?.message || err.message || 'Unknown error'}`;
        console.error('Error loading users:', err);
      }
    });
  }
}

