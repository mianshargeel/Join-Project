import { inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { SignUpCredentials, SignInCredentials, AuthResponse } from '../interfaces/auth-interface';
import { Firestore, doc, setDoc, serverTimestamp, deleteDoc } from '@angular/fire/firestore';
import { generateRandomColor, generateInitials } from '../models/contact.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);//It refers to the Firebase Authentication instance.
  private firestore: Firestore = inject(Firestore);

  constructor() { }

  async signUp({ name, email, password }: SignUpCredentials): Promise<AuthResponse> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const uid = userCredential.user.uid;

    // Store in contacts collection
    await setDoc(doc(this.firestore, 'contacts', uid), {
      id: uid,
      name,
      mail: email,
      phone: '',
      color: generateRandomColor(),
      initials: generateInitials(name),
      createdAt: serverTimestamp()
    });

    return {
      uid,
      email
    };
  }

  async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
    const result = await signInWithEmailAndPassword(
      this.auth,
      credentials.email,
      credentials.password
    );
    return {
      uid: result.user.uid,
      email: result.user.email,
    };
  }

   async logout() {
    const user = this.auth.currentUser;
    if (user && user.isAnonymous) { // only guest as Anonymous user
      await deleteDoc(doc(this.firestore, 'contacts', user.uid));
    }
    return signOut(this.auth);
  }
  

  getCurrentUser(callback: (user: User | null) => void): void {
    onAuthStateChanged(this.auth, callback);
  }

}
