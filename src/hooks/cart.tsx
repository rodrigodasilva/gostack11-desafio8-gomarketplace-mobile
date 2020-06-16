import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { Alert } from 'react-native';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsOnLocalStorage = await AsyncStorage.getItem(
        '@GoMarketPlace:cart',
      );

      if (productsOnLocalStorage) {
        setProducts(JSON.parse(productsOnLocalStorage));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productIndexInCart = products.findIndex(
        item => item.id === product.id,
      );

      if (productIndexInCart === -1) {
        const newProduct = { ...product, quantity: 1 };
        setProducts([...products, newProduct]);
        await AsyncStorage.setItem(
          '@GoMarketPlace:cart',
          JSON.stringify([...products, newProduct]),
        );
        return;
      }

      const arrayWithANewProduct = products;
      arrayWithANewProduct[productIndexInCart].quantity =
        products[productIndexInCart].quantity + 1;

      setProducts(arrayWithANewProduct);

      await AsyncStorage.setItem(
        '@GoMarketPlace:cart',
        JSON.stringify(arrayWithANewProduct),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const incrementtedProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      setProducts(incrementtedProducts);
      await AsyncStorage.setItem(
        '@GoMarketPlace:cart',
        JSON.stringify(incrementtedProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const decrementtedProducts = products.map(product => {
        if (product.id === id) {
          if (product.quantity === 0) {
            Alert.alert('Erro', 'Quantidade não pode ser menor que zero');
            return product;
          }
          return { ...product, quantity: product.quantity - 1 };
        }

        return product;
      });

      setProducts(decrementtedProducts);
      await AsyncStorage.setItem(
        '@GoMarketPlace:cart',
        JSON.stringify(decrementtedProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
