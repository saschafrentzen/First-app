import auth from '@react-native-firebase/auth';

export const signIn = async (email: string, password: string) => {
  try {
    const response = await auth().signInWithEmailAndPassword(email, password);
    return response.user;
  } catch (error) {
    throw error;
  }
};

export const signUp = async (email: string, password: string) => {
  try {
    const response = await auth().createUserWithEmailAndPassword(email, password);
    return response.user;
  } catch (error) {
    throw error;
  }
};

export const signOut = async () => {
  try {
    await auth().signOut();
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth().currentUser;
};