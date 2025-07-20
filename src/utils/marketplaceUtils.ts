import { db, storage } from "./firebase";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { debug } from "./debugging";

// Product interfaces
export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrls: string[];
  stock: number;
  vendorId: string;
  vendorName: string;
  isAvailable: boolean;
  specifications?: Record<string, string>;
  createdAt?: any;
  updatedAt?: any;
}

// Service interfaces
export interface Service {
  id?: string;
  title: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: string;
  expertId: string;
  expertName: string;
  isAvailable: boolean;
  imageUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}

// Order interfaces
export interface Order {
  id?: string;
  products: OrderItem[];
  customerId: string;
  customerName: string;
  customerEmail: string;
  vendorId: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentStatus: "pending" | "paid" | "failed";
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
}

// Booking interfaces
export interface Booking {
  id?: string;
  serviceId: string;
  serviceName: string;
  expertId: string;
  expertName: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  date: any; // Timestamp
  duration: number; // in minutes
  status: "pending" | "confirmed" | "completed" | "cancelled";
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "failed";
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

// Product CRUD operations
export const createProduct = async (
  productData: Omit<Product, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const now = serverTimestamp();
    const productRef = await addDoc(collection(db, "products"), {
      ...productData,
      createdAt: now,
      updatedAt: now,
    });

    debug("Marketplace", `Product created with ID: ${productRef.id}`);
    return productRef.id;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
};

export const getProduct = async (
  productId: string
): Promise<Product | null> => {
  try {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      return { id: productSnap.id, ...productSnap.data() } as Product;
    }
    return null;
  } catch (error) {
    console.error("Error getting product:", error);
    return null;
  }
};

export const updateProduct = async (
  productId: string,
  productData: Partial<Product>
): Promise<void> => {
  try {
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, {
      ...productData,
      updatedAt: serverTimestamp(),
    });

    debug("Marketplace", `Product updated: ${productId}`);
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    const productRef = doc(db, "products", productId);

    // Get product data to delete images if necessary
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      const productData = productSnap.data() as Product;

      // Delete product images from storage if they exist
      if (productData.imageUrls && productData.imageUrls.length > 0) {
        for (const imageUrl of productData.imageUrls) {
          try {
            // Extract the path from the URL
            const imagePath = imageUrl.split("?")[0].split("/o/")[1];
            if (imagePath) {
              const decodedPath = decodeURIComponent(imagePath);
              const imageRef = ref(storage, decodedPath);
              await deleteObject(imageRef);
            }
          } catch (imgError) {
            console.error("Error deleting product image:", imgError);
            // Continue with deletion even if image deletion fails
          }
        }
      }
    }

    // Delete the product document
    await deleteDoc(productRef);

    debug("Marketplace", `Product deleted: ${productId}`);
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

export const getVendorProducts = async (
  vendorId: string
): Promise<Product[]> => {
  try {
    const productsQuery = query(
      collection(db, "products"),
      where("vendorId", "==", vendorId),
      orderBy("createdAt", "desc")
    );

    const productsSnapshot = await getDocs(productsQuery);
    const products: Product[] = [];

    productsSnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });

    return products;
  } catch (error) {
    console.error("Error getting vendor products:", error);
    return [];
  }
};

export const getAvailableProducts = async (
  category?: string,
  limitCount = 20
): Promise<Product[]> => {
  try {
    let productsQuery;

    if (category) {
      productsQuery = query(
        collection(db, "products"),
        where("isAvailable", "==", true),
        where("category", "==", category),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    } else {
      productsQuery = query(
        collection(db, "products"),
        where("isAvailable", "==", true),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    }

    const productsSnapshot = await getDocs(productsQuery);
    const products: Product[] = [];

    productsSnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });

    return products;
  } catch (error) {
    console.error("Error getting available products:", error);
    return [];
  }
};

// Service CRUD operations
export const createService = async (
  serviceData: Omit<Service, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const now = serverTimestamp();
    const serviceRef = await addDoc(collection(db, "services"), {
      ...serviceData,
      createdAt: now,
      updatedAt: now,
    });

    debug("Marketplace", `Service created with ID: ${serviceRef.id}`);
    return serviceRef.id;
  } catch (error) {
    console.error("Error creating service:", error);
    throw error;
  }
};

export const getService = async (
  serviceId: string
): Promise<Service | null> => {
  try {
    const serviceRef = doc(db, "services", serviceId);
    const serviceSnap = await getDoc(serviceRef);

    if (serviceSnap.exists()) {
      return { id: serviceSnap.id, ...serviceSnap.data() } as Service;
    }
    return null;
  } catch (error) {
    console.error("Error getting service:", error);
    return null;
  }
};

export const updateService = async (
  serviceId: string,
  serviceData: Partial<Service>
): Promise<void> => {
  try {
    const serviceRef = doc(db, "services", serviceId);
    await updateDoc(serviceRef, {
      ...serviceData,
      updatedAt: serverTimestamp(),
    });

    debug("Marketplace", `Service updated: ${serviceId}`);
  } catch (error) {
    console.error("Error updating service:", error);
    throw error;
  }
};

export const deleteService = async (serviceId: string): Promise<void> => {
  try {
    const serviceRef = doc(db, "services", serviceId);

    // Get service data to delete image if necessary
    const serviceSnap = await getDoc(serviceRef);
    if (serviceSnap.exists()) {
      const serviceData = serviceSnap.data() as Service;

      // Delete service image from storage if it exists
      if (serviceData.imageUrl) {
        try {
          // Extract the path from the URL
          const imagePath = serviceData.imageUrl.split("?")[0].split("/o/")[1];
          if (imagePath) {
            const decodedPath = decodeURIComponent(imagePath);
            const imageRef = ref(storage, decodedPath);
            await deleteObject(imageRef);
          }
        } catch (imgError) {
          console.error("Error deleting service image:", imgError);
          // Continue with deletion even if image deletion fails
        }
      }
    }

    // Delete the service document
    await deleteDoc(serviceRef);

    debug("Marketplace", `Service deleted: ${serviceId}`);
  } catch (error) {
    console.error("Error deleting service:", error);
    throw error;
  }
};

export const getExpertServices = async (
  expertId: string
): Promise<Service[]> => {
  try {
    const servicesQuery = query(
      collection(db, "services"),
      where("expertId", "==", expertId),
      orderBy("createdAt", "desc")
    );

    const servicesSnapshot = await getDocs(servicesQuery);
    const services: Service[] = [];

    servicesSnapshot.forEach((doc) => {
      services.push({ id: doc.id, ...doc.data() } as Service);
    });

    return services;
  } catch (error) {
    console.error("Error getting expert services:", error);
    return [];
  }
};

export const getAvailableServices = async (
  category?: string,
  limitCount = 20
): Promise<Service[]> => {
  try {
    let servicesQuery;

    if (category) {
      servicesQuery = query(
        collection(db, "services"),
        where("isAvailable", "==", true),
        where("category", "==", category),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    } else {
      servicesQuery = query(
        collection(db, "services"),
        where("isAvailable", "==", true),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    }

    const servicesSnapshot = await getDocs(servicesQuery);
    const services: Service[] = [];

    servicesSnapshot.forEach((doc) => {
      services.push({ id: doc.id, ...doc.data() } as Service);
    });

    return services;
  } catch (error) {
    console.error("Error getting available services:", error);
    return [];
  }
};

// Order CRUD operations
export const createOrder = async (
  orderData: Omit<Order, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const now = serverTimestamp();
    const orderRef = await addDoc(collection(db, "orders"), {
      ...orderData,
      createdAt: now,
      updatedAt: now,
    });

    debug("Marketplace", `Order created with ID: ${orderRef.id}`);
    return orderRef.id;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

export const getOrder = async (orderId: string): Promise<Order | null> => {
  try {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (orderSnap.exists()) {
      return { id: orderSnap.id, ...orderSnap.data() } as Order;
    }
    return null;
  } catch (error) {
    console.error("Error getting order:", error);
    return null;
  }
};

export const updateOrder = async (
  orderId: string,
  orderData: Partial<Order>
): Promise<void> => {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      ...orderData,
      updatedAt: serverTimestamp(),
    });

    debug("Marketplace", `Order updated: ${orderId}`);
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};

export const getVendorOrders = async (vendorId: string): Promise<Order[]> => {
  try {
    const ordersQuery = query(
      collection(db, "orders"),
      where("vendorId", "==", vendorId),
      orderBy("createdAt", "desc")
    );

    const ordersSnapshot = await getDocs(ordersQuery);
    const orders: Order[] = [];

    ordersSnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() } as Order);
    });

    return orders;
  } catch (error) {
    console.error("Error getting vendor orders:", error);
    return [];
  }
};

export const getCustomerOrders = async (
  customerId: string
): Promise<Order[]> => {
  try {
    const ordersQuery = query(
      collection(db, "orders"),
      where("customerId", "==", customerId),
      orderBy("createdAt", "desc")
    );

    const ordersSnapshot = await getDocs(ordersQuery);
    const orders: Order[] = [];

    ordersSnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() } as Order);
    });

    return orders;
  } catch (error) {
    console.error("Error getting customer orders:", error);
    return [];
  }
};

// Booking CRUD operations
export const createBooking = async (
  bookingData: Omit<Booking, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const now = serverTimestamp();
    const bookingRef = await addDoc(collection(db, "bookings"), {
      ...bookingData,
      createdAt: now,
      updatedAt: now,
    });

    debug("Marketplace", `Booking created with ID: ${bookingRef.id}`);
    return bookingRef.id;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

export const getBooking = async (
  bookingId: string
): Promise<Booking | null> => {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (bookingSnap.exists()) {
      return { id: bookingSnap.id, ...bookingSnap.data() } as Booking;
    }
    return null;
  } catch (error) {
    console.error("Error getting booking:", error);
    return null;
  }
};

export const updateBooking = async (
  bookingId: string,
  bookingData: Partial<Booking>
): Promise<void> => {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, {
      ...bookingData,
      updatedAt: serverTimestamp(),
    });

    debug("Marketplace", `Booking updated: ${bookingId}`);
  } catch (error) {
    console.error("Error updating booking:", error);
    throw error;
  }
};

export const getExpertBookings = async (
  expertId: string
): Promise<Booking[]> => {
  try {
    const bookingsQuery = query(
      collection(db, "bookings"),
      where("expertId", "==", expertId),
      orderBy("createdAt", "desc")
    );

    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookings: Booking[] = [];

    bookingsSnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as Booking);
    });

    return bookings;
  } catch (error) {
    console.error("Error getting expert bookings:", error);
    return [];
  }
};

export const getClientBookings = async (
  clientId: string
): Promise<Booking[]> => {
  try {
    const bookingsQuery = query(
      collection(db, "bookings"),
      where("clientId", "==", clientId),
      orderBy("createdAt", "desc")
    );

    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookings: Booking[] = [];

    bookingsSnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as Booking);
    });

    return bookings;
  } catch (error) {
    console.error("Error getting client bookings:", error);
    return [];
  }
};

// Helper function to upload product images
export const uploadProductImage = async (
  file: File,
  vendorId: string
): Promise<string> => {
  try {
    const fileExtension = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}.${fileExtension}`;
    const filePath = `marketplace/products/${vendorId}/${fileName}`;
    const storageRef = ref(storage, filePath);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading product image:", error);
    throw error;
  }
};

// Helper function to upload service image
export const uploadServiceImage = async (
  file: File,
  expertId: string
): Promise<string> => {
  try {
    const fileExtension = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}.${fileExtension}`;
    const filePath = `marketplace/services/${expertId}/${fileName}`;
    const storageRef = ref(storage, filePath);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading service image:", error);
    throw error;
  }
};
