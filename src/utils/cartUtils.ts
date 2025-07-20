import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { Product } from "./marketplaceUtils";

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  vendorId: string;
  vendorName: string;
  imageUrl?: string;
}

export interface Cart {
  id?: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  updatedAt: any;
}

/**
 * Add a product to the user's cart
 * @param userId The user ID
 * @param product The product to add
 * @param quantity The quantity to add
 * @returns Promise<void>
 */
export const addToCart = async (
  userId: string,
  product: Product,
  quantity: number
): Promise<void> => {
  try {
    // Check if cart exists for this user
    const cartRef = doc(db, "carts", userId);
    const cartSnap = await getDoc(cartRef);

    if (cartSnap.exists()) {
      // Cart exists, update it
      const cartData = cartSnap.data() as Cart;

      // Check if product already exists in cart
      const existingItemIndex = cartData.items.findIndex(
        (item) => item.productId === product.id
      );

      if (existingItemIndex >= 0) {
        // Product exists in cart, update quantity
        const updatedItems = [...cartData.items];
        updatedItems[existingItemIndex].quantity += quantity;

        await updateDoc(cartRef, {
          items: updatedItems,
          totalAmount: cartData.totalAmount + product.price * quantity,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Product doesn't exist in cart, add it
        const newItem: CartItem = {
          id: `${product.id}-${Date.now()}`,
          productId: product.id!,
          productName: product.name,
          price: product.price,
          quantity: quantity,
          vendorId: product.vendorId,
          vendorName: product.vendorName,
          imageUrl:
            product.imageUrls && product.imageUrls.length > 0
              ? product.imageUrls[0]
              : undefined,
        };

        await updateDoc(cartRef, {
          items: arrayUnion(newItem),
          totalAmount: cartData.totalAmount + product.price * quantity,
          updatedAt: serverTimestamp(),
        });
      }
    } else {
      // Cart doesn't exist, create it
      const newItem: CartItem = {
        id: `${product.id}-${Date.now()}`,
        productId: product.id!,
        productName: product.name,
        price: product.price,
        quantity: quantity,
        vendorId: product.vendorId,
        vendorName: product.vendorName,
        imageUrl:
          product.imageUrls && product.imageUrls.length > 0
            ? product.imageUrls[0]
            : undefined,
      };

      await setDoc(cartRef, {
        userId: userId,
        items: [newItem],
        totalAmount: product.price * quantity,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
};

/**
 * Remove an item from the user's cart
 * @param userId The user ID
 * @param itemId The cart item ID to remove
 * @returns Promise<void>
 */
export const removeFromCart = async (
  userId: string,
  itemId: string
): Promise<void> => {
  try {
    const cartRef = doc(db, "carts", userId);
    const cartSnap = await getDoc(cartRef);

    if (cartSnap.exists()) {
      const cartData = cartSnap.data() as Cart;
      const itemToRemove = cartData.items.find((item) => item.id === itemId);

      if (itemToRemove) {
        const updatedItems = cartData.items.filter(
          (item) => item.id !== itemId
        );

        await updateDoc(cartRef, {
          items: updatedItems,
          totalAmount:
            cartData.totalAmount - itemToRemove.price * itemToRemove.quantity,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    console.error("Error removing from cart:", error);
    throw error;
  }
};

/**
 * Update the quantity of an item in the user's cart
 * @param userId The user ID
 * @param itemId The cart item ID to update
 * @param quantity The new quantity
 * @returns Promise<void>
 */
export const updateCartItemQuantity = async (
  userId: string,
  itemId: string,
  quantity: number
): Promise<void> => {
  try {
    if (quantity <= 0) {
      // If quantity is 0 or negative, remove the item
      await removeFromCart(userId, itemId);
      return;
    }

    const cartRef = doc(db, "carts", userId);
    const cartSnap = await getDoc(cartRef);

    if (cartSnap.exists()) {
      const cartData = cartSnap.data() as Cart;
      const itemIndex = cartData.items.findIndex((item) => item.id === itemId);

      if (itemIndex >= 0) {
        const item = cartData.items[itemIndex];
        const quantityDiff = quantity - item.quantity;
        const updatedItems = [...cartData.items];
        updatedItems[itemIndex].quantity = quantity;

        await updateDoc(cartRef, {
          items: updatedItems,
          totalAmount: cartData.totalAmount + item.price * quantityDiff,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    console.error("Error updating cart item quantity:", error);
    throw error;
  }
};

/**
 * Get the user's cart
 * @param userId The user ID
 * @returns Promise<Cart | null>
 */
export const getCart = async (userId: string): Promise<Cart | null> => {
  try {
    const cartRef = doc(db, "carts", userId);
    const cartSnap = await getDoc(cartRef);

    if (cartSnap.exists()) {
      const cartData = cartSnap.data() as Cart;
      return {
        ...cartData,
        id: cartSnap.id,
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting cart:", error);
    return null;
  }
};

/**
 * Clear the user's cart
 * @param userId The user ID
 * @returns Promise<void>
 */
export const clearCart = async (userId: string): Promise<void> => {
  try {
    const cartRef = doc(db, "carts", userId);
    await updateDoc(cartRef, {
      items: [],
      totalAmount: 0,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    throw error;
  }
};
