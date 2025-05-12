/* The auth.guard.ts file is a route guard. It’s used in Angular to protect certain routes, ensuring only authenticated users (users logged in) can access them
CanActivateFn is a built-in Angular type that defines a function-style route guard.
It returns either: true or false (synchronously) or a Promise<boolean> or Observable<boolean> (asynchronously), onAuthStateChanged is a Firebase method that listens to login/logout changes and gives you the current user if one is logged in.
*/

import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from '@angular/fire/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  return new Promise(resolve => {
    onAuthStateChanged(auth, user => {
      resolve(!!user); // only allow route access if user exists
    });
  });
};
