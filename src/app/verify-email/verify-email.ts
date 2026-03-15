import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../shared/services/auth-service';

@Component({
  selector: 'app-verify-email',
  standalone: false,
  templateUrl: './verify-email.html',
  styleUrls: ['./verify-email.css'] // ✅ correct

})
export class VerifyEmail implements OnInit {
loading = true;
success = false;
message = '';

constructor(
  private route: ActivatedRoute,
  private authService: AuthService,
  private cdr: ChangeDetectorRef
){}
ngOnInit(): void {
  const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.loading = false;
      this.success = false;
      this.message = 'Invalid verification link. No token provided';
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.success = true;
        this.message = res.message || 'Email verified successfully! You can now login.';
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        this.loading = false;
        this.success = false;
        this.message =
        err.error?.message || 'Verification failed. Link expired or already used.';
        this.cdr.detectChanges(); 
      }
    })
  }
}
