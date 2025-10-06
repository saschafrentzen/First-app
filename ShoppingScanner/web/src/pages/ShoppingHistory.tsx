import React, { useEffect, useState } from 'react';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { ShoppingList } from '../types';

const ShoppingHistory: React.FC = () => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLists = async () => {
      if (!auth.currentUser) return;

      try {
        const q = query(
          collection(db, 'shopping_lists'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const listsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ShoppingList[];

        setLists(listsData);
      } catch (error) {
        console.error('Error fetching lists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLists();
  }, []);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Shopping History
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>List Name</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Budget</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lists.map((list) => (
              <TableRow key={list.id}>
                <TableCell>{list.name}</TableCell>
                <TableCell>
                  {new Date(list.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>{list.items.length}</TableCell>
                <TableCell>
                  {list.budget ? `€${list.budget.toFixed(2)}` : 'No budget'}
                </TableCell>
                <TableCell>€{list.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  {list.budget ? (
                    <Chip
                      label={list.totalAmount > list.budget ? 'Over Budget' : 'Under Budget'}
                      color={list.totalAmount > list.budget ? 'error' : 'success'}
                    />
                  ) : (
                    <Chip label="No Budget" variant="outlined" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default ShoppingHistory;