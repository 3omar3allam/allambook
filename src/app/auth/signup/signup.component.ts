import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../auth.service';
import { Subscription } from 'rxjs';
import { User } from '../user.model';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit, OnDestroy {

  public userModel: User;
  public passwordNoMatch: boolean;
  isLoading = false;
  private authStatusSub: Subscription;
  constructor(private auth: AuthService) { }

  ngOnInit() {
    this.userModel = {
      firstName: '',
      lastName: '',
      email: '',
      password: ''
    };
    setTimeout(() => document.getElementById('focus').focus(), 150);
    this.authStatusSub = this.auth.getAuthStatus().subscribe(
      _authStatus => {
        this.isLoading = false;
      }
    );
  }
  ngOnDestroy() {
    this.authStatusSub.unsubscribe();
  }

  validatePassword(confirmPassword: string) {
    this.passwordNoMatch = confirmPassword !== this.userModel.password;
  }

  onSignup() {
    this.isLoading = true;
    this.auth.createUser(this.userModel);
  }

}
