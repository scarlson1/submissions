let isFirebaseAdminInitialized = false;

// export default async function () {
export async function getFirebaseAdmin() {
  const admin = await import('firebase-admin');

  if (!isFirebaseAdminInitialized) {
    admin.initializeApp();
    isFirebaseAdminInitialized = true;
  }

  return admin;
}
