
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { DeviceDetectorModule } from 'ngx-device-detector';

import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { BDirModule } from 'ngx-bdir';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}

import { UDbService } from './services/u-db.service';
import { UGmapsService } from './services/u-gmaps.service';
import { UGenericsService } from './services/u-generics.service';
import { ULanguageCodes } from './services/u-language-codes.service';
import { UfwInterface } from './services/ufw-interface';
import { BaseFormComponent } from './templates/base-form.component';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { ProfileComponent } from './profile/profile.component';
import { AuthService } from './auth.service';
import { TimeClockComponent } from './time-clock/time-clock.component';

@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    LoginComponent,
    ProfileComponent,
    BaseFormComponent,
    TimeClockComponent
  ],
  imports: [
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    }),
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    HttpClientModule,
    BDirModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    DeviceDetectorModule.forRoot()
  ],
  providers: [
    HttpClient, UGenericsService, UDbService, UGmapsService, ULanguageCodes, UfwInterface,
     AuthService
  ],

  bootstrap: [AppComponent]
})
export class AppModule { }
