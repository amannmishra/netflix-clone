import { inject, NgModule, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Landing } from './landing/landing';
import { SharedModule } from './shared/shared-module';
import { Signup } from './signup/signup';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Login } from './login/login';
import { VerifyEmail } from './verify-email/verify-email';
import { Home } from './user/home/home';
import { authInterceptor } from './shared/interceptors/auth-interceptor';
import { AuthService } from './shared/services/auth-service';
import { MatIconModule } from '@angular/material/icon';
import { ForgotPassword } from './forgot-password/forgot-password';
import { ResetPassword } from './reset-password/reset-password';
import { VideoPlayer } from './shared/components/video-player/video-player';
import { UserList } from './user-list/user-list';
import { ManageUser } from './admin/dialog/manage-user/manage-user';
import { A11yModule } from "@angular/cdk/a11y";
import { MyFavorites } from './user/my-favorites/my-favorites';



@NgModule({
  declarations: [
    App,
    Landing,
    Signup,
    Login,
    VerifyEmail,
    Home,
    ForgotPassword,
    ResetPassword,
    VideoPlayer,
    UserList,
    ManageUser,
    MyFavorites,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    A11yModule
],
  providers: [
    provideAppInitializer(()=>{
      const auth = inject(AuthService);
      return auth.initializeAuth();
    }),
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor]))
  ],
  bootstrap: [App]
})
export class AppModule { }
