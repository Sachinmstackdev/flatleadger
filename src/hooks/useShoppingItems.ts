import { useState, useEffect } from 'react';
import { supabase, DatabaseShoppingItem } from '../lib/supabase';
import { ShoppingItem } from '../types';

export const useShoppingItems = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert database item to app item
  const convertToAppItem = (dbItem: DatabaseShoppingItem): ShoppingItem => ({
    id: dbItem.id,
    name: dbItem.name,
    completed: dbItem.completed,
    addedBy: dbItem.added_by,
    addedAt: dbItem.created_at,
    priority: 'medium', // Default priority
    quantity: undefined,
    assignedTo: undefined,
    notes: undefined
  });

  // Convert app item to database item
  const convertToDbItem = (item: Omit<ShoppingItem, 'id' | 'addedAt'>, currentUserId: string): Omit<DatabaseShoppingItem, 'id' | 'created_at'> => ({
    name: item.name,
    completed: item.completed,
    added_by: currentUserId,
    date: new Date().toISOString().split('T')[0]
  });

  // Fetch shopping items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const convertedItems = data?.map(convertToAppItem) || [];
      setItems(convertedItems);
      setError(null);
    } catch (err) {
      console.error('Error fetching shopping items:', err);
      setError('Failed to load shopping items');
    } finally {
      setLoading(false);
    }
  };

  // Add new item
  const addItem = async (item: Omit<ShoppingItem, 'id' | 'addedAt'>, currentUserId: string) => {
    try {
      const dbItem = convertToDbItem(item, currentUserId);
      
      const { data, error } = await supabase
        .from('shopping_items')
        .insert([dbItem])
        .select()
        .single();

      if (error) throw error;

      const newItem = convertToAppItem(data);
      setItems(prev => [newItem, ...prev]);
      return newItem;
    } catch (err) {
      console.error('Error adding shopping item:', err);
      throw new Error('Failed to add shopping item');
    }
  };

  // Update item
  const updateItem = async (itemId: string, updates: Partial<ShoppingItem>) => {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .update({
          name: updates.name,
          completed: updates.completed
        })
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      ));
    } catch (err) {
      console.error('Error updating shopping item:', err);
      throw new Error('Failed to update shopping item');
    }
  };

  // Delete item
  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Error deleting shopping item:', err);
      throw new Error('Failed to delete shopping item');
    }
  };

  useEffect(() => {
    fetchItems();

    // Set up real-time subscription
    const subscription = supabase
      .channel('shopping_items_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'shopping_items' },
        () => {
          fetchItems(); // Refetch when data changes
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    refetch: fetchItems
  };
};