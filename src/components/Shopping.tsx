import React, { useState, useRef } from 'react';
import { ShoppingCart, Plus, Mic, MicOff, Check, X, User, AlertCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useShoppingItems } from '../hooks/useShoppingItems';
import { ShoppingItem, ShoppingList } from '../types';
import { USERS } from '../data/users';

const Shopping: React.FC = () => {
  const { currentUser } = useUser();
  const { items, addItem, updateItem, deleteItem, loading } = useShoppingItems();
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemPriority, setNewItemPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newItemNotes, setNewItemNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in your browser');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      parseVoiceInput(transcript);
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const parseVoiceInput = (transcript: string) => {
    // Simple parsing - you can make this more sophisticated
    const text = transcript.toLowerCase();
    
    // Try to extract quantity and item name
    const quantityMatch = text.match(/(\d+(?:\.\d+)?)\s*(kg|liter|liters|packet|packets|bottle|bottles|piece|pieces)?/);
    
    if (quantityMatch) {
      const quantity = quantityMatch[1] + (quantityMatch[2] ? ' ' + quantityMatch[2] : '');
      const itemName = text.replace(quantityMatch[0], '').trim();
      setNewItemQuantity(quantity);
      setNewItemName(itemName);
    } else {
      setNewItemName(text);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim() || !currentUser) return;

    setIsSubmitting(true);
    
    try {
      const newItem: Omit<ShoppingItem, 'id' | 'addedAt'> = {
        name: newItemName.trim(),
        quantity: newItemQuantity.trim() || undefined,
        assignedTo: assignedTo || undefined,
        priority: newItemPriority,
        notes: newItemNotes.trim() || undefined,
        completed: false,
        addedBy: currentUser.id,
      };

      await addItem(newItem, currentUser.id);

      // Reset form
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemNotes('');
      setAssignedTo('');
      setNewItemPriority('medium');
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleItemCompletion = async (item: ShoppingItem) => {
    try {
      await updateItem(item.id, { completed: !item.completed });
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item. Please try again.');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem(itemId);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const clearCompletedItems = async () => {
    try {
      const completedItems = items.filter(item => item.completed);
      await Promise.all(completedItems.map(item => deleteItem(item.id)));
    } catch (error) {
      console.error('Error clearing completed items:', error);
      alert('Failed to clear completed items. Please try again.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeItems = items.filter(item => !item.completed);
  const completedItems = items.filter(item => item.completed);

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-2 md:p-3 rounded-lg md:rounded-xl">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Shopping List</h1>
              <p className="text-gray-600 text-sm md:text-base">Shared Shopping List</p>
            </div>
          </div>
          {completedItems.length > 0 && (
            <button
              onClick={clearCompletedItems}
              className="px-3 md:px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 text-sm md:text-base"
            >
              <span className="hidden md:inline">Clear Completed</span>
              <span className="md:hidden">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Item Form */}
      <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-4">Add New Item</h2>
        
        <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g., Milk, Bread, Vegetables"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              />
              <button
                onClick={isListening ? stopVoiceInput : startVoiceInput}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  isListening 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <input
              type="text"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(e.target.value)}
              placeholder="e.g., 2 liters, 1 kg, 3 packets"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
            >
              <option value="">Anyone can buy</option>
              {USERS.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={newItemPriority}
              onChange={(e) => setNewItemPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
          <input
            type="text"
            value={newItemNotes}
            onChange={(e) => setNewItemNotes(e.target.value)}
            placeholder="e.g., Brand preference, specific requirements"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
          />
        </div>

        <button
          onClick={handleAddItem}
          disabled={!newItemName.trim() || isSubmitting}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 text-base"
        >
          <Plus className="w-5 h-5 inline mr-2" />
          {isSubmitting ? 'Adding...' : 'Add Item'}
        </button>
      </div>

      {/* Shopping Items */}
      <div className="space-y-4 md:space-y-6">
        {/* Active Items */}
        {activeItems.length > 0 && (
          <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-4">
              Shopping List ({activeItems.length} items)
            </h2>
            <div className="space-y-3">
              {activeItems.map((item) => {
                const assignedUser = item.assignedTo ? USERS.find(u => u.id === item.assignedTo) : null;
                const addedByUser = USERS.find(u => u.id === item.addedBy);
                
                return (
                  <div key={item.id} className="flex items-center space-x-3 md:space-x-4 p-3 md:p-4 bg-white/50 rounded-lg md:rounded-xl">
                    <button
                      onClick={() => toggleItemCompletion(item)}
                      className="w-5 h-5 md:w-6 md:h-6 border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-green-500 transition-colors duration-200 flex-shrink-0"
                    >
                      {item.completed && <Check className="w-3 h-3 md:w-4 md:h-4 text-green-500" />}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-800 text-sm md:text-base">{item.name}</h3>
                        {item.quantity && (
                          <span className="text-xs md:text-sm text-gray-600">({item.quantity})</span>
                        )}
                        <span className={`px-1.5 py-0.5 md:px-2 md:py-1 text-xs rounded-full ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                      
                      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 text-xs md:text-sm text-gray-600 space-y-1 md:space-y-0">
                        {assignedUser && (
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>Assigned to {assignedUser.name}</span>
                          </div>
                        )}
                        <span className="hidden md:inline">Added by {addedByUser?.name}</span>
                        <span className="md:hidden">{addedByUser?.name}</span>
                        {item.notes && (
                          <div className="flex items-center space-x-1">
                            <AlertCircle className="w-4 h-4" />
                            <span>{item.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 md:p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 flex-shrink-0"
                    >
                      <X className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Items */}
        {completedItems.length > 0 && (
          <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-4">
              Completed ({completedItems.length} items)
            </h2>
            <div className="space-y-3">
              {completedItems.map((item) => {
                const addedByUser = USERS.find(u => u.id === item.addedBy);
                
                return (
                  <div key={item.id} className="flex items-center space-x-3 md:space-x-4 p-3 md:p-4 bg-green-50 rounded-lg md:rounded-xl opacity-75">
                    <button
                      onClick={() => toggleItemCompletion(item)}
                      className="w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"
                    >
                      <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </button>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800 line-through text-sm md:text-base">{item.name}</h3>
                      <span className="text-xs md:text-sm text-gray-600">Added by {addedByUser?.name}</span>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 md:p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 flex-shrink-0"
                    >
                      <X className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {items.length === 0 && (
          <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-8 md:p-12 text-center">
            <ShoppingCart className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base md:text-lg font-medium text-gray-800 mb-2">No items in your shopping list</h3>
            <p className="text-gray-600 text-sm md:text-base">Add your first item above or use voice input to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shopping;