import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  
  // Only add auth token in browser environment
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  // Get token from localStorage
  const token = localStorage.getItem('auth_token');

  // If token exists and request is to our API, add Authorization header
  if (token && (req.url.includes('/api/v1') || req.url.includes('/api/auth'))) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  return next(req);
};

