import { inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { SignUpCredentials, SignInCredentials, AuthResponse } from '../interfaces/auth-interface';
import { Firestore, doc, setDoc, serverTimestamp, deleteDoc, getDoc } from '@angular/fire/firestore';
import { generateRandomColor, generateInitials } from '../models/contact.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public auth: Auth = inject(Auth);//It refers to the Firebase Authentication instance.
  private firestore: Firestore = inject(Firestore);
  private userName: string = '';

  constructor() { }

  setUserName(name: string) {
    this.userName = name;
  }

  getUserName(): string {
    return this.userName;
  }

  async signUp({ name, email, password }: SignUpCredentials): Promise<AuthResponse> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const uid = userCredential.user.uid;
  
    // Store in contacts collection
    await setDoc(doc(this.firestore, 'contacts', uid), {
      id: uid,
      name,
      email, // fix from 'mail' to 'email'
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
  
 //getting name from firebase to show in summary
 async loadUserNameFromFirestore(uid: string): Promise<string> {
  const contactRef = doc(this.firestore, 'contacts', uid);
  const contactSnap = await getDoc(contactRef);
  const name = contactSnap.exists() ? contactSnap.data()?.['name'] || '' : '';
  this.setUserName(name); 
  return name; //RETURN this so component can use directly
}

async logout() {
  return signOut(this.auth); // Just sign out, do not delete anything
}
  
  getCurrentUser(callback: (user: User | null) => void): void {
    onAuthStateChanged(this.auth, callback);
  }

}
