import { Component, signal } from '@angular/core';
import { AuthService } from './shared/services/auth-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('netflix-clone');

  constructor(private authService: AuthService) {
    this.authService.loadUserFromToken(); // 🔥 ADD THIS
}  
}
