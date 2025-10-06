import firestore from '@react-native-firebase/firestore';
import { getCurrentUser } from './auth';

export interface ShoppingItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
  createdAt: Date;
}

export interface ShoppingList {
  id?: string;
  name: string;
  budget?: number;
  items: ShoppingItem[];
  totalAmount: number;
  createdAt: Date;
  userId: string;
}

const listsCollection = 'shopping_lists';

export const createShoppingList = async (listData: Omit<ShoppingList, 'id' | 'userId'>) => {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const list = {
    ...listData,
    userId: user.uid,
    createdAt: new Date(),
  };

  try {
    const docRef = await firestore().collection(listsCollection).add(list);
    return { id: docRef.id, ...list };
  } catch (error) {
    throw error;
  }
};

export const getUserLists = async () => {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const snapshot = await firestore()
      .collection(listsCollection)
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ShoppingList[];
  } catch (error) {
    throw error;
  }
};

export const updateShoppingList = async (listId: string, updates: Partial<ShoppingList>) => {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  try {
    await firestore()
      .collection(listsCollection)
      .doc(listId)
      .update(updates);
  } catch (error) {
    throw error;
  }
};

export const deleteShoppingList = async (listId: string) => {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  try {
    await firestore()
      .collection(listsCollection)
      .doc(listId)
      .delete();
  } catch (error) {
    throw error;
  }
};