// Firebase pieces used by Scrolls of Light, exposed as window.FB (bundled by build.py → fb.js)
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, linkWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword, signOut, signInWithCredential,
  browserLocalPersistence, setPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager, memoryLocalCache, doc, getDoc, getDocFromServer, setDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit, getDocs, onSnapshot, writeBatch, serverTimestamp, increment,
  arrayUnion, arrayRemove, deleteField, runTransaction, Timestamp, collectionGroup, documentId } from 'firebase/firestore';
import qrcode from 'qrcode-generator';
window.FB = { qr: qrcode, initializeApp, deleteApp, getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, linkWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword, signOut, signInWithCredential, browserLocalPersistence, setPersistence,
  initializeFirestore, persistentLocalCache, persistentSingleTabManager, memoryLocalCache, doc, getDoc, getDocFromServer, setDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit, getDocs, onSnapshot, writeBatch, serverTimestamp, increment,
  arrayUnion, arrayRemove, deleteField, runTransaction, Timestamp, collectionGroup, documentId };
